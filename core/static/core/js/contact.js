/* ==========================================================================
   INKWELL BOOKS — contact.js
   FAQ accordion + "Chat with Inkwell Assistant" quick-link opens the
   floating chatbot widget that lives in base.html.
   ========================================================================== */

(function () {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    question && question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      faqItems.forEach((i) => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });

  const openChatLink = document.getElementById('openChatFromContact');
  openChatLink && openChatLink.addEventListener('click', (e) => {
    e.preventDefault();
    const fab = document.getElementById('chatFab');
    fab && fab.click();
  });
})();
