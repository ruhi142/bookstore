/* ==========================================================================
   INKWELL BOOKS — chatbot.js
   Controls the floating widget shared across every page (included from base.html).
   Icon-only by default; click toggles the panel open/closed.
   ========================================================================== */

(function () {
  const widget = document.getElementById('chatWidget');
  if (!widget) return;

  const fab = document.getElementById('chatFab');
  const closeBtn = document.getElementById('chatPanelClose');
  const body = document.getElementById('chatPanelBody');
  const form = document.getElementById('chatPanelForm');
  const input = document.getElementById('chatPanelInput');

  function openChat() {
    widget.classList.add('is-open');
    input && input.focus();
  }
  function closeChat() {
    widget.classList.remove('is-open');
  }
  function toggleChat() {
    widget.classList.contains('is-open') ? closeChat() : openChat();
  }

  fab.addEventListener('click', toggleChat);
  closeBtn && closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeChat(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeChat();
  });

  // --------------------------------------------------------------------
  // Small in-widget catalog (mirrors the real titles from catalog/views.py
  // CATEGORIES + core/views.py BEST_SELLERS) so the assistant can answer
  // genre / mood / price questions with real, clickable titles instead of
  // a single canned line. Links point at the real category & book-detail
  // routes (/category/<slug>/ and /category/book/<id>/).
  // --------------------------------------------------------------------
  const BOOKS = [
    { id: "fiction-0", title: "The Silent Patient", author: "Alex Michaelides", price: 239, slug: "fiction", tags: ["thriller", "mystery", "suspense", "fiction", "psychological"] },
    { id: "fiction-1", title: "Where the Crawdads Sing", author: "Delia Owens", price: 349, slug: "fiction", tags: ["fiction", "mystery", "drama", "romance"] },
    { id: "fiction-2", title: "The Midnight Library", author: "Matt Haig", price: 299, slug: "fiction", tags: ["fiction", "feel-good", "philosophical", "mood"] },
    { id: "fiction-3", title: "Circe", author: "Madeline Miller", price: 319, slug: "fiction", tags: ["fiction", "mythology", "fantasy"] },
    { id: "fiction-4", title: "The Kite Runner", author: "Khaled Hosseini", price: 279, slug: "fiction", tags: ["fiction", "drama", "emotional", "classic"] },
    { id: "fiction-5", title: "Normal People", author: "Sally Rooney", price: 249, slug: "fiction", tags: ["fiction", "romance", "drama"] },
    { id: "fiction-7", title: "The Song of Achilles", author: "Madeline Miller", price: 289, slug: "fiction", tags: ["fiction", "mythology", "romance", "fantasy"] },
    { id: "non-fiction-0", title: "Atomic Habits", author: "James Clear", price: 299, slug: "non-fiction", tags: ["non-fiction", "self-help", "motivational", "productivity"] },
    { id: "non-fiction-1", title: "Sapiens", author: "Yuval Noah Harari", price: 249, slug: "non-fiction", tags: ["non-fiction", "history", "science"] },
    { id: "non-fiction-2", title: "Educated", author: "Tara Westover", price: 329, slug: "non-fiction", tags: ["non-fiction", "biography", "memoir"] },
    { id: "non-fiction-4", title: "Becoming", author: "Michelle Obama", price: 379, slug: "non-fiction", tags: ["non-fiction", "biography", "memoir"] },
    { id: "non-fiction-6", title: "The Body Keeps the Score", author: "Bessel van der Kolk", price: 399, slug: "non-fiction", tags: ["non-fiction", "self-help", "psychology"] },
    { id: "non-fiction-7", title: "Deep Work", author: "Cal Newport", price: 269, slug: "non-fiction", tags: ["non-fiction", "self-help", "business", "productivity"] },
    { id: "academic-0", title: "Concepts of Physics — Vol 1", author: "H.C. Verma", price: 299, slug: "academic", tags: ["academic", "textbook", "exam", "physics"] },
    { id: "academic-3", title: "Introduction to Algorithms", author: "CLRS", price: 899, slug: "academic", tags: ["academic", "textbook", "exam", "engineering", "computer science"] },
    { id: "academic-5", title: "Business Statistics", author: "Ken Black", price: 449, slug: "academic", tags: ["academic", "textbook", "exam", "business"] },
    { id: "academic-7", title: "Principles of Economics", author: "N. Gregory Mankiw", price: 499, slug: "academic", tags: ["academic", "textbook", "exam", "business"] },
    { id: "children-0", title: "The Very Hungry Caterpillar", author: "Eric Carle", price: 199, slug: "children", tags: ["children", "kids", "picture book"] },
    { id: "children-2", title: "Matilda", author: "Roald Dahl", price: 249, slug: "children", tags: ["children", "kids"] },
    { id: "children-3", title: "The Gruffalo", author: "Julia Donaldson", price: 179, slug: "children", tags: ["children", "kids", "picture book"] },
    { id: "children-5", title: "Winnie-the-Pooh", author: "A.A. Milne", price: 219, slug: "children", tags: ["children", "kids", "classic"] },
    { id: "sale-0", title: "The Alchemist", author: "Paulo Coelho", price: 129, slug: "sale", tags: ["sale", "fiction", "motivational", "classic"] },
    { id: "sale-1", title: "1984", author: "George Orwell", price: 149, slug: "sale", tags: ["sale", "fiction", "classic", "dystopian"] },
    { id: "sale-2", title: "To Kill a Mockingbird", author: "Harper Lee", price: 159, slug: "sale", tags: ["sale", "fiction", "classic"] },
    { id: "sale-3", title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", price: 139, slug: "sale", tags: ["sale", "non-fiction", "business", "motivational"] },
    { id: "sale-5", title: "Ikigai", author: "Héctor García", price: 149, slug: "sale", tags: ["sale", "non-fiction", "self-help", "motivational"] },
    { id: "sale-7", title: "Wings of Fire", author: "A.P.J. Abdul Kalam", price: 129, slug: "sale", tags: ["sale", "non-fiction", "biography", "motivational"] },
  ];

  // Genre / mood keyword -> catalog tag(s). Checked in order; first match wins.
  const GENRE_MAP = [
    { re: /thriller|mystery|suspense|crime|detective|whodunit/i, tags: ["thriller", "mystery"] },
    { re: /myth|mythology|fantasy/i, tags: ["mythology", "fantasy"] },
    { re: /biography|memoir|autobiography/i, tags: ["biography", "memoir"] },
    { re: /self[\s-]?help|motivat|productivity|habit/i, tags: ["self-help", "motivational", "productivity"] },
    { re: /business|finance|econom/i, tags: ["business"] },
    { re: /histor(y|ical)|science/i, tags: ["history", "science"] },
    { re: /academic|textbook|exam|engineering|physics|computer science|syllabus/i, tags: ["academic", "textbook", "exam"] },
    { re: /child|kids|picture book/i, tags: ["children", "kids"] },
    { re: /non[\s-]?fiction/i, tags: ["non-fiction"] },
    { re: /fiction|novel|drama|story|feel[\s-]?good/i, tags: ["fiction"] },
  ];

  // Genres people might ask for that we don't actually stock yet.
// Checked only when GENRE_MAP found no match, so it never overrides a
// real hit (e.g. "romance" still resolves via the fiction regex above).
const UNAVAILABLE_GENRE_MAP = [
  { re: /horror|scary|ghost story/i, label: "Horror" },
  { re: /poetry|poems?/i, label: "Poetry" },
  { re: /sci-?fi|science fiction/i, label: "Sci-Fi" },
  { re: /comic|manga|graphic novel/i, label: "Comics & Manga" },
  { re: /cook(ing|book)|recipe/i, label: "Cookbooks" },
  { re: /travel(ogue)?/i, label: "Travel" },
];

function matchUnavailableGenre(text) {
  const hit = UNAVAILABLE_GENRE_MAP.find(entry => entry.re.test(text));
  return hit ? hit.label : null;
}

  const CATEGORY_URL = (slug) => `/category/${slug}/`;
  const BOOK_URL = (id) => `/category/book/${id}/`;

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function addMessage(content, who, isHtml) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + who;
    if (isHtml) {
      div.innerHTML = content;
    } else {
      div.textContent = content;
    }
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = addMessage('<span class="chat-typing"><span></span><span></span><span></span></span>', 'bot', true);
    div.classList.add('is-typing');
    return div;
  }

  function bookListHtml(books, intro) {
    const items = books.slice(0, 4).map(b => (
      `<a class="chat-book" href="${BOOK_URL(b.id)}">` +
        `<span class="chat-book-title">${escapeHtml(b.title)}</span>` +
        `<span class="chat-book-meta">${escapeHtml(b.author)} · ₹${b.price}</span>` +
      `</a>`
    )).join('');
    return `<div class="chat-books-intro">${escapeHtml(intro)}</div><div class="chat-books">${items}</div>`;
  }

  function extractBudget(text) {
    const m = text.match(/(?:under|below|less than|within)\s*₹?\s*(\d{2,5})|₹\s*(\d{2,5})|(\d{2,5})\s*(?:rs|rupees|₹)/i);
    if (!m) return null;
    return parseInt(m[1] || m[2] || m[3], 10);
  }

  function matchGenreTags(text) {
    for (const entry of GENRE_MAP) {
      if (entry.re.test(text)) return entry.tags;
    }
    return null;
  }

  function booksMatchingTags(tags) {
    return BOOKS.filter(b => b.tags.some(t => tags.includes(t)));
  }

  // Core intent → reply logic, keyword-driven against what the user typed.
  function getReply(rawText) {
    const text = rawText.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(text)) {
      return { html: false, text: "Hi there! 👋 Tell me a genre (like thriller, self-help or academic) or a budget, and I'll pull up a few titles for you." };
    }

    // Thanks / bye
    if (/thank|thanks|thank you/.test(text)) {
      return { html: false, text: "You're welcome! Happy reading 📚 — let me know if you'd like more suggestions." };
    }
    if (/\b(bye|goodbye|see you)\b/.test(text)) {
      return { html: false, text: "Take care! Come back anytime you're looking for your next read. 👋" };
    }

    // Order tracking / delivery status
    if (/\border|track(ing)?|delivery|dispatch|shipp?ing|where.?s my/.test(text)) {
      return {
        html: true,
        text: `You can check your order status on the <a href="/orders/track/">Track Order</a> page, or see everything you've bought under <a href="/orders/my-orders/">My Orders</a>. Our helpline is <a href="tel:+911234567890">+91 12345 67890</a> if you need a hand.`,
      };
    }

    // Offers / discounts / coupon codes
    if (/discount|offer|coupon|code|deal/.test(text)) {
      return {
        html: true,
        text: `Here are our live offers: <strong>READ25</strong> for flat 25% off Fiction, an extra 10% off on prepaid orders, free delivery above ₹499, and buy-2-get-1-free on Academic books. Check the full <a href="/category/sale/">Sale shelf</a> for up to 70% off.`,
      };
    }

    // Budget-only or genre+budget suggestions (checked before the generic
    // help intent below, since phrases like "self help books" or "help me
    // find a thriller" should trigger a book suggestion, not a support reply)
    const budget = extractBudget(text);
const genreTags = matchGenreTags(text);

// NEW: tell the truth if it's a genre we simply don't carry
if (!genreTags) {
  const missingGenre = matchUnavailableGenre(text);
  if (missingGenre) {
    return {
      html: false,
      text: `We haven't added ${missingGenre} to our collection yet — but we'll notify you as soon as it's available! In the meantime, try Fiction, Non-Fiction, Academic, or Children's books.`,
    };
  }
}
  const wantsSuggestion = /suggest|recommend|\bbook\b|\bbooks\b|\bread\b|looking for|show me|find me/.test(text) || genreTags || budget !== null;

    if (wantsSuggestion) {
      let pool = genreTags ? booksMatchingTags(genreTags) : BOOKS.slice();
      if (budget !== null) {
        pool = pool.filter(b => b.price <= budget).sort((a, b) => a.price - b.price);
      }
      if (pool.length === 0) {
        return { html: false, text: "I couldn't find a match for that yet — try a different genre (thriller, self-help, academic, children) or a higher budget, and I'll take another look." };
      }
      let intro;
      if (genreTags && budget !== null) {
        intro = `A few picks under ₹${budget}:`;
      } else if (genreTags) {
        intro = "Here are a few titles you might enjoy:";
      } else {
        intro = `Popular titles under ₹${budget}:`;
      }
      const shuffled = genreTags || budget !== null ? pool : pool.sort(() => Math.random() - 0.5);
      return { html: true, text: bookListHtml(shuffled, intro) };
    }

    // Help / human / contact (checked after suggestions so "self help" etc.
    // above still resolve to book picks)
    if (/\bhelp\b|contact|human|agent|support|complain/.test(text)) {
      return {
        html: true,
        text: `I can help you find a book, check an order, or point you to an offer. For anything else, our team is reachable on the <a href="/contact/">Contact page</a> or at <a href="tel:+911234567890">+91 12345 67890</a>.`,
      };
    }

    // Fallback
    return {
      html: true,
      text: `I didn't quite catch that. Try asking things like <em>"suggest a book"</em>, <em>"books under ₹300"</em>, or <em>"where's my order?"</em> — or browse a <a href="/category/fiction/">category</a> above.`,
    };
  }

  // Quick-suggestion chips inside the welcome message
  body && body.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-suggest]');
    if (chip) {
      handleUserMessage(chip.getAttribute('data-suggest'));
      return;
    }
    const bookCard = e.target.closest('.chat-book');
    // Links inside .chat-book navigate normally; nothing to intercept.
  });

  function handleUserMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');
    input.value = '';

    const typingEl = showTyping();

    setTimeout(() => {
      const reply = getReply(text);
      typingEl.remove();
      addMessage(reply.text, 'bot', !!reply.html);
    }, 450);
  }

  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUserMessage(input.value);
  });
})();
