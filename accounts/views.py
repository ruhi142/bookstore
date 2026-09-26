import logging

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.cache import never_cache

from .models import Profile, Address

logger = logging.getLogger(__name__)


def send_welcome_email(user, request=None):
    """Send a congratulations/welcome email after successful registration.

    Failures are logged rather than raised, so a broken mail server never
    breaks the signup flow itself.
    """
    context = {
        "first_name": user.first_name or user.username,
        "site_url": request.build_absolute_uri("/") if request else "/",
        "current_year": timezone.now().year,
    }
    subject = "Welcome to Inkwell Books \U0001F389"
    text_body = render_to_string("accounts/emails/welcome_email.txt", context)
    html_body = render_to_string("accounts/emails/welcome_email.html", context)

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_body, "text/html")
        email.send(fail_silently=False)
    except Exception:
        logger.exception("Failed to send welcome email to %s", user.email)


def login_view(request):
    next_url = request.POST.get("next") or "core:home"
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")

        user = None
        try:
            matched = User.objects.get(email__iexact=email)
            user = authenticate(request, username=matched.username, password=password)
        except User.DoesNotExist:
            user = None

        if user is not None:
            django_login(request, user)
            messages.success(request, f"Welcome back, {user.first_name or user.username}!", extra_tags="auth-success")
            return redirect(next_url)
        else:
            messages.error(request, "Incorrect email or password.", extra_tags="auth-login")
            return redirect(next_url)
    return redirect("core:home")


def send_password_reset_email(user, request=None):
    """Email the user a signed reset link. The link embeds the user's uid
    and a token from Django's default_token_generator, so nothing needs to
    be stored in the database and the link naturally expires
    (PASSWORD_RESET_TIMEOUT, 3 days by default).
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_path = reverse("accounts:reset_password", kwargs={"uidb64": uid, "token": token})
    context = {
        "first_name": user.first_name or user.username,
        "reset_url": request.build_absolute_uri(reset_path) if request else reset_path,
        "current_year": timezone.now().year,
    }
    subject = "Reset your Inkwell Books password"
    text_body = render_to_string("accounts/emails/password_reset_email.txt", context)
    html_body = render_to_string("accounts/emails/password_reset_email.html", context)

    try:
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_body, "text/html")
        email.send(fail_silently=False)
        return True
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        return False


def forgot_password_view(request):
    next_url = request.POST.get("next") or "core:home"
    if request.method == "POST":
        email = request.POST.get("email", "").strip()
        user = User.objects.filter(email__iexact=email).first()
        if user is not None:
            send_password_reset_email(user, request)
        # Always show the same message, whether or not the email matched an
        # account, so the form can't be used to probe which emails are registered.
        messages.success(
            request,
            "If an Inkwell account exists for that email, we've sent a password reset link.",
            extra_tags="auth-forgot",
        )
        return redirect(next_url)
    return redirect("core:home")


def reset_password_view(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    token_valid = user is not None and default_token_generator.check_token(user, token)

    if request.method == "POST" and token_valid:
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        if password != confirm_password:
            messages.error(request, "Those passwords don't match.", extra_tags="reset-password")
        elif len(password) < 6:
            messages.error(request, "Password must be at least 6 characters.", extra_tags="reset-password")
        else:
            user.set_password(password)
            user.save()
            django_login(request, user)
            messages.success(request, "Your password has been reset. You're now logged in.", extra_tags="auth-success")
            return redirect("core:home")

    return render(request, "accounts/reset_password.html", {"token_valid": token_valid})


def register_view(request):
    next_url = request.POST.get("next") or "core:home"
    if request.method == "POST":
        full_name = request.POST.get("name", "").strip()
        phone = request.POST.get("phone", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")

        if not full_name or not email or not password:
            messages.error(request, "Please fill in all required fields.", extra_tags="auth-register")
            return redirect(next_url)

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, "An account with this email already exists.", extra_tags="auth-register")
            return redirect(next_url)

        if len(password) < 6:
            messages.error(request, "Password must be at least 6 characters.", extra_tags="auth-register")
            return redirect(next_url)

        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=email, email=email, password=password,
            first_name=first_name, last_name=last_name,
        )
        Profile.objects.create(user=user, phone=phone)
        send_welcome_email(user, request)

        django_login(request, user)
        messages.success(request, f"Welcome to Inkwell, {first_name}!", extra_tags="auth-success")
        return redirect(next_url)
    return redirect("core:home")


def logout_view(request):
    django_logout(request)
    messages.success(request, "You've been logged out.", extra_tags="logout")
    return redirect(request.META.get("HTTP_REFERER", "/"))


@login_required(login_url="core:home")
@never_cache
def dashboard(request):
    orders = request.user.orders.all()
    profile, _ = Profile.objects.get_or_create(user=request.user)
    return render(request, "accounts/dashboard.html", {
        "orders": orders,
        "profile": profile,
        "total_spent": sum(o.total_amount for o in orders),
        "in_transit_count": sum(1 for o in orders if o.current_status != "Delivered"),
    })


@login_required(login_url="core:home")
@never_cache
def account_settings(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form_type = request.POST.get("form_type")

        if form_type == "profile":
            request.user.first_name = request.POST.get("first_name", "").strip()
            request.user.last_name = request.POST.get("last_name", "").strip()
            new_email = request.POST.get("email", "").strip()
            if new_email:
                request.user.email = new_email
            request.user.save()

            profile.phone = request.POST.get("phone", "").strip()
            if request.FILES.get("avatar"):
                profile.avatar = request.FILES["avatar"]
            profile.save()

            messages.success(request, "Your profile has been updated.", extra_tags="settings")
            return redirect("accounts:account_settings")

        elif form_type == "remove_avatar":
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save()
            messages.success(request, "Profile photo removed.", extra_tags="settings")
            return redirect("accounts:account_settings")

        elif form_type == "save_address":
            address_id = request.POST.get("address_id")
            address = Address.objects.filter(user=request.user, id=address_id).first() if address_id else Address(user=request.user)

            address.label = request.POST.get("label", "Home")
            address.full_name = request.POST.get("full_name", "").strip()
            address.phone = request.POST.get("addr_phone", "").strip()
            address.line1 = request.POST.get("line1", "").strip()
            address.line2 = request.POST.get("line2", "").strip()
            address.city = request.POST.get("city", "").strip()
            address.state = request.POST.get("state", "").strip()
            address.pincode = request.POST.get("pincode", "").strip()
            address.is_default = bool(request.POST.get("is_default")) or not request.user.addresses.exists()
            address.save()

            messages.success(request, "Address saved.", extra_tags="settings")
            return redirect("accounts:account_settings")

        elif form_type == "delete_address":
            Address.objects.filter(user=request.user, id=request.POST.get("address_id")).delete()
            if not request.user.addresses.filter(is_default=True).exists():
                first_remaining = request.user.addresses.first()
                if first_remaining:
                    first_remaining.is_default = True
                    first_remaining.save()
            messages.success(request, "Address removed.", extra_tags="settings")
            return redirect("accounts:account_settings")

        elif form_type == "set_default_address":
            address = request.user.addresses.filter(id=request.POST.get("address_id")).first()
            if address:
                address.is_default = True
                address.save()
            return redirect("accounts:account_settings")

    return render(request, "accounts/account_settings.html", {
        "profile": profile,
        "addresses": request.user.addresses.all(),
    })
