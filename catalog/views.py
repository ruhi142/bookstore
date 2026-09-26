from datetime import timedelta

from django.shortcuts import render
from django.utils import timezone

from core.views import BEST_SELLERS


# Book data per category — top picks shown on each listing page.
# In a real build this comes from the Book model; hardcoded here so the
# page has real, browsable, filterable content while the model layer
# isn't built yet. "condition" powers the New/Pre-loved filter chips.
_RAW_CATEGORIES = {
    "fiction": {
        "title": "Fiction",
        "tagline": "Stories that stay with you long after the last page.",
        "count": "6,200",
        "books": [
            {"title": "The Silent Patient", "author": "Alex Michaelides", "price": 239, "old_price": 399, "discount": 40, "img": "https://covers.openlibrary.org/b/isbn/9781250301703-L.jpg", "condition": "New"},
            {"title": "Where the Crawdads Sing", "author": "Delia Owens", "price": 349, "old_price": 499, "discount": 30, "img": "https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg", "condition": "New"},
            {"title": "The Midnight Library", "author": "Matt Haig", "price": 299, "old_price": 449, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9781786892720-L.jpg", "condition": "Pre-loved"},
            {"title": "Circe", "author": "Madeline Miller", "price": 319, "old_price": 499, "discount": 36, "img": "https://covers.openlibrary.org/b/isbn/9780316556323-L.jpg", "condition": "New"},
            {"title": "The Kite Runner", "author": "Khaled Hosseini", "price": 279, "old_price": 399, "discount": 30, "img": "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg", "condition": "Pre-loved"},
            {"title": "Normal People", "author": "Sally Rooney", "price": 249, "old_price": 350, "discount": 29, "img": "https://covers.openlibrary.org/b/isbn/9781984822178-L.jpg", "condition": "New"},
            {"title": "A Little Life", "author": "Hanya Yanagihara", "price": 399, "old_price": 599, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9780804172707-L.jpg", "condition": "New"},
            {"title": "The Song of Achilles", "author": "Madeline Miller", "price": 289, "old_price": 429, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg", "condition": "Pre-loved"},
        ],
    },
    "non-fiction": {
        "title": "Non-Fiction",
        "tagline": "Real stories, real ideas — for the endlessly curious.",
        "count": "3,400",
        "books": [
            {"title": "Atomic Habits", "author": "James Clear", "price": 299, "old_price": 459, "discount": 35, "img": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg", "condition": "New"},
            {"title": "Sapiens", "author": "Yuval Noah Harari", "price": 249, "old_price": 499, "discount": 50, "img": "https://covers.openlibrary.org/b/isbn/9780062316110-L.jpg", "condition": "Pre-loved"},
            {"title": "Educated", "author": "Tara Westover", "price": 329, "old_price": 499, "discount": 34, "img": "https://covers.openlibrary.org/b/isbn/9780399590528-L.jpg", "condition": "New"},
            {"title": "Thinking, Fast and Slow", "author": "Daniel Kahneman", "price": 359, "old_price": 549, "discount": 35, "img": "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg", "condition": "New"},
            {"title": "Becoming", "author": "Michelle Obama", "price": 379, "old_price": 599, "discount": 37, "img": "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg", "condition": "Pre-loved"},
            {"title": "Outliers", "author": "Malcolm Gladwell", "price": 289, "old_price": 399, "discount": 28, "img": "https://covers.openlibrary.org/b/isbn/9780316017930-L.jpg", "condition": "New"},
            {"title": "The Body Keeps the Score", "author": "Bessel van der Kolk", "price": 399, "old_price": 599, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9780143127741-L.jpg", "condition": "New"},
            {"title": "Deep Work", "author": "Cal Newport", "price": 269, "old_price": 399, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg", "condition": "Pre-loved"},
        ],
    },
    "academic": {
        "title": "Academic",
        "tagline": "Textbooks and reference titles across every stream — priced for students.",
        "count": "5,100",
        "books": [
            {"title": "Concepts of Physics — Vol 1", "author": "H.C. Verma", "price": 299, "old_price": 425, "discount": 30, "img": "https://covers.openlibrary.org/b/isbn/9788177091878-L.jpg", "condition": "New"},
            {"title": "NCERT Mathematics — Class 12", "author": "NCERT", "price": 120, "old_price": 175, "discount": 31, "img": "https://covers.openlibrary.org/b/isbn/8174504179-L.jpg", "condition": "New"},  # TODO verify cover
            {"title": "Organic Chemistry", "author": "Morrison & Boyd", "price": 549, "old_price": 799, "discount": 31, "img": "https://covers.openlibrary.org/b/isbn/9788131715622-L.jpg", "condition": "Pre-loved"},  # TODO verify cover
            {"title": "Introduction to Algorithms", "author": "CLRS", "price": 899, "old_price": 1299, "discount": 31, "img": "https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg", "condition": "New"},
            {"title": "Engineering Mechanics", "author": "R.S. Khurmi", "price": 399, "old_price": 599, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/8121925942-L.jpg", "condition": "Pre-loved"},  # TODO verify cover
            {"title": "Business Statistics", "author": "Ken Black", "price": 449, "old_price": 649, "discount": 31, "img": "https://covers.openlibrary.org/b/isbn/9788126518041-L.jpg", "condition": "New"},  # TODO verify cover
            {"title": "Cell Biology & Genetics", "author": "Verma & Agarwal", "price": 379, "old_price": 549, "discount": 31, "img": "https://covers.openlibrary.org/b/isbn/8121903043-L.jpg", "condition": "New"},  # TODO verify cover
            {"title": "Principles of Economics", "author": "N. Gregory Mankiw", "price": 499, "old_price": 749, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9781305585126-L.jpg", "condition": "Pre-loved"},
        ],
    },
    "children": {
        "title": "Children",
        "tagline": "Picture books, early readers and adventures for growing imaginations.",
        "count": "1,800",
        "books": [
            {"title": "The Very Hungry Caterpillar", "author": "Eric Carle", "price": 199, "old_price": 299, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9780399226908-L.jpg", "condition": "New"},
            {"title": "Charlotte's Web", "author": "E.B. White", "price": 229, "old_price": 349, "discount": 34, "img": "https://covers.openlibrary.org/b/isbn/9780064400558-L.jpg", "condition": "Pre-loved"},
            {"title": "Matilda", "author": "Roald Dahl", "price": 249, "old_price": 379, "discount": 34, "img": "https://covers.openlibrary.org/b/isbn/9780142410370-L.jpg", "condition": "New"},
            {"title": "The Gruffalo", "author": "Julia Donaldson", "price": 179, "old_price": 279, "discount": 36, "img": "https://covers.openlibrary.org/b/isbn/9780333710930-L.jpg", "condition": "New"},
            {"title": "Panchatantra Tales", "author": "Vishnu Sharma", "price": 199, "old_price": 299, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9781981020782-L.jpg", "condition": "Pre-loved"},
            {"title": "Winnie-the-Pooh", "author": "A.A. Milne", "price": 219, "old_price": 329, "discount": 33, "img": "https://covers.openlibrary.org/b/isbn/9780525444435-L.jpg", "condition": "New"},
            {"title": "The Jungle Book", "author": "Rudyard Kipling", "price": 209, "old_price": 319, "discount": 34, "img": "https://covers.openlibrary.org/b/isbn/9780141321021-L.jpg", "condition": "Pre-loved"},
            {"title": "Amar Chitra Katha — Birbal", "author": "ACK", "price": 149, "old_price": 220, "discount": 32, "img": "https://covers.openlibrary.org/b/isbn/9788175080935-L.jpg", "condition": "New"},
        ],
    },
    "sale": {
        "title": "Sale — Up to 70% Off",
        "tagline": "Hand-picked bestsellers at their lowest prices this month. Limited stock per title.",
        "count": "2,300",
        "books": [
            {"title": "The Alchemist", "author": "Paulo Coelho", "price": 129, "old_price": 399, "discount": 68, "img": "https://m.media-amazon.com/images/I/81UGPuNl7kL._UF1000,1000_QL80_.jpg", "condition": "New"},
            {"title": "1984", "author": "George Orwell", "price": 149, "old_price": 399, "discount": 63, "img": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg", "condition": "New"},
            {"title": "To Kill a Mockingbird", "author": "Harper Lee", "price": 159, "old_price": 449, "discount": 65, "img": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg", "condition": "Pre-loved"},
            {"title": "Rich Dad Poor Dad", "author": "Robert Kiyosaki", "price": 139, "old_price": 399, "discount": 65, "img": "https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg", "condition": "New"},
            {"title": "The Power of Habit", "author": "Charles Duhigg", "price": 179, "old_price": 499, "discount": 64, "img": "https://covers.openlibrary.org/b/isbn/9780812981605-L.jpg", "condition": "Pre-loved"},
            {"title": "Ikigai", "author": "Héctor García", "price": 149, "old_price": 399, "discount": 63, "img": "https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg", "condition": "New"},
            {"title": "The Subtle Art of Not Giving a F*ck", "author": "Mark Manson", "price": 159, "old_price": 449, "discount": 65, "img": "https://covers.openlibrary.org/b/isbn/9780062457714-L.jpg", "condition": "New"},
            {"title": "Wings of Fire", "author": "A.P.J. Abdul Kalam", "price": 129, "old_price": 350, "discount": 63, "img": "https://covers.openlibrary.org/b/isbn/9788173711466-L.jpg", "condition": "Pre-loved"},
        ],
    },
}


def _build_categories():
    """Adds a stable unique id per book (used by cart/wishlist localStorage)."""
    categories = {}
    for slug, data in _RAW_CATEGORIES.items():
        books = []
        for i, book in enumerate(data["books"]):
            book = dict(book)
            book["id"] = f"{slug}-{i}"
            books.append(book)
        categories[slug] = {**data, "books": books}
    return categories


CATEGORIES = _build_categories()

# Vibe/theme tag chips shown on the book detail page — mirrors the little
# descriptive pill row Crossword shows under a book's title (e.g. "Quirky
# Character Dynamics", "Emotional Comedy"). No such data model yet, so a
# small curated set per category/slug stands in for it.
_TAG_PRESETS = {
    "fiction": ["Character-Driven", "Emotional Depth", "Page-Turner", "Book Club Pick"],
    "non-fiction": ["Real-World Insight", "Practical Ideas", "Thought-Provoking"],
    "academic": ["Exam-Ready", "Concept Clarity", "Solved Examples"],
    "children": ["Read-Aloud Favorite", "Gentle Life Lessons", "Colourful Illustrations"],
    "sale": ["Reader Favorite", "Limited Stock", "Great Value"],
    "bestsellers": ["Reader Favorite", "Widely Recommended", "Editor's Pick"],
}

_PUBLISHERS = ["Inkwell Editions", "Harper Collins India", "Penguin Random House", "Rupa Publications", "Westland Books"]

# Sample reviewer names + comment templates used to seed each book's review
# list with a few realistic-looking reviews. No review model yet, so these
# are picked deterministically per book (same _stable_hash trick as
# rating/reviews/pages) rather than being random on every request.
_SAMPLE_REVIEWERS = [
    "Ananya S.", "Rohan K.", "Priya M.", "Karthik R.", "Fatima A.",
    "Vikram J.", "Sneha P.", "Arjun T.", "Meera N.", "Ishaan D.",
]
_SAMPLE_REVIEW_TEMPLATES = [
    "Couldn't put this one down — {tag} from start to finish. Highly recommend picking up a copy.",
    "The {condition_lower} copy I received was in great shape. The story itself is {tag} and well worth the read.",
    "Bought this on a whim and ended up loving it. Very {tag}, exactly what I was looking for.",
    "A solid read overall. A few slow chapters, but the {tag} moments more than make up for it.",
    "Exactly as described — {condition_lower} condition and delivered quickly. The book itself lives up to the hype.",
    "One of the better {category_lower} titles I've picked up this year. {tag_cap} and easy to recommend.",
]


def _sample_reviews(book_id, tags, condition, category_title, count=3):
    h = _stable_hash(book_id)
    tag = (tags[0] if tags else "engaging").lower()
    reviews = []
    for i in range(count):
        seed = (h * (i + 7)) % 100000
        name = _SAMPLE_REVIEWERS[seed % len(_SAMPLE_REVIEWERS)]
        template = _SAMPLE_REVIEW_TEMPLATES[(seed // 7) % len(_SAMPLE_REVIEW_TEMPLATES)]
        stars = 4 + ((seed // 3) % 2)  # 4 or 5 stars
        days_ago = 3 + (seed % 90)
        text = template.format(
            tag=tag, tag_cap=tag.capitalize(),
            condition_lower=condition.lower(), category_lower=category_title.lower(),
        )
        reviews.append({
            "name": name,
            "initial": name[0],
            "stars": range(stars),
            "date": (timezone.now() - timedelta(days=days_ago)).strftime("%d %b %Y"),
            "text": text,
        })
    return reviews


def _stable_hash(text):
    """Small deterministic hash so a book's rating/reviews/pages stay the
    same across requests without needing a real database column for them."""
    total = 0
    for ch in text:
        total = (total * 31 + ord(ch)) % 100000
    return total


def _bare_or_full_img(img, size=600):
    """Book image fields come in two shapes: a bare Unsplash photo id
    (catalog books) or a full, ready-to-use image URL (home page's
    BEST_SELLERS list). Normalise both into a usable <img src>."""
    if img.startswith("http"):
        return img
    return f"https://images.unsplash.com/photo-{img}?w={size}&q=80"


def _normalize_book(book, category_slug, category_title):
    book_id = book["id"]
    h = _stable_hash(book_id)
    rating = round(4.0 + (h % 10) / 10, 1)
    reviews = 3 + (h % 240)
    pages = 180 + (h % 340)
    condition = book.get("condition", "New")
    discount = book.get("discount")
    if discount is None and book.get("old_price"):
        discount = round(100 * (book["old_price"] - book["price"]) / book["old_price"])
    savings = max(book.get("old_price", book["price"]) - book["price"], 0)
    tags = _TAG_PRESETS.get(category_slug, _TAG_PRESETS["bestsellers"])
    return {
        **book,
        "condition": condition,
        "discount": discount,
        "savings": savings,
        "img_url": _bare_or_full_img(book["img"]),
        "img_url_small": _bare_or_full_img(book["img"], size=160),
        "category_slug": category_slug,
        "category_title": category_title,
        "tags": tags,
        "rating": rating,
        "rating_full_stars": range(int(rating)),
        "rating_has_half": (rating - int(rating)) >= 0.5,
        "reviews": reviews,
        "pages": pages,
        "publisher": _PUBLISHERS[h % len(_PUBLISHERS)],
        "delivery_days": 3 + (h % 3),
        "sample_reviews": _sample_reviews(book_id, tags, condition, category_title),
    }


def find_book(book_id):
    """Looks a book up by id across every category, then the homepage's
    Best Sellers list, and returns it normalised for the detail page."""
    for slug, category in CATEGORIES.items():
        for book in category["books"]:
            if book["id"] == book_id:
                return _normalize_book(book, slug, category["title"])
    for book in BEST_SELLERS:
        if book.get("id") == book_id:
            return _normalize_book(book, "bestsellers", "Best Sellers")
    return None


def related_books(book, limit=4):
    """Other titles from the same shelf, for the \"You may also like\" row."""
    slug = book["category_slug"]
    if slug in CATEGORIES:
        pool = CATEGORIES[slug]["books"]
        category_title = CATEGORIES[slug]["title"]
    else:
        pool = BEST_SELLERS
        category_title = "Best Sellers"
    picks = [b for b in pool if b["id"] != book["id"]][:limit]
    return [_normalize_book(b, slug, category_title) for b in picks]


def book_detail(request, book_id):
    book = find_book(book_id)
    if not book:
        return render(request, "core/coming_soon.html", {"page_title": "Book"})
    return render(request, "catalog/book_detail.html", {
        "book": book,
        "related": related_books(book),
    })


def category_listing(request, slug):
    category = CATEGORIES.get(slug)
    if not category:
        return render(request, "core/coming_soon.html", {"page_title": slug.replace("-", " ").title()})
    books = [_normalize_book(b, slug, category["title"]) for b in category["books"]]
    category = {**category, "books": books}
    return render(request, "catalog/category_listing.html", {"category": category, "slug": slug})


def search(request):
    query = request.GET.get("q", "").strip()
    results = []
    if query:
        q_lower = query.lower()
        for slug, category in CATEGORIES.items():
            for book in category["books"]:
                if q_lower in book["title"].lower() or q_lower in book["author"].lower():
                    results.append(_normalize_book(book, slug, category["title"]))
    return render(request, "catalog/search_results.html", {"query": query, "results": results})
