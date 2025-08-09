(() => {
  // ⬇️ REPLACE with your WhatsApp number in full international format, no +, no spaces
  // Example for CABA line 11-xxxx-xxxx -> "54911XXXXXXXX"
  const phone = '5491159498241';

  const msg = `Hola! Vengo desde Adelie Glam 👉 ${document.title} — ${location.href}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.className = 'wa-fab';
  a.setAttribute('aria-label', 'Chatear por WhatsApp');

  a.innerHTML = `
    <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
      <path d="M16 3.5C9.65 3.5 4.5 8.65 4.5 15c0 2.2.58 4.25 1.6 6.03L4 29l8.2-2.03A11.4 11.4 0 0 0 16 26.5c6.35 0 11.5-5.15 11.5-11.5S22.35 3.5 16 3.5Zm6.65 16.52c-.27.76-1.55 1.45-2.16 1.5-.58.06-1.34.08-2.17-.13a9.34 9.34 0 0 1-4.03-2.28c-1.5-1.36-2.53-3.05-2.83-3.56-.3-.52-.68-1.52-.68-2.9 0-1.38.88-2.07 1.2-2.36.3-.3.65-.38.87-.38h.64c.2 0 .49-.08.75.57.27.64.9 2.2.98 2.36.08.14.13.3.02.48-.12.23-.18.37-.35.58-.17.2-.37.46-.53.62-.17.17-.35.36-.15.7.2.36.92 1.52 1.98 2.46 1.37 1.22 2.52 1.59 2.89 1.76.38.17.6.14.83-.08.24-.22 1.04-1.2 1.32-1.61.28-.4.57-.34.95-.2.39.13 2.46 1.15 2.88 1.36.42.2.7.31.81.48.1.17.1.98-.16 1.75Z"/>
    </svg>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    if (!phone || !/^\d{10,15}$/.test(phone)) return console.warn('WhatsApp phone missing/invalid');
    document.body.appendChild(a);
  });
})();
