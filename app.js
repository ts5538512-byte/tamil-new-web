(function () {
  'use strict';

  const STORAGE_KEYS = {
    menu: 'restaurant_menu',
    transactions: 'restaurant_transactions',
    cart: 'restaurant_cart',
  };

  const UPI_CONFIG = {
    pa: 'restaurant@upi',
    pn: 'Restaurant',
    cu: 'INR',
  };

  const DEFAULT_MENU = [
    { id: 'm1', name: 'Idly', price: 40, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Idli_-_A_Traditional_Indian_Food.JPG/400px-Idli_-_A_Traditional_Indian_Food.JPG' },
    { id: 'm2', name: 'Dosai', price: 55, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Masala_dosa_01.jpg/400px-Masala_dosa_01.jpg' },
    { id: 'm3', name: 'Poori', price: 50, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Poori_Masala_Tamil_Nadu.jpg/400px-Poori_Masala_Tamil_Nadu.jpg' },
    { id: 'm4', name: 'Pongal', price: 50, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Pongal_with_sambar.jpg/400px-Pongal_with_sambar.jpg' },
    { id: 'm5', name: 'Tea', price: 20, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Masala_Chai.JPG/400px-Masala_Chai.JPG' },
    { id: 'm6', name: 'Coffee', price: 30, imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Roasted_coffee_beans.jpg/400px-Roasted_coffee_beans.jpg' },
  ];

  function id() {
    return 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getMenu() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.menu);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveMenu(items) {
    localStorage.setItem(STORAGE_KEYS.menu, JSON.stringify(items));
  }

  function getTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.transactions);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function addTransaction(tx) {
    const list = getTransactions();
    list.push({ id: id(), date: new Date().toISOString(), ...tx });
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(list));
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cart);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  }

  function ensureMenu() {
    let menu = getMenu();
    if (!menu || !menu.length) {
      menu = DEFAULT_MENU.map((m) => ({ ...m, id: id() }));
      saveMenu(menu);
    }
    return menu;
  }

  let menu = [];
  let cart = [];

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function showSection(sectionId) {
    $$('.section').forEach((el) => el.classList.remove('active'));
    $$('.nav-btn').forEach((el) => el.classList.toggle('active', el.dataset.section === sectionId));
    const section = $('#section-' + sectionId);
    if (section) section.classList.add('active');
  }

  function renderMenuGrid() {
    const grid = $('#menu-grid');
    if (!grid) return;
    grid.innerHTML = '';
    menu.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'menu-card';
      card.setAttribute('role', 'listitem');
      card.tabIndex = 0;
      card.dataset.id = item.id;
      const img = document.createElement('img');
      img.className = 'menu-card-image';
      img.src = item.imageUrl || '';
      img.alt = item.name;
      img.loading = 'lazy';
      img.onerror = () => { img.style.display = 'none'; };
      const body = document.createElement('div');
      body.className = 'menu-card-body';
      body.innerHTML =
        '<h3 class="menu-card-name">' + escapeHtml(item.name) + '</h3>' +
        '<p class="menu-card-price">₹' + Number(item.price).toFixed(0) + '</p>' +
        '<p class="menu-card-add">Click to add</p>';
      card.append(img, body);
      card.addEventListener('click', () => addToCart(item));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addToCart(item); } });
      grid.appendChild(card);
    });
  }

  function addToCart(item) {
    let row = cart.find((r) => r.id === item.id);
    if (row) row.qty += 1;
    else cart.push({ id: item.id, name: item.name, price: Number(item.price), qty: 1 });
    saveCart(cart);
    renderCart();
  }

  function removeFromCart(itemId) {
    cart = cart.filter((r) => r.id !== itemId);
    saveCart(cart);
    renderCart();
  }

  function setCartQty(itemId, qty) {
    const n = Math.max(0, parseInt(qty, 10));
    if (!n) {
      removeFromCart(itemId);
      return;
    }
    const row = cart.find((r) => r.id === itemId);
    if (row) row.qty = n;
    saveCart(cart);
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart(cart);
    renderCart();
    closeQrModal();
  }

  function getSubtotal() {
    return cart.reduce((sum, r) => sum + r.price * r.qty, 0);
  }

  function renderCart() {
    const list = $('#cart-list');
    const empty = $('#cart-empty');
    const summary = $('#bill-summary');
    const actions = $('#cart-actions');
    const totalEl = $('#bill-total');

    if (!list) return;

    list.innerHTML = '';
    if (cart.length === 0) {
      if (empty) empty.hidden = false;
      if (summary) summary.hidden = true;
      if (actions) actions.hidden = true;
      return;
    }

    if (empty) empty.hidden = true;
    if (summary) summary.hidden = false;
    if (actions) actions.hidden = false;

    const total = getSubtotal();
    if (totalEl) totalEl.textContent = '₹' + total.toFixed(0);

    cart.forEach((row) => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.setAttribute('role', 'listitem');
      const lineTotal = row.price * row.qty;
      const qtyId = 'qty-' + row.id;
      li.innerHTML =
        '<span class="cart-item-name">' + escapeHtml(row.name) + '</span>' +
        '<div class="cart-item-qty" role="group" aria-label="Quantity">' +
        '<button type="button" aria-label="Decrease" data-id="' + escapeHtml(row.id) + '" data-delta="-1">−</button>' +
        '<input type="number" id="' + qtyId + '" value="' + row.qty + '" min="1" aria-label="Quantity" data-id="' + escapeHtml(row.id) + '">' +
        '<button type="button" aria-label="Increase" data-id="' + escapeHtml(row.id) + '" data-delta="1">+</button>' +
        '</div>' +
        '<span>₹' + lineTotal.toFixed(0) + '</span>' +
        '<button type="button" class="cart-item-remove" data-id="' + escapeHtml(row.id) + '">Remove</button>';
      list.appendChild(li);
    });

    list.querySelectorAll('.cart-item-qty button[data-delta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = cart.find((r) => r.id === btn.dataset.id);
        if (!row) return;
        const delta = parseInt(btn.dataset.delta, 10);
        setCartQty(row.id, row.qty + delta);
      });
    });
    list.querySelectorAll('.cart-item-qty input').forEach((input) => {
      input.addEventListener('change', () => {
        setCartQty(input.dataset.id, input.value);
      });
    });
    list.querySelectorAll('.cart-item-remove').forEach((btn) => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openQrModal() {
    const total = getSubtotal();
    if (total <= 0) return;
    const modal = $('#modal-qr');
    const amountEl = $('#modal-qr-amount');
    const container = $('#qrcode');
    if (!modal || !amountEl || !container) return;

    amountEl.textContent = '₹' + total.toFixed(0);
    container.innerHTML = '';

    const am = total.toFixed(2);
    const upi = 'upi://pay?pa=' + encodeURIComponent(UPI_CONFIG.pa) + '&pn=' + encodeURIComponent(UPI_CONFIG.pn) + '&am=' + am + '&cu=' + UPI_CONFIG.cu;
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, upi);
    }
    modal.hidden = false;
  }

  function closeQrModal() {
    const modal = $('#modal-qr');
    if (modal) modal.hidden = true;
  }

  function confirmPayment() {
    const total = getSubtotal();
    if (total <= 0) { closeQrModal(); return; }
    const items = cart.map((r) => ({ name: r.name, qty: r.qty, price: r.price }));
    addTransaction({ items, total });
    clearCart();
    closeQrModal();
  }

  function printBill() {
    const total = getSubtotal();
    if (total <= 0) return;
    const wrap = $('#print-bill');
    const content = $('#print-bill-content');
    const totalEl = $('#print-bill-total');
    if (!wrap || !content || !totalEl) return;

    let html = '<table style="width:100%; border-collapse:collapse;"><thead><tr><th style="text-align:left; padding:6px 8px; border-bottom:1px solid #ccc;">Item</th><th style="text-align:center; padding:6px 8px; border-bottom:1px solid #ccc;">Qty</th><th style="text-align:right; padding:6px 8px; border-bottom:1px solid #ccc;">Price</th><th style="text-align:right; padding:6px 8px; border-bottom:1px solid #ccc;">Total</th></tr></thead><tbody>';
    cart.forEach((r) => {
      const line = r.price * r.qty;
      html += '<tr><td style="padding:6px 8px;">' + escapeHtml(r.name) + '</td><td style="text-align:center; padding:6px 8px;">' + r.qty + '</td><td style="text-align:right; padding:6px 8px;">₹' + r.price.toFixed(0) + '</td><td style="text-align:right; padding:6px 8px;">₹' + line.toFixed(0) + '</td></tr>';
    });
    html += '</tbody></table>';
    content.innerHTML = html;
    totalEl.textContent = '₹' + total.toFixed(0);
    window.print();
  }

  function renderManageList() {
    const list = $('#manage-list');
    if (!list) return;
    list.innerHTML = '';
    menu.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'manage-item';
      const imgEl = item.imageUrl
        ? '<img src="' + escapeHtml(item.imageUrl) + '" alt="" loading="lazy">'
        : '<div class="manage-item-placeholder">No img</div>';
      div.innerHTML =
        imgEl +
        '<div><span class="manage-item-name">' + escapeHtml(item.name) + '</span><br><span class="manage-item-price">₹' + Number(item.price).toFixed(0) + '</span></div>' +
        '<div class="manage-item-actions">' +
        '<button type="button" class="btn btn-primary manage-btn-edit" data-id="' + escapeHtml(item.id) + '">Edit</button>' +
        '<button type="button" class="btn btn-secondary manage-btn-delete" data-id="' + escapeHtml(item.id) + '">Delete</button>' +
        '</div>';
      list.appendChild(div);
    });
    list.querySelectorAll('.manage-btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = menu.find((m) => m.id === btn.dataset.id);
        if (!item) return;
        $('#form-item-id').value = item.id;
        $('#form-name').value = item.name;
        $('#form-price').value = item.price;
        $('#form-image').value = item.imageUrl || '';
        $('#btn-save').textContent = 'Update item';
        $('#form-menu').dataset.mode = 'edit';
      });
    });
    list.querySelectorAll('.manage-btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this item?')) return;
        const id = btn.dataset.id;
        menu = menu.filter((m) => m.id !== id);
        saveMenu(menu);
        renderManageList();
        renderMenuGrid();
        resetForm();
      });
    });
  }

  function resetForm() {
    const form = $('#form-menu');
    $('#form-item-id').value = '';
    $('#form-name').value = '';
    $('#form-price').value = '';
    $('#form-image').value = '';
    $('#btn-save').textContent = 'Add item';
    if (form) form.dataset.mode = 'add';
  }

  function handleSaveItem(ev) {
    ev.preventDefault();
    const form = $('#form-menu');
    const name = $('#form-name').value.trim();
    const price = parseFloat($('#form-price').value, 10);
    const imageUrl = $('#form-image').value.trim() || null;
    if (!name || !(price > 0)) return;

    const mode = form.dataset.mode || 'add';
    if (mode === 'edit') {
      const id = $('#form-item-id').value;
      const item = menu.find((m) => m.id === id);
      if (item) {
        item.name = name;
        item.price = price;
        item.imageUrl = imageUrl;
      }
    } else {
      menu.push({ id: id(), name, price, imageUrl });
    }
    saveMenu(menu);
    renderMenuGrid();
    renderManageList();
    resetForm();
  }

  function renderReport() {
    const monthInput = $('#report-month');
    const tbody = $('#report-tbody');
    const totalEl = $('#report-total');
    if (!monthInput || !tbody) return;

    let yearMonth = monthInput.value;
    if (!yearMonth) {
      const d = new Date();
      yearMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthInput.value = yearMonth;
    }

    const [y, m] = yearMonth.split('-').map(Number);
    const txList = getTransactions().filter((tx) => {
      const d = new Date(tx.date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });

    let totalSales = 0;
    tbody.innerHTML = '';
    if (txList.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="3" style="text-align:center; padding:1.5rem; color:var(--color-muted);">No transactions for this month.</td>';
      tbody.appendChild(tr);
    } else {
      txList.forEach((tx) => {
        totalSales += tx.total;
        const date = new Date(tx.date);
        const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const itemsStr = (tx.items || []).map((i) => i.name + ' × ' + i.qty).join(', ');
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>' + escapeHtml(dateStr) + '</td><td>' + escapeHtml(itemsStr) + '</td><td>₹' + Number(tx.total).toFixed(0) + '</td>';
        tbody.appendChild(tr);
      });
    }

    if (totalEl) totalEl.textContent = 'Total sales for selected month: ₹' + totalSales.toFixed(0);
  }

  function init() {
    menu = ensureMenu();
    cart = getCart();

    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    $('#btn-clear-cart')?.addEventListener('click', clearCart);
    $('#btn-print')?.addEventListener('click', printBill);
    $('#btn-pay-now')?.addEventListener('click', openQrModal);

    $('#modal-qr-backdrop')?.addEventListener('click', closeQrModal);
    $('#btn-close-qr')?.addEventListener('click', closeQrModal);
    $('#btn-confirm-payment')?.addEventListener('click', confirmPayment);

    $('#form-menu')?.addEventListener('submit', handleSaveItem);
    $('#btn-cancel-edit')?.addEventListener('click', resetForm);

    $('#report-month')?.addEventListener('change', renderReport);
    $('#btn-refresh-report')?.addEventListener('click', renderReport);

    renderMenuGrid();
    renderCart();
    renderManageList();
    renderReport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
