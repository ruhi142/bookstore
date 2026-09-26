/* ==========================================================================
   ORDERS — track_order.js
   Looks up a real order (placed via checkout) by ID and renders its
   timeline computed from the ACTUAL order date/time:
   Day 1: Placed · Day 2: Packed · Day 3: Shipped ·
   Day 4: Out for Delivery (morning) -> Delivered (same day, afternoon)
   ========================================================================== */

(function () {
  const btn = document.getElementById('trkTrackBtn');
  const result = document.getElementById('trkResult');
  const notFound = document.getElementById('trkNotFound');
  const orderIdInput = document.getElementById('trkOrderId');
  if (!btn || !window.InkwellStore) return;

  function fmtDateTime(d) {
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function render(order) {
    const { timeline, currentIndex, currentLabel } = InkwellStore.computeOrderTimeline(order);

    document.getElementById('trkOrderIdDisplay').textContent = order.id;
    document.getElementById('trkStatusBadge').textContent = currentLabel;
    document.getElementById('trkStatusBadge').className =
      'ord-status-badge ' + (currentLabel === 'Delivered' ? 'ord-status-delivered' : 'ord-status-transit');

    const deliveredStep = timeline[timeline.length - 1];
    document.getElementById('trkEta').innerHTML = currentLabel === 'Delivered'
      ? `Delivered on <strong>${fmtDateTime(deliveredStep.at)}</strong>`
      : `Expected delivery: <strong>${fmtDateTime(deliveredStep.at)}</strong>`;

    const tlEl = document.getElementById('trkTimeline');
    tlEl.innerHTML = timeline.map((step, i) => {
      const stateClass = i < currentIndex ? 'is-done' : (i === currentIndex ? 'is-active' : '');
      const timeText = step.reached ? fmtDateTime(step.at) : 'Pending';
      return `<div class="ord-tl-step ${stateClass}">
        <span class="ord-tl-dot"></span>
        <div><h4>${step.label}</h4><p>${timeText}</p></div>
      </div>`;
    }).join('');

    result.style.display = 'block';
    notFound.style.display = 'none';
  }

  function track() {
    const id = orderIdInput.value.trim();
    if (!id) return;
    const order = InkwellStore.findOrderById(id);
    if (order) {
      render(order);
    } else {
      result.style.display = 'none';
      notFound.style.display = 'block';
    }
  }

  btn.addEventListener('click', track);
  orderIdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') track(); });

  // If arriving from "Track Order" link on a specific order (My Orders page),
  // pre-fill and auto-track it.
  const params = new URLSearchParams(window.location.search);
  const prefillId = params.get('id');
  if (prefillId) {
    orderIdInput.value = prefillId;
    track();
  } else {
    // Otherwise default to the user's most recent order, if any.
    const orders = InkwellStore.getOrders();
    if (orders.length > 0) {
      orderIdInput.value = orders[0].id;
      track();
    }
  }
})();
