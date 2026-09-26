from django.contrib import admin

from .models import Address, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone")
    search_fields = ("user__username", "user__email", "phone")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "full_name", "city", "state", "pincode", "is_default")
    list_filter = ("label", "is_default", "state")
    search_fields = ("user__username", "full_name", "phone", "city", "pincode")
