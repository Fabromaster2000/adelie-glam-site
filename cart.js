// cart.js
const CART_KEY = 'adelie_cart_v1';
const PHONE = '5491159498241';
const EMAIL_TO = 'adeliee.glam@gmail.com';

// EmailJS config
const EMAILJS_SERVICE_ID = 'service_v0rn6d7';         // EXACT service id from EmailJS
const EMAILJS_TEMPLATE_ID = 'template_54haqal';       // your template id
const LOGO_URL = 'https://fabromaster2000.github.io/adelie-glam-site/img/adelie-main-logo.jpg';

const peso = n => Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

function readCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function writeCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); updateBadge(); }

function addItem({slug,name,price,img}, qty=1){
  const items = readCart();
  const i = items.findIndex(x => x.slug === slug);
  if (i >= 0) items[i].qty += qty; else items.push({ slug, name, price:+price || 0, img, qty });
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

// Build HTML block for EmailJS template {{{cart_html}}}
function buildCartHtml(items){
  const fmt = n => Number(n||0).toLocaleString('es-AR', { maximumFractionDigits: 0 });
  const rows = items.map(x => {
    const sub = (Number(x.price)||0) * (Number(x.qty)||0);
    return `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f2d9e2;">${x.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f2d9e2;text-align:center;">${x.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f2d9e2;text-align:right;">$${fmt(x.price)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f2d9e2;text-align:right;">$${fmt(sub)}</td>
      </tr>
    `;
  }).join('');

  const tot = items.reduce((s,x)=>s + (Number(x.price)||0)*(Number(x.qty)||0), 0);

  return `
    <div style="padding:0 20px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="border-collapse:collapse;max-width:620px;margin:0 auto;border:1px solid #f6e6ec;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#FBEAF1;color:#7A4455;">
            <th align="left"  style="padding:10px 12px;font-weight:700;">Producto</th>
            <th align="center"style="padding:10px 12px;font-weight:700;">Cant.</th>
            <th align="right" style="padding:10px 12px;font-weight:700;">Precio</th>
            <th align="right" style="padding:10px 12px;font-weight:700;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" align="right" style="padding:12px;font-weight:700;color:#B54A64;">Total</td>
            <td align="right" style="padding:12px;font-weight:800;color:#B54A64;">$${fmt(tot)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="max-width:620px;margin:14px auto 0;color:#666;font-size:14px;">
        <p><strong>Datos del cliente</strong> (completar):</p>
        <p>Nombre: ____________<br>Teléfono: ____________<br>Dirección (si aplica): ____________</p>
        <p style="margin-top:10px;">Página: <a href="${location.href}" style="color:#B54A64;">${location.href}</a></p>
      </div>
    </div>
  `;
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

  // (Optional) update the email button href; we intercept clicks anyway
  const emailBtn = document.getElementById('cart-email');
  if (emailBtn) emailBtn.href = '#';

  updateBadge();
}

// Drawer controls
function openCart(){ document.getElementById('cart-drawer')?.classList.add('open'); renderCart(); }
function closeCart(){ document.getElementById('cart-drawer')?.classList.remove('open'); }

// Send the HTML email via EmailJS (to store + optionally to customer)
function sendCartEmail(){
  const items = readCart();
  if(!items.length){
    alert('Tu carrito está vacío.');
    return;
  }

  // Read + validate customer fields
  const nameEl  = document.getElementById('cust-name');
  const phoneEl = document.getElementById('cust-phone');
  const emailEl = document.getElementById('cust-email');

  const name  = (nameEl?.value  || '').trim();
  const phone = (phoneEl?.value || '').trim();
  const email = (emailEl?.value || '').trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if(!name){ alert('Por favor ingresá tu nombre.'); nameEl?.focus(); return; }
  if(!phone){ alert('Por favor ingresá tu teléfono.'); phoneEl?.focus(); return; }
  if(!isEmail){ alert('Por favor ingresá un email válido.'); emailEl?.focus(); return; }

  const common = {
    subject: `Pedido Adelie Glam (${new Date().toLocaleDateString('es-AR')})`,
    order_date: new Date().toLocaleDateString('es-AR'),
    page_url: window.location.href,
    logo_url: LOGO_URL,
    cart_html: buildCartHtml(items),   // <-- must match {{{cart_html}}} in template
    customer_name:  name,
    customer_phone: phone,
    customer_email: email,
    // DEBUG: send everything as JSON so we can see it arrive in the email
    debug_json: JSON.stringify({
      subject: `Pedido Adelie Glam (${new Date().toLocaleDateString('es-AR')})`,
      order_date: new Date().toLocaleDateString('es-AR'),
      page_url: window.location.href,
      logo_url: LOGO_URL,
      customer_name:  name,
      customer_phone: phone,
      customer_email: email,
      items
    }, null, 2)
  };

  const payloadStore    = { ...common, to_email: EMAIL_TO };
  const payloadCustomer = { ...common, to_email: email };

  // Log to the browser console so we confirm what's being sent
  console.log('[EmailJS] payload to store:', payloadStore);
  console.log('[EmailJS] payload to customer:', payloadCustomer);

  const sendToStore = emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payloadStore);
  const sendToCustomer = emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payloadCustomer);

  Promise.all([sendToStore, sendToCustomer])
    .then(() => {
      alert(`¡Listo! Enviamos el resumen:\n• A la tienda: ${EMAIL_TO}\n• Al cliente: ${email}\nRevisá tu bandeja (y Spam/Promociones).`);
    })
    .catch(err => {
      console.error('[EmailJS] error', err);
      alert('No pudimos enviar el email ahora. Probá de nuevo más tarde.');
    });
}


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

  // Email triggers
  document.getElementById('cart-email')?.addEventListener('click', (e)=>{
    e.preventDefault();
    sendCartEmail();
  });
});

// Expose for other scripts
window.AdelieCart = { addItem, openCart, readCart };
