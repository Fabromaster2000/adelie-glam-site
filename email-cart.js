// email-cart.js
// ----------------------------------------------------
// Setup: put your EmailJS + branding details here
// ----------------------------------------------------
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';        // e.g., service_abc123
const EMAILJS_TEMPLATE_ID = 'template_cart';         // the template you created
const EMAIL_TO = 'adeliee.glam@gmail.com';           // where you receive orders
const LOGO_URL = 'https://fabromaster2000.github.io/adelie-glam-site/img/adelie-main-logo.jpg'; // absolute URL to your logo

// ----------------------------------------------------
// Helpers to read cart + format numbers
// ----------------------------------------------------
function cartRead(){ try { return JSON.parse(localStorage.getItem('adelie_cart_v1') || '[]'); } catch { return []; } }
const fmt = n => Number(n||0).toLocaleString('es-AR', { maximumFractionDigits: 0 });

// Build a pretty HTML table (email-safe inline styles)
function buildItemsTableHTML(items){
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

  const total = items.reduce((s,x)=>s + (Number(x.price)||0)*(Number(x.qty)||0), 0);

  return `
    <div style="padding:0 20px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;max-width:620px;margin:0 auto;border:1px solid #f6e6ec;border-radius:10px;overflow:hidden;">
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
            <td align="right" style="padding:12px;font-weight:800;color:#B54A64;">$${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="max-width:620px;margin:14px auto 0;color:#666;font-size:14px;line-height:1.45;">
        <p><strong>Datos del cliente</strong> (completar):</p>
        <p>Nombre: ____________<br>Teléfono: ____________<br>Dirección (si aplica): ____________</p>
        <p style="margin-top:10px;">Página: <a href="${location.href}" style="color:#B54A64;">${location.href}</a></p>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// Send the email via EmailJS
// ----------------------------------------------------
async function sendCartEmail(){
  const items = cartRead();
  if (!items.length) { alert('Tu carrito está vacío.'); return; }

  const htmlBlock = buildItemsTableHTML(items);
  const payload = {
    to_email: EMAIL_TO,
    subject: `Pedido Adelie Glam (${new Date().toLocaleDateString('es-AR')})`,
    html: htmlBlock,
    logo_url: LOGO_URL
  };

  try{
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
    alert('¡Listo! Te enviamos el resumen del pedido por email.');
  }catch(err){
    console.error('[EmailJS] send failed', err);
    // optional fallback to plain mailto if cart.js defines it
    if (typeof buildEmailHref === 'function') {
      window.location.href = buildEmailHref();
    } else {
      alert('No pudimos enviar el email. Probá de nuevo más tarde.');
    }
  }
}

// ----------------------------------------------------
// Hook the buttons/links on page load
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  // Cart drawer button
  document.getElementById('cart-email')?.addEventListener('click', (e)=>{
    e.preventDefault();
    sendCartEmail();
  });
  // Header email icon
  document.getElementById('email-link')?.addEventListener('click', (e)=>{
    e.preventDefault();
    sendCartEmail();
  });
});
