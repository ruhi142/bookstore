from django.urls import path
from . import views

app_name = "cart"

urlpatterns = [
    path("", views.view_cart, name="view_cart"),
    path("checkout/", views.checkout, name="checkout"),
    path("add-address/", views.add_address_ajax, name="add_address_ajax"),
    path("place-order/", views.place_order, name="place_order"),
    path("create-razorpay-order/", views.create_razorpay_order, name="create_razorpay_order"),
    path("verify-payment/", views.verify_payment, name="verify_payment"),
]
