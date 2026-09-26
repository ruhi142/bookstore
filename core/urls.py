from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("contact/", views.contact, name="contact"),
    path("wishlist/", views.wishlist, name="wishlist"),
    path("careers/", views.careers, name="careers"),
    path("privacy-policy/", views.privacy_policy, name="privacy_policy"),
    path("subscribe/", views.subscribe, name="subscribe"),
]
