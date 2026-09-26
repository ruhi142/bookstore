/* ==========================================================================
   INKWELL BOOKS — checkout.js
   Flipkart-style flow: Login (already done) -> Delivery Address ->
   Order Summary -> Payment Options -> Confirmation.
   Cart data comes from InkwellStore (localStorage). Addresses, order
   placement and the "add new address" form all talk to the real Django
   backend. The payment step itself is a fake gateway — this is a
   training-project simulation, not a real payment processor.
   ========================================================================== */

(function () {
  if (!window.InkwellStore) return;

  const blockLogin = document.getElementById('chkBlockLogin');
  const blockAddress = document.getElementById('chkBlockAddress');
  const blockSummary = document.getElementById('chkBlockSummary');
  const blockPayment = document.getElementById('chkBlockPayment');
  if (!blockAddress || !blockSummary || !blockPayment) return; // not-authenticated page has none of this

  /* ---------------- CHECKOUT ITEM SOURCE ----------------
     "Buy Now" from a book page hands off ONE item in its own slot
     (InkwellStore.getBuyNow) via the ?buynow=1 flag on the URL. That item
     is completely separate from the real cart, so a Buy Now purchase never
     shows or ships whatever else is already sitting in the cart — and
     "Proceed to Checkout" from the cart page (no ?buynow=1) always uses the
     real cart, untouched by any leftover Buy Now item from earlier. */
  const isBuyNow = new URLSearchParams(window.location.search).get('buynow') === '1';
  const buyNowItem = isBuyNow ? InkwellStore.getBuyNow() : null;

  function getCheckoutItems() {
    return buyNowItem ? [buyNowItem] : InkwellStore.getCart();
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  /* ---------------- TOP STEP TRACKER (Address -> Order Summary -> Payment) ---------------- */
  const trackOrder = ['address', 'summary', 'payment'];
  const trackSteps = {
    address: document.querySelector('.chk-track-step[data-track-step="address"]'),
    summary: document.querySelector('.chk-track-step[data-track-step="summary"]'),
    payment: document.querySelector('.chk-track-step[data-track-step="payment"]'),
  };
  function updateTrack(currentStep) {
    const idx = trackOrder.indexOf(currentStep);
    trackOrder.forEach((key, i) => {
      const el = trackSteps[key];
      if (!el) return;
      el.classList.remove('is-active', 'is-done');
      if (i < idx) el.classList.add('is-done'); // tick only shows once a step is behind us
      else if (i === idx) el.classList.add('is-active');
    });
  }
  updateTrack('address');

  /* ---------------- SLIDING WIZARD (Address <-> Order Summary <-> Payment) ----------------
     Only one step-page is ever in the DOM flow at a time. Moving forward,
     the current page slides out to the left while the next one slides in
     from the right (like Flipkart/Amazon); moving back (Change), it's
     mirrored — old page slides out right, new one slides in from the left.
     The top tracker's tick "travels" in step with the page swap. */
  const stepPages = { address: blockAddress, summary: blockSummary, payment: blockPayment };
  let currentStepKey = 'address';

  function goToStep(nextStepKey) {
    if (nextStepKey === currentStepKey) return;
    const forward = trackOrder.indexOf(nextStepKey) > trackOrder.indexOf(currentStepKey);
    const currentPage = stepPages[currentStepKey];
    const nextPage = stepPages[nextStepKey];
    const outX = forward ? '-36px' : '36px';
    const inX = forward ? '36px' : '-36px';

    currentStepKey = nextStepKey;
    updateTrack(nextStepKey);

    currentPage.style.transition = 'transform .28s ease, opacity .28s ease';
    currentPage.style.transform = `translateX(${outX})`;
    currentPage.style.opacity = '0';

    setTimeout(() => {
      currentPage.classList.remove('is-active');
      currentPage.style.display = 'none';
      currentPage.style.transition = '';
      currentPage.style.transform = '';
      currentPage.style.opacity = '';

      nextPage.style.transition = 'none';
      nextPage.style.transform = `translateX(${inX})`;
      nextPage.style.opacity = '0';
      nextPage.style.display = 'block';
      nextPage.classList.add('is-active');
      void nextPage.offsetWidth; // force reflow so the transition below actually plays
      nextPage.style.transition = 'transform .32s ease, opacity .32s ease';
      nextPage.style.transform = 'translateX(0)';
      nextPage.style.opacity = '1';
      nextPage.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setTimeout(() => {
        nextPage.style.transition = '';
        nextPage.style.transform = '';
        nextPage.style.opacity = '';
      }, 340);
    }, 260);
  }

  /* ---------------- PRICE DETAILS SIDEBAR + ORDER SUMMARY ---------------- */
  function renderTotals() {
    const items = getCheckoutItems();
    const summaryItems = document.getElementById('chkSummaryItems');
    let total = 0;
    let count = 0;

    summaryItems.innerHTML = items.map((item) => {
      const lineTotal = item.price * item.qty;
      total += lineTotal;
      count += item.qty;
      return `<div class="chk-summary-item">
        <img src="${InkwellStore.imgUrl(item.img, 100)}" alt="${item.title}">
        <span class="chk-summary-item-name">${item.title}</span>
        <span class="chk-summary-item-qty">Qty ${item.qty}</span>
        <span class="chk-summary-item-price">₹${lineTotal}</span>
      </div>`;
    }).join('');

    const deliveryFee = (total >= 499 || total === 0) ? 0 : 49;
    document.getElementById('chkItemCount').textContent = count;
    document.getElementById('chkItemPlural').textContent = count === 1 ? '' : 's';
    document.getElementById('chkSidePrice').textContent = `₹${total}`;
    document.getElementById('chkSideDelivery').textContent = deliveryFee ? `₹${deliveryFee}` : 'Free';
    document.getElementById('chkSideTotal').textContent = `₹${total + deliveryFee}`;
    return { total, deliveryFee };
  }
  renderTotals();

  /* ---------------- STEP: DELIVERY ADDRESS ---------------- */
  const addrList = document.getElementById('addrSelectList');
  const deliverHereBtn = document.getElementById('chkDeliverHereBtn');
  const noAddrNote = document.getElementById('chkNoAddrNote');

  function selectedAddressInput() {
    return document.querySelector('input[name="deliveryAddr"]:checked');
  }

  function refreshAddressCardStyles() {
    document.querySelectorAll('.addr-select-card').forEach((card) => {
      const input = card.querySelector('input');
      card.classList.toggle('is-checked', input.checked);
    });
  }

  addrList.addEventListener('change', refreshAddressCardStyles);
  addrList.addEventListener('click', (e) => {
    const card = e.target.closest('.addr-select-card');
    if (!card) return;
    card.querySelector('input').checked = true;
    refreshAddressCardStyles();
  });

  function confirmAddress() {
    const input = selectedAddressInput();
    if (!input) return;
    // The address recap now lives at the top of Order Summary (Flipkart-
    // style "Deliver to: ... CHANGE"), not as a leftover collapsed Address
    // block — the Address page itself is fully swapped out by goToStep().
    document.getElementById('chkRecapName').textContent =
      `${input.dataset.name} (${input.dataset.label})`;
    document.getElementById('chkRecapLines').textContent =
      `${input.dataset.line1}${input.dataset.line2 ? ', ' + input.dataset.line2 : ''}, ${input.dataset.city}, ${input.dataset.state} - ${input.dataset.pincode} · Phone: ${input.dataset.phone}`;
    goToStep('summary');
  }

  deliverHereBtn.addEventListener('click', () => {
    if (!selectedAddressInput()) return;
    confirmAddress();
  });

  document.getElementById('chkChangeAddrBtn').addEventListener('click', () => {
    goToStep('address');
  });

  /* ---- Add a new address inline, right from checkout ---- */
  const toggleAddAddrBtn = document.getElementById('toggleAddAddrChk');
  const addAddrForm = document.getElementById('addAddrFormChk');
  const addrFormError = document.getElementById('chkAddrFormError');

  toggleAddAddrBtn.addEventListener('click', () => {
    const isHidden = addAddrForm.style.display === 'none';
    addAddrForm.style.display = isHidden ? 'block' : 'none';
    if (isHidden) addAddrForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.getElementById('chkCancelAddAddrBtn').addEventListener('click', () => {
    addAddrForm.style.display = 'none';
    addAddrForm.reset();
    addrFormError.textContent = '';
  });

  addAddrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('chkAddrSaveBtn');
    const payload = new URLSearchParams({
      label: document.getElementById('chkAddrLabel').value,
      full_name: document.getElementById('chkAddrFullName').value.trim(),
      addr_phone: document.getElementById('chkAddrPhone').value.trim(),
      pincode: document.getElementById('chkAddrPincode').value.trim(),
      line1: document.getElementById('chkAddrLine1').value.trim(),
      line2: document.getElementById('chkAddrLine2').value.trim(),
      city: document.getElementById('chkAddrCity').value.trim(),
      state: document.getElementById('chkAddrState').value.trim(),
    });

    addrFormError.textContent = '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    fetch('/cart/add-address/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: payload.toString(),
    })
      .then((res) => res.json())
      .then((data) => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save and Deliver Here';
        if (!data.ok) {
          addrFormError.textContent = data.error || 'Could not save that address.';
          return;
        }
        const a = data.address;
        document.querySelectorAll('input[name="deliveryAddr"]').forEach((i) => { i.checked = false; });

        const card = document.createElement('label');
        card.className = 'addr-select-card is-checked';
        card.dataset.id = a.id;
        card.innerHTML = `
          <input type="radio" name="deliveryAddr" value="${a.id}" checked
            data-name="${a.full_name}" data-phone="${a.phone}" data-label="${a.label}"
            data-line1="${a.line1}" data-line2="${a.line2}" data-city="${a.city}"
            data-state="${a.state}" data-pincode="${a.pincode}">
          <span class="addr-select-radio"></span>
          <div class="addr-select-body">
            <div class="addr-select-top">
              <span class="addr-select-name">${a.full_name}</span>
              <span class="addr-select-tag">${a.label}</span>
              ${a.is_default ? '<span class="addr-select-default">DEFAULT</span>' : ''}
            </div>
            <p class="addr-select-lines">${a.line1}${a.line2 ? ', ' + a.line2 : ''}, ${a.city}, ${a.state} - ${a.pincode}</p>
            <p class="addr-select-phone">Phone: ${a.phone}</p>
          </div>`;
        addrList.appendChild(card);
        refreshAddressCardStyles();

        noAddrNote.style.display = 'none';
        deliverHereBtn.disabled = false;
        addAddrForm.style.display = 'none';
        addAddrForm.reset();

        confirmAddress();
      })
      .catch(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save and Deliver Here';
        addrFormError.textContent = 'Could not reach the server. Please try again.';
      });
  });

  /* ---------------- STEP: ORDER SUMMARY ---------------- */
  document.getElementById('chkContinueBtn').addEventListener('click', () => {
    goToStep('payment');
  });

  /* ---------------- STEP: PAYMENT OPTIONS ---------------- */
  const payOptions = document.querySelectorAll('.chk-pay-option');
  const detailPanels = {
    razorpay: document.getElementById('chkDetailRazorpay'),
    cod: document.getElementById('chkDetailCod'),
  };

  payOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      payOptions.forEach((o) => o.classList.remove('is-active'));
      opt.classList.add('is-active');
      const method = opt.querySelector('input').value;
      Object.entries(detailPanels).forEach(([key, panel]) => {
        panel.style.display = key === method ? 'block' : 'none';
      });
    });
  });

  /* ---- Shared success handling: real Order now exists in the DB either
     way (COD or Razorpay-verified) — clear whichever slot the items came
     from, tick every tracker step, and swap in the confirmation screen. ---- */
  function showOrderSuccess(orderId, addrInput, items) {
    if (buyNowItem) InkwellStore.clearBuyNow();
    else items.forEach((item) => InkwellStore.removeFromCart(item.id));

    Object.values(trackSteps).forEach((el) => {
      if (!el) return;
      el.classList.remove('is-active');
      el.classList.add('is-done');
    });

    document.getElementById('chkOrderId').textContent = orderId;
    document.getElementById('chkDownloadInvoiceBtn').href = `/orders/invoice/${orderId}/`;
    document.getElementById('chkConfirmAddress').innerHTML =
      `<strong>Delivering to:</strong> ${addrInput.dataset.name}<br>
       ${addrInput.dataset.line1}${addrInput.dataset.line2 ? ', ' + addrInput.dataset.line2 : ''},
       ${addrInput.dataset.city}, ${addrInput.dataset.state} - ${addrInput.dataset.pincode}<br>
       Phone: ${addrInput.dataset.phone}`;
    document.getElementById('chkLayoutSection').style.display = 'none';
    document.getElementById('chkConfirmSection').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetPayBtn() {
    const payBtn = document.getElementById('chkPayBtn');
    payBtn.textContent = 'Pay & Place Order';
    payBtn.disabled = false;
  }

  /* ---- Cash on Delivery: no gateway involved at all ---- */
  function placeCodOrder(addrInput, items) {
    const payBtn = document.getElementById('chkPayBtn');
    payBtn.textContent = 'Placing order…';
    payBtn.disabled = true;

    fetch('/cart/place-order/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      body: JSON.stringify({ items: items, address_id: addrInput.value }),
    })
      .then((res) => res.json())
      .then((data) => {
        resetPayBtn();
        if (data.ok) showOrderSuccess(data.order_id, addrInput, items);
        else alert(data.error || 'Something went wrong placing your order.');
      })
      .catch(() => {
        resetPayBtn();
        alert('Could not reach the server. Please try again.');
      });
  }

  /* ---- UPI / Card / Netbanking / Wallet: real Razorpay Checkout ----
     1) Ask our server to open a Razorpay Order for the server-computed
        total (never trust an amount from the browser).
     2) Open Razorpay's own popup with that order_id — the person pays
        inside Razorpay's UI, we never see their card/UPI details.
     3) Razorpay's handler callback hands us back a payment_id + signature;
        we POST those to our server, which verifies the signature with
        Razorpay before creating the real Order. */
  function payWithRazorpay(method, addrInput, items) {
    const payBtn = document.getElementById('chkPayBtn');
    if (!window.Razorpay || !window.RAZORPAY_KEY_ID) {
      alert('Online payments aren\'t set up on this server yet — please use Cash on Delivery for now.');
      return;
    }

    payBtn.textContent = 'Starting payment…';
    payBtn.disabled = true;

    fetch('/cart/create-razorpay-order/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      body: JSON.stringify({ items: items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          resetPayBtn();
          alert(data.error || 'Could not start the payment.');
          return;
        }

        const rzp = new Razorpay({
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          order_id: data.razorpay_order_id,
          name: 'Inkwell Books',
          description: `Order for ${items.reduce((n, i) => n + i.qty, 0)} item(s)`,
          prefill: { name: addrInput.dataset.name, contact: addrInput.dataset.phone },
          theme: { color: '#16302A' },
          handler: function (response) {
            payBtn.textContent = 'Verifying payment…';
            fetch('/cart/verify-payment/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
              body: JSON.stringify({
                items: items,
                payment_method: method,
                address_id: addrInput.value,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
              .then((res) => res.json())
              .then((verifyData) => {
                resetPayBtn();
                if (verifyData.ok) showOrderSuccess(verifyData.order_id, addrInput, items);
                else alert(verifyData.error || 'Payment could not be verified.');
              })
              .catch(() => {
                resetPayBtn();
                alert('Payment went through, but we could not reach the server to confirm it. ' +
                  'Please contact support with this payment ID: ' + response.razorpay_payment_id);
              });
          },
          modal: { ondismiss: resetPayBtn },
        });

        rzp.on('payment.failed', function (response) {
          resetPayBtn();
          const reason = response && response.error && response.error.description;
          alert('Payment failed' + (reason ? ': ' + reason : '. Please try again.'));
        });

        resetPayBtn();
        rzp.open();
      })
      .catch(() => {
        resetPayBtn();
        alert('Could not reach the server. Please try again.');
      });
  }

  document.getElementById('chkPayBtn').addEventListener('click', () => {
    const selectedInput = document.querySelector('input[name="paymethod"]:checked');
    const selectedMethod = selectedInput ? selectedInput.value : 'razorpay';
    const addrInput = selectedAddressInput();
    const items = getCheckoutItems();

    if (!addrInput) {
      alert('Please select a delivery address first.');
      document.getElementById('chkChangeAddrBtn').click();
      return;
    }
    if (!items.length) {
      alert('Your cart is empty.');
      return;
    }

    if (selectedMethod === 'cod') placeCodOrder(addrInput, items);
    else payWithRazorpay(selectedMethod, addrInput, items);
  });
})();
