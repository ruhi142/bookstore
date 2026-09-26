/* ==========================================================================
   INKWELL BOOKS — book_detail.js
   Gallery thumb swap, quantity stepper, Add to Bag / Buy Now (wired to the
   shared InkwellStore), wishlist heart, share button, a front-end-only
   delivery estimate, and the "You may also like" related grid.
   ========================================================================== */

(function () {
  const book = window.BD_BOOK;
  if (!book) return;

  /* ---------------- GALLERY ---------------- */
  const thumbs = document.querySelectorAll('.bd-thumb');
  const mainImg = document.getElementById('bdMainImg');
  const backPanel = document.getElementById('bdBackPanel');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('is-active'));
      thumb.classList.add('is-active');
      const showBack = thumb.dataset.view === 'back';
      backPanel.classList.toggle('is-visible', showBack);
      mainImg.style.opacity = showBack ? '0' : '1';
    });
  });

  /* ---------------- QUANTITY STEPPER ---------------- */
  const qtyVal = document.getElementById('bdQtyVal');
  let qty = 1;
  document.querySelectorAll('#bdQty button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.step);
      qty = Math.min(10, Math.max(1, qty + step));
      qtyVal.textContent = qty;
    });
  });

  /* ---------------- ADD TO BAG / BUY NOW ---------------- */
  const addBtn = document.getElementById('bdAddToBag');
  const buyBtn = document.getElementById('bdBuyNow');

  function addCurrentBookToCart() {
    if (!window.InkwellStore) return;
    InkwellStore.addToCart(book, qty);
  }

  addBtn && addBtn.addEventListener('click', () => {
    addCurrentBookToCart();
    const original = addBtn.innerHTML;
    addBtn.classList.add('is-added');
    addBtn.innerHTML = 'Added to Bag ✓';
    setTimeout(() => {
      addBtn.innerHTML = original;
      addBtn.classList.remove('is-added');
    }, 1300);
  });

  buyBtn && buyBtn.addEventListener('click', () => {
    // Buy Now must NOT touch the real cart — it hands off just this one
    // book+qty to checkout in its own slot, so whatever's already in the
    // cart (e.g. 6 other books) stays untouched and isn't shown/ordered.
    if (window.InkwellStore) InkwellStore.setBuyNow(book, qty);
    // let the anchor's href (?buynow=1) continue on to checkout
  });

  /* ---------------- WISHLIST ---------------- */
  const wishBtn = document.getElementById('bdWishBtn');
  if (wishBtn && window.InkwellStore) {
    if (InkwellStore.isInWishlist(book.id)) wishBtn.classList.add('is-saved');
    wishBtn.addEventListener('click', () => {
      const nowSaved = InkwellStore.toggleWishlist(book);
      wishBtn.classList.toggle('is-saved', nowSaved);
    });
  }

  /* ---------------- SHARE ---------------- */
  const shareBtn = document.getElementById('bdShareBtn');
  shareBtn && shareBtn.addEventListener('click', async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        shareBtn.setAttribute('title', 'Link copied!');
      }
    } catch (e) { /* user dismissed share sheet — ignore */ }
  });

  /* ---------------- DELIVERY CHECK (front-end only demo) ---------------- */
  const pinInput = document.getElementById('bdPincode');
  const pinBtn = document.getElementById('bdPincodeCheck');
  const pinResult = document.getElementById('bdDeliveryResult');
  pinBtn && pinBtn.addEventListener('click', () => {
    const pin = pinInput.value.trim();
    if (!/^\d{6}$/.test(pin)) {
      pinResult.textContent = 'Enter a valid 6-digit pincode.';
      pinResult.classList.add('is-error');
      return;
    }
    pinResult.classList.remove('is-error');
    const days = 2 + (Number(pin[pin.length - 1]) % 4);
    pinResult.textContent = `Delivers to ${pin} in ${days}–${days + 1} days.`;
  });

  /* ---------------- RELATED GRID (Add to Cart + wishlist) ---------------- */
  document.querySelectorAll('#bdRelatedGrid .book-card').forEach((card) => {
    const item = {
      id: card.dataset.id,
      title: card.dataset.title,
      author: card.dataset.author,
      price: Number(card.dataset.price),
      old_price: Number(card.dataset.oldPrice),
      img: card.dataset.img,
    };
    const addCartBtn = card.querySelector('.btn-add-cart');
    addCartBtn && addCartBtn.addEventListener('click', () => {
      if (!window.InkwellStore) return;
      InkwellStore.addToCart(item);
      const original = addCartBtn.textContent;
      addCartBtn.textContent = 'Added ✓';
      addCartBtn.classList.add('is-added');
      setTimeout(() => {
        addCartBtn.textContent = original;
        addCartBtn.classList.remove('is-added');
      }, 1200);
    });

    const wishHeart = card.querySelector('.cat-wishlist-btn');
    if (wishHeart && window.InkwellStore) {
      if (InkwellStore.isInWishlist(item.id)) wishHeart.classList.add('is-saved');
      wishHeart.addEventListener('click', () => {
        const nowSaved = InkwellStore.toggleWishlist(item);
        wishHeart.classList.toggle('is-saved', nowSaved);
      });
    }
  });

  /* ---------------- WRITE A REVIEW ----------------
     Reviews are per-book and stored client-side (localStorage), same
     pattern as cart/wishlist in store.js — there's no review model on
     the backend yet. User-submitted reviews are prepended to the seeded
     list on load and whenever a new one is submitted. */
  const REVIEWS_KEY = 'inkwell_reviews_' + book.id;
  const reviewList = document.getElementById('bdReviewList');
  const reviewForm = document.getElementById('bdReviewForm');
  const starInput = document.getElementById('bdReviewStarInput');
  const starHint = document.getElementById('bdReviewStarHint');
  const reviewMsg = document.getElementById('bdReviewMsg');
  const reviewCountEl = document.getElementById('bdReviewCount');

  function getSavedReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveReview(review) {
    const list = getSavedReviews();
    list.unshift(review);
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
  }

  function renderReview(review, { prepend } = {}) {
    if (!reviewList) return;
    const el = document.createElement('div');
    el.className = 'bd-review-item' + (prepend ? ' is-new' : '');
    el.innerHTML = `
      <div class="bd-review-head">
        <span class="bd-review-avatar">${review.initial}</span>
        <div class="bd-review-who">
          <strong></strong>
          <span class="bd-review-stars" aria-hidden="true">${'★'.repeat(review.stars)}</span>
        </div>
        <span class="bd-review-date"></span>
      </div>
      <p class="bd-review-text"></p>
    `;
    // Set text via textContent (not innerHTML) so user input can't inject markup.
    el.querySelector('.bd-review-who strong').textContent = review.name;
    el.querySelector('.bd-review-date').textContent = review.date;
    el.querySelector('.bd-review-text').textContent = review.text;
    if (prepend) reviewList.prepend(el);
    else reviewList.appendChild(el);
  }

  // Render any previously-submitted reviews for this book on page load.
  getSavedReviews().forEach((review) => renderReview(review, { prepend: true }));

  // Star picker.
  let selectedStars = 0;
  if (starInput) {
    const starBtns = starInput.querySelectorAll('.bd-star-btn');
    function paintStars(n) {
      starBtns.forEach((btn) => btn.classList.toggle('is-active', Number(btn.dataset.val) <= n));
    }
    starBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedStars = Number(btn.dataset.val);
        starInput.dataset.value = selectedStars;
        paintStars(selectedStars);
        if (starHint) starHint.textContent = selectedStars + ' out of 5';
      });
      btn.addEventListener('mouseenter', () => paintStars(Number(btn.dataset.val)));
    });
    starInput.addEventListener('mouseleave', () => paintStars(selectedStars));
  }

  // Submit handler.
  reviewForm && reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('bdReviewName');
    const textInput = document.getElementById('bdReviewText');
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!selectedStars) {
      reviewMsg.textContent = 'Please select a star rating.';
      reviewMsg.className = 'bd-review-msg is-error';
      return;
    }
    if (!name || !text) {
      reviewMsg.textContent = 'Please add your name and a few words about the book.';
      reviewMsg.className = 'bd-review-msg is-error';
      return;
    }

    const review = {
      name: name,
      initial: name.charAt(0).toUpperCase(),
      stars: selectedStars,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: text,
    };
    saveReview(review);
    renderReview(review, { prepend: true });

    // Bump the visible review count so the new review is reflected.
    if (reviewCountEl) {
      const match = reviewCountEl.textContent.match(/\d+/);
      if (match) reviewCountEl.textContent = (Number(match[0]) + 1) + ' reviews';
    }

    reviewForm.reset();
    selectedStars = 0;
    if (starInput) {
      starInput.dataset.value = 0;
      starInput.querySelectorAll('.bd-star-btn').forEach((b) => b.classList.remove('is-active'));
    }
    if (starHint) starHint.textContent = 'Tap to rate';
    reviewMsg.textContent = 'Thanks — your review has been posted!';
    reviewMsg.className = 'bd-review-msg is-success';
  });
})();
