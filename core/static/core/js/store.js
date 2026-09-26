/* ==========================================================================
   INKWELL BOOKS — store.js
   CART + WISHLIST (localStorage-backed, scoped per logged-in account via
   window.INKWELL_USER_ID — see base.html). Fine to stay client-side since
   it's just "what am I currently browsing" state, but each account keeps
   its own separate cart/wishlist so switching users on the same browser
   doesn't mix them up.
   Login, registration, and order history are REAL, server-side (Django
   auth + the Order model) — this file must never touch or fake those,
   since a previous version of this file used to overwrite the real
   server-rendered login state in the header on every page load. That bug
   is why logged-in users never showed up correctly before.
   ========================================================================== */

(function () {
  // Each account gets its own cart/wishlist bucket, keyed by the user id
  // set in base.html (or "guest" when logged out). This is set BEFORE this
  // script tag runs, so it's safe to read here.
  const ACCOUNT_KEY = window.INKWELL_USER_ID || 'guest';
  const CART_KEY = 'inkwell_cart_' + ACCOUNT_KEY;
  const WISHLIST_KEY = 'inkwell_wishlist_' + ACCOUNT_KEY;
  // Buy Now is a completely separate, single-item slot so it never mixes
  // with whatever is already sitting in the cart. It lives in sessionStorage
  // (not localStorage) since it's just a hand-off to the checkout page for
  // this one purchase, not something that should persist like the cart does.
  const BUYNOW_KEY = 'inkwell_buynow_' + ACCOUNT_KEY;

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function writeList(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }

  /* ---------------- CART ---------------- */
  function getCart() { return readList(CART_KEY); }
  function addToCart(item, qty) {
    qty = qty && qty > 0 ? qty : 1;
    const cart = getCart();
    const existing = cart.find((i) => i.id === item.id);
    if (existing) existing.qty += qty;
    else cart.push({ ...item, qty: qty });
    writeList(CART_KEY, cart);
    updateBadges();
  }
  function setCartQty(id, qty) {
    let cart = getCart();
    if (qty <= 0) cart = cart.filter((i) => i.id !== id);
    else { const item = cart.find((i) => i.id === id); if (item) item.qty = qty; }
    writeList(CART_KEY, cart);
    updateBadges();
  }
  function removeFromCart(id) {
    writeList(CART_KEY, getCart().filter((i) => i.id !== id));
    updateBadges();
  }
  function clearCart() { writeList(CART_KEY, []); updateBadges(); }
  function cartCount() { return getCart().reduce((sum, i) => sum + i.qty, 0); }

  /* ---------------- BUY NOW (separate from the cart, never merges with it) ---------------- */
  function setBuyNow(item, qty) {
    qty = qty && qty > 0 ? qty : 1;
    try { sessionStorage.setItem(BUYNOW_KEY, JSON.stringify({ ...item, qty: qty })); } catch (e) { /* storage unavailable */ }
  }
  function getBuyNow() {
    try {
      const raw = sessionStorage.getItem(BUYNOW_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function clearBuyNow() {
    try { sessionStorage.removeItem(BUYNOW_KEY); } catch (e) { /* storage unavailable */ }
  }

  /* ---------------- WISHLIST ---------------- */
  function getWishlist() { return readList(WISHLIST_KEY); }
  function isInWishlist(id) { return getWishlist().some((i) => i.id === id); }
  function toggleWishlist(item) {
    let wishlist = getWishlist();
    const exists = wishlist.some((i) => i.id === item.id);
    wishlist = exists ? wishlist.filter((i) => i.id !== item.id) : [...wishlist, item];
    writeList(WISHLIST_KEY, wishlist);
    updateBadges();
    return !exists;
  }
  function removeFromWishlist(id) {
    writeList(WISHLIST_KEY, getWishlist().filter((i) => i.id !== id));
    updateBadges();
  }

  /* ---------------- HEADER BADGES (cart/wishlist counts only —
     the login/username display is rendered server-side in base.html
     via {% if user.is_authenticated %} and is never touched here) ---------------- */
  function updateBadges() {
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
      const count = cartCount();
      cartBadge.textContent = count;
      cartBadge.style.display = count > 0 ? 'flex' : 'none';
    }
    const wishBadge = document.getElementById('wishlistCount');
    if (wishBadge) {
      const count = getWishlist().length;
      wishBadge.textContent = count;
      wishBadge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /* ---------------- IMAGE HELPER ----------------
     Most book "img" values are a bare Unsplash photo id, but a few
     (the homepage's Best Sellers list) already store a full, ready-to-use
     image URL. Cart/wishlist rendering needs to handle both. */
  function imgUrl(img, width) {
    width = width || 200;
    if (!img) return '';
    if (img.indexOf('http') === 0) return img;
    return `https://images.unsplash.com/photo-${img}?w=${width}&q=80`;
  }

  window.InkwellStore = {
    getCart, addToCart, setCartQty, removeFromCart, clearCart, cartCount,
    setBuyNow, getBuyNow, clearBuyNow,
    getWishlist, isInWishlist, toggleWishlist, removeFromWishlist,
    updateBadges, imgUrl,
  };

  document.addEventListener('DOMContentLoaded', updateBadges);
})();
