/* ==========================================================================
   INKWELL BOOKS — home.js
   Deal-of-the-Day countdown + hero slider. Everything else on the home
   page is CSS-driven.
   ========================================================================== */

(function () {
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMins');
  const secsEl = document.getElementById('cdSecs');
  if (!hoursEl) return;

  // Counts down to the next midnight (server should really send the deal's
  // real end time via a data-attribute; this is the front-end demo version).
  function getTarget() {
    const t = new Date();
    t.setHours(24, 0, 0, 0);
    return t;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = getTarget() - new Date();
    if (diff <= 0) { hoursEl.textContent = minsEl.textContent = secsEl.textContent = '00'; return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    hoursEl.textContent = pad(h);
    minsEl.textContent = pad(m);
    secsEl.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ---------------- BEST SELLERS "ADD TO CART" ---------------- */
(function () {
  document.querySelectorAll('.book-grid .btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!window.InkwellStore) return;
      InkwellStore.addToCart({
        id: btn.dataset.id,
        title: btn.dataset.title,
        author: btn.dataset.author,
        price: Number(btn.dataset.price),
        old_price: Number(btn.dataset.oldPrice),
        img: btn.dataset.img,
      });
      const original = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.classList.add('is-added');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('is-added');
      }, 1200);
    });
  });
})();

/* ---------------- BEST SELLERS WISHLIST HEART ---------------- */
(function () {
  document.querySelectorAll('.book-grid .book-card').forEach((card) => {
    const wishBtn = card.querySelector('.cat-wishlist-btn');
    const addBtn = card.querySelector('.btn-add-cart');
    if (!wishBtn || !addBtn || !window.InkwellStore) return;

    const item = {
      id: addBtn.dataset.id,
      title: addBtn.dataset.title,
      author: addBtn.dataset.author,
      price: Number(addBtn.dataset.price),
      old_price: Number(addBtn.dataset.oldPrice),
      img: addBtn.dataset.img,
    };
    if (InkwellStore.isInWishlist(item.id)) wishBtn.classList.add('is-saved');

    wishBtn.addEventListener('click', () => {
      const nowSaved = InkwellStore.toggleWishlist(item);
      wishBtn.classList.toggle('is-saved', nowSaved);
    });
  });
})();

/* ---------------- HERO SLIDER ---------------- */
(function () {
  const track = document.getElementById('heroTrack');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dots = document.querySelectorAll('#heroDots .hero-dot');
  if (!track || track.children.length <= 1) return;

  const realSlidesCount = track.children.length;
  let current = 1; // Starts at index 1 due to the prepended clone
  let isTransitioning = false;
  let autoTimer;

  // 1. Clone first and last slides
  const firstClone = track.firstElementChild.cloneNode(true);
  const lastClone = track.lastElementChild.cloneNode(true);

  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstElementChild);

  // 2. Set initial position to real Slide 1 without animating
  track.style.transform = `translateX(-${current * 100}%)`;

  function updateDots() {
    let realIndex = current - 1;
    if (realIndex < 0) realIndex = realSlidesCount - 1;
    if (realIndex >= realSlidesCount) realIndex = 0;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === realIndex));
  }

  function goTo(index) {
    if (isTransitioning) return; // Prevents rapid clicks from breaking the animation
    isTransitioning = true;

    current = index;
    track.style.transition = 'transform 0.5s ease-in-out';
    track.style.transform = `translateX(-${current * 100}%)`;

    updateDots();
  }

  // 3. Teleport seamlessly after completing transition to a clone
  track.addEventListener('transitionend', () => {
    isTransitioning = false;

    if (current === 0) {
      // Reached prepended last slide clone -> jump instantly to actual last slide
      track.style.transition = 'none';
      current = realSlidesCount;
      track.style.transform = `translateX(-${current * 100}%)`;
    } else if (current === realSlidesCount + 1) {
      // Reached appended first slide clone -> jump instantly to actual first slide
      track.style.transition = 'none';
      current = 1;
      track.style.transform = `translateX(-${current * 100}%)`;
    }
  });

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 6000);
  }

  prevBtn && prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn && nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i + 1); startAuto(); }));

  startAuto();
})();
