from django.contrib import admin, messages
from django.urls import path, reverse
from django.shortcuts import redirect, get_object_or_404
from django.utils.html import format_html

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Shows an order's line items directly inside the Order page,
    instead of needing to click into a separate OrderItem list."""
    model = OrderItem
    extra = 0
    readonly_fields = ("title", "author", "price", "qty", "img")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id", "user", "payment_method", "payment_status",
        "total_amount", "current_status", "placed_at", "release_button",
    )
    list_filter = ("payment_method", "payment_status", "status")
    search_fields = ("order_id", "user__username", "user__email", "razorpay_order_id", "razorpay_payment_id")
    readonly_fields = (
        "order_id", "razorpay_order_id", "razorpay_payment_id", "razorpay_signature",
        "placed_at", "packed_at", "shipped_at", "out_for_delivery_at", "delivered_at",
    )
    inlines = [OrderItemInline]
    date_hierarchy = "placed_at"
    actions = ["advance_selected_orders"]

    # ---- per-row "Release" button (list page) ----
    def release_button(self, obj):
        if obj.status == "delivered":
            return format_html('<span style="color:#16a34a;font-weight:600;">Delivered ✓</span>')
        url = reverse("admin:orders_order_release", args=[obj.pk])
        next_label = dict(Order.STATUS_CHOICES)[Order.STATUS_STEPS[Order.STATUS_STEPS.index(obj.status) + 1]]
        return format_html(
            '<a class="button" href="{}" style="white-space:nowrap;">Release → {}</a>', url, next_label
        )
    release_button.short_description = "Advance stage"

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:order_id>/release/",
                self.admin_site.admin_view(self.release_order_view),
                name="orders_order_release",
            ),
        ]
        return custom + urls

    def release_order_view(self, request, order_id):
        order = get_object_or_404(Order, pk=order_id)
        if order.advance_status():
            self.message_user(
                request, f"{order.order_id} moved to '{order.current_status}'.", messages.SUCCESS
            )
        else:
            self.message_user(request, f"{order.order_id} is already Delivered.", messages.WARNING)
        return redirect(request.META.get("HTTP_REFERER") or reverse("admin:orders_order_changelist"))

    # ---- bulk action (works from the checkbox list too) ----
    @admin.action(description="Release selected orders to next stage")
    def advance_selected_orders(self, request, queryset):
        advanced, already_done = 0, 0
        for order in queryset:
            if order.advance_status():
                advanced += 1
            else:
                already_done += 1
        if advanced:
            self.message_user(request, f"Advanced {advanced} order(s) to their next stage.", messages.SUCCESS)
        if already_done:
            self.message_user(request, f"{already_done} order(s) were already Delivered.", messages.WARNING)
