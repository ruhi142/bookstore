from django.contrib.auth.decorators import login_required
from django.http import Http404
from django.shortcuts import render, get_object_or_404
from django.views.decorators.cache import never_cache

from .models import Order


@login_required(login_url="core:home")
@never_cache
def my_orders(request):
    orders = request.user.orders.all()
    return render(request, "orders/my_orders.html", {"orders": orders})


@login_required(login_url="core:home")
@never_cache
def track_order(request):
    order_id = request.GET.get("order_id", "").strip()
    order = None
    not_found = False

    if order_id:
        order = Order.objects.filter(order_id__iexact=order_id, user=request.user).first()
        not_found = order is None
    # No order_id in the URL yet -> don't show anything until the user
    # actually searches. (Previously this fell back to showing the user's
    # most recent order automatically, even before they'd typed anything.)

    return render(request, "orders/track_order.html", {
        "order": order,
        "not_found": not_found,
        "order_id_searched": order_id,
        "searched": bool(order_id),
    })


@login_required(login_url="core:home")
@never_cache
def invoice(request, order_id):
    order = get_object_or_404(Order, order_id__iexact=order_id, user=request.user)
    return render(request, "orders/invoice.html", {"order": order})
