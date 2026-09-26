(function () {
  document.querySelectorAll('.book-card').forEach((card) => {
    const item = {
      id: card.dataset.id, title: card.dataset.title, author: card.dataset.author,
      price: Number(card.dataset.price), old_price: Number(card.dataset.oldPrice), img: card.dataset.img,
    };
    const addBtn = card.querySelector('.btn-add-cart');
    addBtn && addBtn.addEventListener('click', () => {
      if (!window.InkwellStore) return;
      InkwellStore.addToCart(item);
      addBtn.textContent = 'Added ✓';
      setTimeout(() => { addBtn.textContent = 'Add to Cart'; }, 1200);
    });
    const wishBtn = card.querySelector('.cat-wishlist-btn');
    if (wishBtn && window.InkwellStore) {
      if (InkwellStore.isInWishlist(item.id)) wishBtn.classList.add('is-saved');
      wishBtn.addEventListener('click', () => {
        const saved = InkwellStore.toggleWishlist(item);
        wishBtn.classList.toggle('is-saved', saved);
      });
    }
  });
})();
