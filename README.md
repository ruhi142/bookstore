# Inkwell Books — Django Project (Home page build)

## How to run

1. Open a terminal in this folder (the one with `manage.py`).
2. (Recommended) create a virtual environment:
   python -m venv venv
   venv\Scripts\activate      (Windows)
   source venv/bin/activate   (Mac/Linux)
3. Install Django:
   pip install -r requirements.txt
4. Set up the database (creates db.sqlite3):
   python manage.py migrate
5. Run the server:
   python manage.py runserver
6. Open your browser at:
   http://127.0.0.1:8000/

## What's built so far
- Home page (`core` app) — fully designed and working.
- Header, footer, register/login modal, and the floating chatbot widget are in
  `core/templates/core/base.html` — shared by every page.
- About, Contact, Cart, My Orders, Track Order, Category pages currently show
  a "coming soon" placeholder (they route correctly, just not designed yet) —
  these will be replaced page by page as we build them.

## Project layout
- bookstore_project/   → Django settings & root urls
- core/                → home, about, contact, shared base template
- catalog/             → categories, search, book listing (placeholder for now)
- cart/                → cart, checkout, OTP, payment gateway (placeholder for now)
- accounts/            → login/register, dashboard (placeholder for now)
- orders/              → order history, tracking (placeholder for now)
- chatbot/             → AI assistant backend (not wired yet)

## Checkout OTP (demo mode)

The checkout OTP step is a **client-side simulation** — no real SMS is sent. When you click "Send OTP", a 6-digit code is generated in the browser and shown in a yellow "Demo OTP" box so you can copy it into the verification boxes. The code `123456` also always works, for convenience.

## Razorpay payment gateway (real, test mode)

Cash on Delivery still works with no setup. UPI / Card / Netbanking / Wallet
now go through a real Razorpay Checkout popup and a signature-verified
payment on the server — here's how to switch it on.

1. **Create a Razorpay account** at https://dashboard.razorpay.com/signup
   (no business docs needed just to get Test Mode keys).
2. **Get your Test keys**: Dashboard → Settings → API Keys → Generate Test
   Key. You'll get a **Key ID** (`rzp_test_...`) and a **Key Secret** — copy
   both immediately, the secret is only shown once.
3. **Set them in a `.env` file** (this project loads it automatically via
   `python-dotenv` — see `settings.py`):
   - Copy `.env.example` to `.env` (same folder as `manage.py`)
   - Fill in your real `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - `.env` is already in `.gitignore`, so it won't get committed if you
     push this project to GitHub — never share that file or paste its
     contents anywhere public

4. **Install the SDK** (already added to `requirements.txt`):
   ```
   pip install -r requirements.txt
   ```
5. **Apply the migration** that adds payment tracking to Order:
   ```
   python manage.py migrate
   ```
6. **Run the server** as usual and go through checkout with anything except
   Cash on Delivery. Use Razorpay's official test cards/UPI IDs (never real
   ones in Test Mode) — full list at
   https://razorpay.com/docs/payments/payments/test-card-upi-details/ —
   e.g. card `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1221` if asked.

**How it works, end to end:**
- `cart/views.py: create_razorpay_order` — server calculates the total from
  the items itself (never trusts a number from the browser) and asks
  Razorpay to open an Order for that exact amount.
- `checkout.js` opens Razorpay's own Checkout popup with that order — the
  person's card/UPI details go straight to Razorpay, never through this
  server.
- `cart/views.py: verify_payment` — once Razorpay's popup returns a
  payment ID + signature, the server verifies that signature with Razorpay
  before creating the real `Order` row. This is the step that actually
  proves the payment is genuine; skipping it (e.g. creating the Order
  straight from the browser callback) would let anyone fake a "successful"
  order without paying.
- If verification fails or the popup is closed/cancelled, no Order is
  created and the cart is untouched.

**Going live later:** switch to Live Mode keys in the Razorpay dashboard
(needs KYC/business details), set the same two environment variables to the
live values on your production server, and set `DEBUG = False` /
`ALLOWED_HOSTS` in `settings.py` as normal for any Django deployment. For
extra reliability in production, most teams also add a Razorpay **webhook**
(Dashboard → Webhooks) that independently confirms `payment.captured`
events server-to-server — worth adding once this is deployed, since it
covers the rare case where the browser closes right after paying but before
the `verify_payment` call completes.
