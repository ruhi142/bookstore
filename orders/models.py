import random
from django.conf import settings
from django.db import models
from django.utils import timezone


def generate_order_id():
    return f"INK-{timezone.now().year}-{random.randint(10000, 99999)}"


class Order(models.Model):
    PAYMENT_CHOICES = [
        ("razorpay", "Razorpay (UPI / Card / Netbanking / Wallet)"),
        ("cod", "Cash on Delivery"),
        # Kept so any orders placed before this change still display correctly.
        ("upi", "UPI"),
        ("card", "Credit / Debit Card"),
        ("netbanking", "Net Banking"),
        ("wallet", "Wallet"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    order_id = models.CharField(max_length=30, unique=True, default=generate_order_id)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="razorpay")
    subtotal = models.PositiveIntegerField(default=0)
    delivery_fee = models.PositiveIntegerField(default=0)
    total_amount = models.PositiveIntegerField(default=0)

    # ---- Razorpay ----
    # payment_status is "paid" only once we've verified Razorpay's signature
    # server-side (see cart/views.py verify_payment); "cod" for Cash on
    # Delivery orders, which never touch Razorpay at all.
    PAYMENT_STATUS_CHOICES = [
        ("paid", "Paid"),
        ("cod", "Cash on Delivery"),
    ]
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default="cod")
    razorpay_order_id = models.CharField(max_length=64, blank=True, default="")
    razorpay_payment_id = models.CharField(max_length=64, blank=True, default="")
    razorpay_signature = models.CharField(max_length=128, blank=True, default="")

    # Snapshot of the delivery address chosen at checkout — copied in at
    # order-placement time (not a live FK) so editing/deleting a saved
    # address later never changes what a past order says it was shipped to.
    shipping_label = models.CharField(max_length=10, blank=True, default="Home")
    shipping_full_name = models.CharField(max_length=120, blank=True, default="")
    shipping_phone = models.CharField(max_length=15, blank=True, default="")
    shipping_line1 = models.CharField(max_length=200, blank=True, default="")
    shipping_line2 = models.CharField(max_length=200, blank=True, default="")
    shipping_city = models.CharField(max_length=100, blank=True, default="")
    shipping_state = models.CharField(max_length=100, blank=True, default="")
    shipping_pincode = models.CharField(max_length=10, blank=True, default="")
    placed_at = models.DateTimeField(default=timezone.now)

    # ---- manual, admin-controlled tracking status ----
    # The order no longer advances on its own after a fixed number of days.
    # It stays on whatever stage it's on until a staff member clicks
    # "Release to next stage" in the admin panel, which bumps `status` to
    # the next step and stamps the matching *_at field with the real time
    # that happened.
    STATUS_STEPS = ["placed", "packed", "shipped", "out_for_delivery", "delivered"]
    STATUS_LABELS = {
        "placed": "Order Placed",
        "packed": "Packed",
        "shipped": "Shipped",
        "out_for_delivery": "Out for Delivery",
        "delivered": "Delivered",
    }
    STATUS_CHOICES = [
        ("placed", "Order Placed"),
        ("packed", "Packed"),
        ("shipped", "Shipped"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="placed")
    packed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    out_for_delivery_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-placed_at"]

    def __str__(self):
        return self.order_id

    @property
    def timeline(self):
        current_index = self.STATUS_STEPS.index(self.status)
        steps_meta = [
            ("placed", self.placed_at),
            ("packed", self.packed_at),
            ("shipped", self.shipped_at),
            ("out_for_delivery", self.out_for_delivery_at),
            ("delivered", self.delivered_at),
        ]
        steps = []
        for i, (key, stamp) in enumerate(steps_meta):
            steps.append({
                "label": self.STATUS_LABELS[key],
                "time": stamp,
                "done": i <= current_index,
            })
        return steps

    @property
    def current_status(self):
        return self.STATUS_LABELS[self.status]

    def advance_status(self):
        """Move to the next stage and stamp it with the current time.
        Returns True if it advanced, False if it was already Delivered."""
        idx = self.STATUS_STEPS.index(self.status)
        if idx >= len(self.STATUS_STEPS) - 1:
            return False
        next_key = self.STATUS_STEPS[idx + 1]
        self.status = next_key
        setattr(self, f"{next_key}_at", timezone.now())
        self.save(update_fields=["status", f"{next_key}_at"])
        return True

    @property
    def expected_delivery(self):
        # Estimate only — the real Delivered time is whatever gets stamped
        # in delivered_at once staff release the order to that stage.
        if self.delivered_at:
            return self.delivered_at
        return (self.placed_at + timezone.timedelta(days=3)).replace(hour=14, minute=0, second=0, microsecond=0)

    @property
    def has_shipping_address(self):
        return bool(self.shipping_line1)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    price = models.PositiveIntegerField()
    qty = models.PositiveIntegerField(default=1)
    img = models.CharField(max_length=255, blank=True)

    @property
    def line_total(self):
        return self.price * self.qty
