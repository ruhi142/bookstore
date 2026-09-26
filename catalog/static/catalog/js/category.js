/* ==========================================================================
   INKWELL BOOKS — category.js
   Sort dropdown reorders the grid; filter chips actually filter by
   condition/price (instant, no reload); Add to Cart and the wishlist
   heart are wired to the shared InkwellStore (localStorage) engine.
   ========================================================================== */

(function () {
  const grid = document.getElementById('catBookGrid');
  const sortSelect = document.getElementById('catSort');
  const chips = document.querySelectorAll('.cat-chip');
  const emptyMsg = document.getElementById('catEmptyMsg');
  if (!grid) return;

  const cards = Array.from(grid.children);

  function bookDataFromCard(card) {
    return {
      id: card.dataset.id,
      title: card.dataset.title,
      author: card.dataset.author,
      price: Number(card.dataset.price),
      old_price: Number(card.dataset.oldPrice),
      img: card.dataset.img,
    };
  }

  /* ---------- SORT ---------- */
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const mode = sortSelect.value;
      const sorted = [...cards].sort((a, b) => {
        if (mode === 'price-low') return a.dataset.price - b.dataset.price;
        if (mode === 'price-high') return b.dataset.price - a.dataset.price;
        if (mode === 'discount') return b.dataset.discount - a.dataset.discount;
        return a.dataset.order - b.dataset.order; // "popular" = original order
      });
      sorted.forEach((card) => grid.appendChild(card));
    });
  }

  /* ---------- FILTER CHIPS ---------- */
  function applyFilter(filter) {
    let visibleCount = 0;
    cards.forEach((card) => {
      const price = Number(card.dataset.price);
      const condition = card.dataset.condition; // "new" or "pre-loved"
      let show = true;

      if (filter === 'new') show = condition === 'new';
      else if (filter === 'pre-loved') show = condition === 'pre-loved';
      else if (filter === 'under-300') show = price < 300;
      else if (filter === 'under-500') show = price < 500;
      else if (filter === 'under-1000') show = price < 1000;
      // filter === 'all' → show stays true

      card.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      applyFilter(chip.dataset.filter);
    });
  });

  /* ---------- ADD TO CART ---------- */
  cards.forEach((card) => {
    const addBtn = card.querySelector('.btn-add-cart');
    addBtn && addBtn.addEventListener('click', () => {
      if (!window.InkwellStore) return;
      InkwellStore.addToCart(bookDataFromCard(card));
      const original = addBtn.textContent;
      addBtn.textContent = 'Added ✓';
      addBtn.classList.add('is-added');
      setTimeout(() => {
        addBtn.textContent = original;
        addBtn.classList.remove('is-added');
      }, 1200);
    });
  });

  /* ---------- WISHLIST HEART ---------- */
  cards.forEach((card) => {
    const wishBtn = card.querySelector('.cat-wishlist-btn');
    if (!wishBtn || !window.InkwellStore) return;

    const item = bookDataFromCard(card);
    if (InkwellStore.isInWishlist(item.id)) {
      wishBtn.classList.add('is-saved');
    }

    wishBtn.addEventListener('click', () => {
      const nowSaved = InkwellStore.toggleWishlist(item);
      wishBtn.classList.toggle('is-saved', nowSaved);
    });
  });
})();
