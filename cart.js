// cart.js
const CART_KEY = 'adelie_cart_v1';
const PHONE = '5491159498241';             // WhatsApp number (no +, no spaces)
const EMAIL_TO = 'adeliee.glam@gmail.com';  // <-- change if needed

const peso = n => Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

function readCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function writeCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateBadge(); }

function addItem({slug,name,price,img}, qty=1){
  const items = readCart();
  const i = items.findIndex(x => x.slug === slug);
  if (i >= 0) items[i].qty += qty;
  else items.push({ slug, name, price:+price || 0, img, qty });
  writeCart(items); renderCart();
}
function setQty(slug, qty){
  const items = readCart().map(x => x.slug === slug ? { ...x, qty: Math.max(1, qty) } : x);
  writeCart(items); renderCart();
}
function removeItem(slug){
  const items = readCart().filter(x => x.slug !== slug);
  writeCart(items); renderCart();
}
function clearCart(){ writeCart([]); renderCart(); }

function total(items){ return items.reduce((s,x) => s + x.price * x.qty, 0); }

function updateBadge(){
  const count = readCart().reduce((s,x) => s + x.qty, 0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function messageForWhatsApp(items){
  const lines = ['Hola! Quiero confirmar este pedido:'];
  items.forEach(x => lines.push(`• ${x.name} x${x.qty} — $${peso(x.price)} c/u`));
  lines.push(`Total: $${peso(total(items))}`);
  lines.push(window.location.href);
  return lines.join('\n');
}
function buildWaUrl(){
  const items = readCart();
  const msg = messageForWhatsApp(items);
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}

// ----- Email helpers -----
function messageForEmail(items){
  const lines = [];
  lines.push('Hola Adelie Glam, quiero confirmar este pedido:');
  items.forEach(x => lines.push(`• ${x.name} x${x.qty} — $${peso(x.price)} c/u`));
  lines.push('');
  lines.push(`Total: $${peso(total(items))}`);
  lines.push('');
  lines.push('Mis datos:');
  lines.push('Nombre: ');
  lines.push('Teléfono: ');
  lines.push('Dirección (si aplica): ');
  lines.push('');
  lines.push('Enlace del carrito/página:');
  lines.push(window.location.href);
  return lines.join('\n');
}
function buildEmailHref(){
  const items = readCart();
  const subject = `Pedido Adelie Glam (${new Date().toLocaleDateString('es-AR')})`;
  const body = messageForEmail(items);
  return `mailto:${encodeURIComponent(EMAIL_TO)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function renderCart(){
  const items = readCart();
  const box = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkout = document.getElementById('cart-checkout');

  if (!box) return;

  box.innerHTML = '';
  if (!items.length){
    box.innerHTML = `<p style="opacity:.7;text-align:center;margin:1rem 0">Tu carrito está vacío</p>`;
  } else {
    items.forEach(x => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${x.img}" alt="${x.name}">
        <div>
          <div class="name">${x.name}</div>
          <div class="price">$${peso(x.price)}</div>
        </div>
        <div class="qty">
          <button data-action="dec" data-slug="${x.slug}">−</button>
          <span>${x.qty}</span>
          <button data-action="inc" data-slug="${x.slug}">+</button>
          <button data-action="rm"  data-slug="${x.slug}" title="Quitar">✕</button>
        </div>
      `;
      box.appendChild(row);
    });
  }

  if (totalEl) totalEl.textContent = `$${peso(total(items))}`;
  if (checkout) checkout.href = buildWaUrl();

  // Set email checkout link each time we render
  const emailBtn = document.getElementById('cart-email');
  if (emailBtn) emailBtn.href = buildEmailHref();

  updateBadge();
}

// Drawer controls
function openCart(){ document.getElementById('cart-drawer')?.classList.add('open'); renderCart(); }
function closeCart(){ document.getElementById('cart-drawer')?.classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  renderCart();

  document.getElementById('cart-btn')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-clear')?.addEventListener('click', () => { clearCart(); });

  // Qty / remove (event delegation)
  document.getElementById('cart-items')?.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const slug = b.getAttribute('data-slug');
    const act  = b.getAttribute('data-action');
    const items = readCart();
    const it = items.find(x => x.slug === slug);
    if (!it) return;

    if (act === 'inc') setQty(slug, it.qty + 1);
    if (act === 'dec') setQty(slug, Math.max(1, it.qty - 1));
    if (act === 'rm')  removeItem(slug);
  });

  // Header email icon triggers email with current cart
  document.getElementById('email-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = buildEmailHref();
  });
});

// Expose for other scripts
window.AdelieCart = { addItem, openCart, readCart };
