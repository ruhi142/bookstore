(function () {
  document.querySelectorAll('.ord-invoice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'Preparing…';
      setTimeout(() => { btn.textContent = original; }, 900);
    });
  });
})();
