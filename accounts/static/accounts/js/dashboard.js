document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('dashWishlistCount');
  if (el && window.InkwellStore) {
    el.textContent = InkwellStore.getWishlist().length;
  }
});
