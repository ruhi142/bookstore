from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings

from .models import Subscriber

# Books shown in the "This Week's Best Sellers" grid on the homepage.
# Same shape as catalog/views.py's book dicts: title, author, price,
# old_price, discount, and img. Unlike catalog/views.py, img here is a
# FULL image URL (any source — Unsplash, Amazon, your own hosting, etc.),
# not just a bare Unsplash photo ID. Edit this list to change which books
# show up, their titles, authors, prices, or cover images.
BEST_SELLERS = [
    {"id": "best-0", "title": "The Alchemist", "author": "Paulo Coelho", "price": 328, "old_price": 399, "discount": 20, "img": "https://m.media-amazon.com/images/I/81UGPuNl7kL._UF1000,1000_QL80_.jpg"},
    {"id": "best-1", "title": "The Palace of Illusions", "author": "Chitra Banerjee Divakaruni", "price": 399, "old_price": 499, "discount": 20, "img": "https://m.media-amazon.com/images/I/81FeXONOe+L.jpg"},
    {"id": "fiction-0", "title": "The Silent Patient", "author": "Alex Michaelides", "price": 239, "old_price": 399, "discount": 40, "img": "https://covers.openlibrary.org/b/isbn/9781250301703-L.jpg"},
    {"id": "non-fiction-1", "title": "Sapiens", "author": "Yuval Noah Harari", "price": 249, "old_price": 499, "discount": 50, "img": "https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg"},
    {"id": "best-2", "title": "1984", "author": "George Orwell", "price": 149, "old_price": 399, "discount": 63, "img": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg"},
    {"id": "fiction-2", "title": "The Midnight Library", "author": "Matt Haig", "price": 299, "old_price": 449, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9781786892720-L.jpg"},
    {"id": "best-3", "title": "Ikigai", "author": "Héctor García", "price": 149, "old_price": 399, "discount": 63, "img": "https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg"},
    {"id": "non-fiction-2", "title": "Educated", "author": "Tara Westover", "price": 329, "old_price": 499, "discount": 34, "img": "https://covers.openlibrary.org/b/isbn/9780399590528-L.jpg"},
]


def home(request):
    return render(request, "core/home.html", {"best_sellers": BEST_SELLERS})


def about(request):
    return render(request, "core/about.html")


def contact(request):
    return render(request, "core/contact.html")


def wishlist(request):
    return render(request, "core/wishlist.html")


def careers(request):
    return render(request, "core/careers.html")


def privacy_policy(request):
    return render(request, "core/privacy_policy.html")


def subscribe(request):
    if request.method != "POST":
        return redirect("core:home")

    email = request.POST.get("email", "").strip()

    # No name field in the form -- if the visitor is logged in, use their
    # account name so we still have something to store/greet with.
    name = ""
    if request.user.is_authenticated:
        name = request.user.get_full_name() or request.user.username

    if not email:
        messages.error(request, "Please enter a valid email address.")
        return redirect(request.META.get("HTTP_REFERER", "core:home"))

    subscriber, created = Subscriber.objects.get_or_create(
        email__iexact=email,
        defaults={"name": name, "email": email},
    )

    if not created:
        # Already subscribed before — just make sure they're marked active
        # (in case they'd unsubscribed) and keep their name up to date.
        updated = False
        if name and subscriber.name != name:
            subscriber.name = name
            updated = True
        if not subscriber.is_active:
            subscriber.is_active = True
            updated = True
        if updated:
            subscriber.save()

    try:
        send_mail(
            subject="You're subscribed to Inkwell Books!",
            message=(
                f"Hi {name or 'there'},\n\n"
                "Thanks for subscribing to the Inkwell Books newsletter. "
                "You'll be the first to hear about new arrivals, sales, and reading picks.\n\n"
                "As a welcome gift, enjoy ₹100 off your first order.\n\n"
                "Happy reading!\nTeam Inkwell Books"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception:
        # Never let a mail-server hiccup break the subscribe flow for the user.
        pass

    if created:
        messages.success(request, "You're subscribed! Check your inbox for a confirmation email.")
    else:
        messages.info(request, "You're already subscribed — we've sent the confirmation email again.")

    return redirect(request.META.get("HTTP_REFERER", "core:home"))
