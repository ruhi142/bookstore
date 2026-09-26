import json
import razorpay
from django.conf import settings
from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from accounts.models import Address
from orders.models import Order, OrderItem


def view_cart(request):
    return render(request, "cart/cart.html")


def checkout(request):
    addresses = request.user.addresses.all() if request.user.is_authenticated else []
    return render(request, "cart/checkout.html", {
        "addresses": addresses,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
    })


def _razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def _compute_totals(items):
    subtotal = sum(int(i.get("price", 0)) * int(i.get("qty", 1)) for i in items)
    delivery_fee = 0 if subtotal >= 499 else 49
    return subtotal, delivery_fee, subtotal + delivery_fee


def _create_order_record(user, address, items, payment_method, payment_status,
                          razorpay_order_id="", razorpay_payment_id="", razorpay_signature=""):
    """Shared by both the COD path and the Razorpay-verified path so there's
    exactly one place that writes an Order + its OrderItems."""
    subtotal, delivery_fee, total = _compute_totals(items)
    order = Order.objects.create(
        user=user,
        payment_method=payment_method,
        payment_status=payment_status,
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total,
        shipping_label=address.label,
        shipping_full_name=address.full_name,
        shipping_phone=address.phone,
        shipping_line1=address.line1,
        shipping_line2=address.line2,
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_pincode=address.pincode,
    )
    for i in items:
        OrderItem.objects.create(
            order=order,
            title=i.get("title", "")[:255],
            author=i.get("author", "")[:255],
            img=i.get("img", "")[:255],
            price=int(i.get("price", 0)),
            qty=int(i.get("qty", 1)),
        )
    return order


@login_required(login_url="core:home")
@require_POST
@csrf_protect
def add_address_ajax(request):
    """Saves a new delivery address from the checkout page itself (so the
    person never has to leave the flow to add one) and hands it straight
    back as JSON for the page to insert and auto-select."""
    label = request.POST.get("label", "Home").strip() or "Home"
    full_name = request.POST.get("full_name", "").strip()
    phone = request.POST.get("addr_phone", "").strip()
    line1 = request.POST.get("line1", "").strip()
    line2 = request.POST.get("line2", "").strip()
    city = request.POST.get("city", "").strip()
    state = request.POST.get("state", "").strip()
    pincode = request.POST.get("pincode", "").strip()

    missing = [f for f, v in [
        ("Full Name", full_name), ("Phone", phone), ("Address Line 1", line1),
        ("City", city), ("State", state), ("Pincode", pincode),
    ] if not v]
    if missing:
        return JsonResponse({"ok": False, "error": f"Please fill in: {', '.join(missing)}."}, status=400)

    address = Address.objects.create(
        user=request.user, label=label, full_name=full_name, phone=phone,
        line1=line1, line2=line2, city=city, state=state, pincode=pincode,
        is_default=not request.user.addresses.exists(),
    )
    return JsonResponse({"ok": True, "address": {
        "id": address.id, "label": address.label, "full_name": address.full_name,
        "phone": address.phone, "line1": address.line1, "line2": address.line2,
        "city": address.city, "state": address.state, "pincode": address.pincode,
        "is_default": address.is_default,
    }})


@login_required(login_url="core:home")
@require_POST
@csrf_protect
def place_order(request):
    """Cash on Delivery ONLY — never touches Razorpay. UPI/Card/Netbanking/
    Wallet go through create_razorpay_order + verify_payment below instead,
    since those need a real, verified payment before an Order is created."""
    try:
        data = json.loads(request.body)
        items = data.get("items", [])
        address_id = data.get("address_id")
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"ok": False, "error": "Invalid request."}, status=400)

    if not items:
        return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)

    address = Address.objects.filter(user=request.user, id=address_id).first()
    if not address:
        return JsonResponse({"ok": False, "error": "Please select a delivery address."}, status=400)

    order = _create_order_record(request.user, address, items, payment_method="cod", payment_status="cod")
    return JsonResponse({"ok": True, "order_id": order.order_id})


@login_required(login_url="core:home")
@require_POST
@csrf_protect
def create_razorpay_order(request):
    """Step 1 of a real payment: ask Razorpay to open an Order on THEIR side
    for the exact amount we calculate server-side (never trust an amount the
    browser sends), and hand the browser back just enough to open the
    Razorpay Checkout popup. No Order row is created in our own database
    yet — that only happens once the payment is verified below."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return JsonResponse({"ok": False, "error": "Payments aren't configured on this server yet."}, status=500)

    try:
        data = json.loads(request.body)
        items = data.get("items", [])
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"ok": False, "error": "Invalid request."}, status=400)

    if not items:
        return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)

    _, _, total = _compute_totals(items)
    amount_paise = total * 100  # Razorpay always wants the smallest currency unit

    client = _razorpay_client()
    try:
        razorpay_order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,  # auto-capture — money settles without a separate capture call
        })
    except Exception as exc:
        # Surface the real reason in DEBUG so a failed order-create is easy to
        # diagnose (bad/mismatched keys, amount below Razorpay's minimum,
        # inactive test account, etc.) instead of a generic 502 every time.
        detail = str(exc) if settings.DEBUG else "Could not start the payment. Please try again."
        return JsonResponse({"ok": False, "error": detail}, status=502)

    return JsonResponse({
        "ok": True,
        "razorpay_order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": settings.RAZORPAY_KEY_ID,
    })


@login_required(login_url="core:home")
@require_POST
@csrf_protect
def verify_payment(request):
    """Step 2: the browser posts back what Razorpay Checkout returned after
    the person paid. We verify the signature server-side (this is the part
    that actually proves the payment is genuine and wasn't forged/replayed
    by someone poking the API directly) and ONLY THEN create the real
    Order + OrderItems — same as place_order does for COD."""
    try:
        data = json.loads(request.body)
        items = data.get("items", [])
        payment_method = data.get("payment_method", "razorpay")
        address_id = data.get("address_id")
        razorpay_order_id = data.get("razorpay_order_id", "")
        razorpay_payment_id = data.get("razorpay_payment_id", "")
        razorpay_signature = data.get("razorpay_signature", "")
    except (json.JSONDecodeError, TypeError):
        return JsonResponse({"ok": False, "error": "Invalid request."}, status=400)

    if not items:
        return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)
    if not (razorpay_order_id and razorpay_payment_id and razorpay_signature):
        return JsonResponse({"ok": False, "error": "Missing payment details."}, status=400)

    address = Address.objects.filter(user=request.user, id=address_id).first()
    if not address:
        return JsonResponse({"ok": False, "error": "Please select a delivery address."}, status=400)

    client = _razorpay_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        return JsonResponse({"ok": False, "error": "Payment verification failed. If money was deducted, it will be auto-refunded."}, status=400)
    except Exception as exc:
        # Anything other than a signature mismatch (bad keys, network error to
        # Razorpay, etc.) used to fall through uncaught and return a bare 500
        # with no JSON body — the frontend's fetch(...).json() would then
        # throw, so the person only ever saw "Could not reach the server",
        # even though the payment itself may have gone through fine.
        detail = str(exc) if settings.DEBUG else "Could not verify the payment. Please try again."
        return JsonResponse({"ok": False, "error": detail}, status=502)

    order = _create_order_record(
        request.user, address, items, payment_method=payment_method, payment_status="paid",
        razorpay_order_id=razorpay_order_id, razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
    )
    return JsonResponse({"ok": True, "order_id": order.order_id})
