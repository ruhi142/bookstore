/* ==========================================================================
   INKWELL BOOKS — cart.js
   Renders cart items (reference-style card layout), quantity +/-, remove,
   move-to-wishlist, live order summary, and a currency selector that
   converts displayed prices (INR is the stored/base currency).
   ========================================================================== */

(function () {
  const empty = document.getElementById('ctEmpty');
  const layout = document.getElementById('ctLayout');
  const itemsEl = document.getElementById('ctItems');
  const itemCountEl = document.getElementById('ctItemCount');
  const subtotalEl = document.getElementById('ctSubtotal');
  const deliveryEl = document.getElementById('ctDelivery');
  const totalEl = document.getElementById('ctTotal');
  const deliveryNoteEl = document.getElementById('ctDeliveryNote');
  const currencySelect = document.getElementById('ctCurrency');
  if (!itemsEl || !window.InkwellStore) return;

  const FREE_DELIVERY_THRESHOLD_INR = 499;
  const DELIVERY_FEE_INR = 49;

  // Simple fixed conversion rates from INR (base currency prices are stored in INR).
  const RATES = { INR: { rate: 1, symbol: '₹' }, USD: { rate: 0.012, symbol: '$' }, EUR: { rate: 0.011, symbol: '€' }, GBP: { rate: 0.0095, symbol: '£' } };

  function getCurrency() {
    return localStorage.getItem('inkwell_currency') || 'INR';
  }
  function fmt(amountInr) {
    const cur = RATES[getCurrency()] || RATES.INR;
    const converted = amountInr * cur.rate;
    const decimals = cur.rate === 1 ? 0 : 2;
    return `${cur.symbol}${converted.toFixed(decimals)}`;
  }

  if (currencySelect) {
    currencySelect.value = getCurrency();
    currencySelect.addEventListener('change', () => {
      localStorage.setItem('inkwell_currency', currencySelect.value);
      render();
    });
  }

  function render() {
    const cart = InkwellStore.getCart();
    itemsEl.innerHTML = '';

    if (cart.length === 0) {
      empty.classList.add('is-visible');
      layout.style.display = 'none';
      return;
    }
    empty.classList.remove('is-visible');
    layout.style.display = 'block';

    let subtotal = 0;
    let totalQty = 0;

    cart.forEach((item, idx) => {
      const lineTotal = item.price * item.qty;
      subtotal += lineTotal;
      totalQty += item.qty;

      const row = document.createElement('div');
      row.className = 'ct-item';
      row.innerHTML = `
        <span class="ct-item-num">${idx + 1}</span>
        <a href="/category/book/${item.id}/" class="ct-item-imgwrap">
          <img src="${InkwellStore.imgUrl(item.img, 200)}" alt="${item.title} cover">
          ${item.discount ? `<span class="ct-item-badge">${item.discount}%</span>` : ''}
        </a>
        <div class="ct-item-info">
          <h4><a href="/category/book/${item.id}/">${item.title}</a></h4>
          <span class="author">By: ${item.author}</span>
          <div class="ct-item-price-row">
            <span class="ct-item-price-now">${fmt(item.price)}</span>
            ${item.old_price ? `<span class="ct-item-price-old">${fmt(item.old_price)}</span>` : ''}
          </div>
          <div class="ct-item-bottom-row">
            <div class="ct-qty">
              <button class="ct-qty-minus" aria-label="Decrease quantity">−</button>
              <span>${item.qty}</span>
              <button class="ct-qty-plus" aria-label="Increase quantity">+</button>
            </div>
            <span class="ct-item-total">Total Price: ${fmt(lineTotal)}</span>
          </div>
        </div>
        <div class="ct-item-actions">
          <button class="ct-move-wishlist-btn">Move to Wishlist</button>
          <button class="ct-remove-btn">Remove</button>
        </div>
      `;

      row.querySelector('.ct-qty-minus').addEventListener('click', () => {
        InkwellStore.setCartQty(item.id, item.qty - 1);
        render();
      });
      row.querySelector('.ct-qty-plus').addEventListener('click', () => {
        InkwellStore.setCartQty(item.id, item.qty + 1);
        render();
      });
      row.querySelector('.ct-remove-btn').addEventListener('click', () => {
        InkwellStore.removeFromCart(item.id);
        render();
      });
      row.querySelector('.ct-move-wishlist-btn').addEventListener('click', () => {
        InkwellStore.toggleWishlist(item);
        InkwellStore.removeFromCart(item.id);
        render();
      });

      itemsEl.appendChild(row);
    });

    const delivery = subtotal >= FREE_DELIVERY_THRESHOLD_INR ? 0 : DELIVERY_FEE_INR;
    itemCountEl.textContent = totalQty;
    subtotalEl.textContent = fmt(subtotal);
    deliveryEl.textContent = delivery === 0 ? 'Free' : fmt(delivery);
    totalEl.textContent = fmt(subtotal + delivery);

    deliveryNoteEl.textContent = delivery > 0
      ? `Add ${fmt(FREE_DELIVERY_THRESHOLD_INR - subtotal)} more for free delivery`
      : 'Ships within 1-2 days.';
  }

  render();
})();
