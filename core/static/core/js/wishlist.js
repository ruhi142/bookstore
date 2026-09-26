/* ==========================================================================
   INKWELL BOOKS — wishlist.js
   Renders the saved-items grid from localStorage (via window.InkwellStore).
   ========================================================================== */

(function () {
  const grid = document.getElementById('wlGrid');
  const empty = document.getElementById('wlEmpty');
  if (!grid || !window.InkwellStore) return;

  function render() {
    const items = InkwellStore.getWishlist();
    grid.innerHTML = '';

    if (items.length === 0) {
      empty.classList.add('is-visible');
      grid.style.display = 'none';
      return;
    }
    empty.classList.remove('is-visible');
    grid.style.display = 'grid';

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'wl-card';
      card.innerHTML = `
        <button class="wl-remove-btn" aria-label="Remove from wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
        <a href="/category/book/${item.id}/" class="book-card-link">
          <img src="${InkwellStore.imgUrl(item.img, 280)}" alt="${item.title} cover">
          <h4>${item.title}</h4>
          <span class="author">${item.author}</span>
        </a>
        <div class="wl-price-row">
          <span class="wl-price-now">₹${item.price}</span>
          <span class="wl-price-old">₹${item.old_price}</span>
        </div>
        <button class="wl-move-btn">Move to Cart</button>
      `;

      card.querySelector('.wl-remove-btn').addEventListener('click', () => {
        InkwellStore.removeFromWishlist(item.id);
        render();
      });

      const moveBtn = card.querySelector('.wl-move-btn');
      moveBtn.addEventListener('click', () => {
        InkwellStore.addToCart(item);
        InkwellStore.removeFromWishlist(item.id);
        moveBtn.textContent = 'Added ✓';
        moveBtn.classList.add('is-added');
        setTimeout(render, 500);
      });

      grid.appendChild(card);
    });
  }

  render();
})();
