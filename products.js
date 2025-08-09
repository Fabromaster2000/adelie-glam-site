// ====== CONFIG ======
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGncMkuJIgCWEwgnBNOA3jCdCt4uz3ENDfW1dpC8Jmj_kbfompeOHyipVojo1tnV56WXCnER-Smopf/pub?output=csv";
const PLACEHOLDER_IMG = "img/products/placeholder.jpg"; // add this image to your repo if you want

// ====== SMALL HELPERS ======
const $ = (sel) => document.querySelector(sel);

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"' && inQuotes && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === ',' && !inQuotes) { row.push(cell); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !inQuotes) {
      if (cell.length || row.length) { row.push(cell); rows.push(row); row = []; cell = ''; }
      continue;
    }
    cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(v => (v ?? '').toString().trim().length))
    .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').toString().trim()])));
}

function normBool(v) {
  const s = (v ?? '').toLowerCase();
  if (['true', '1', 'sí', 'si'].includes(s)) return true;
  if (['false', '0', 'no'].includes(s)) return false;
  if (['hide', 'ocultar'].includes(s)) return 'hide';
  return undefined; // not specified
}

function toNumberAR(v) {
  // keep digits, commas, dots, minus; convert comma to dot
  const s = (v ?? '').toString().replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatARS(n) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

// ====== LOAD & NORMALIZE ======
async function loadProducts() {
  const res = await fetch(CSV_URL + "&cb=" + Date.now(), { cache: "no-store" });
  const text = await res.text();
  const rows = parseCSV(text);
  const objs = toObjects(rows);

  // Map Spanish headers -> normalized fields
  return objs.map(p => {
    const name  = p.Producto || p.name || '';
    const price = toNumberAR(p.Precio_Venta || p.price);
    const stock = parseInt(p.Cantidad || p.stock || '0', 10) || 0;
    const img   = p.img || p.ImageURL || PLACEHOLDER_IMG;
    const link  = p.link || '#';
    const cat   = (p.category || p.categoria || '').toLowerCase();
    const tags  = p.tags || '';
    const activeRaw = p.Active ?? '';
    return { name, price, stock, img, link, category: cat, tags, activeRaw };
  });
}

// ====== FILTER, RENDER, WIRE UI ======
function visibleFilter(item) {
  const a = normBool(item.activeRaw);
  if (a === 'hide') return false;     // manual hide wins
  if (a === true)  return item.stock > 0;
  if (a === false) return false;
  // if Active not set, auto: only show if stock > 0
  return item.stock > 0;
}

function render(list) {
  const grid = document.getElementById('grid') || document.getElementById('product-list');
  if (!grid) return console.warn('Missing container (#grid or #product-list).');

  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;opacity:.7">No hay productos disponibles.</p>`;
    return;
  }

  for (const p of list) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <div class="info">
        <span>${p.name}</span>
        <span class="badge">$${formatARS(p.price)}</span>
      </div>
      <div class="info">
        <span style="opacity:.6">${(p.category || '').toUpperCase()}</span>
        <a class="btn-mini" href="${p.link}" target="_blank" rel="noopener">Ver</a>
      </div>
    `;
    grid.appendChild(card);
  }
}

function applyFilters(all) {
  const q = ($('#q')?.value || '').toLowerCase().trim();
  const cat = ($('#cat')?.value || '').toLowerCase().trim();

  let out = all.filter(visibleFilter);

  if (cat) out = out.filter(p => (p.category || '').toLowerCase() === cat);

  if (q) {
    out = out.filter(p => {
      const haystack = `${p.name} ${p.category} ${p.tags}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  render(out);
}

function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const all = await loadProducts();

    // Pre-filter by URL ?cat=...
    const qpCat = (getQueryParam('cat') || '').toLowerCase();
    if (qpCat && $('#cat')) {
      $('#cat').value = qpCat;
    }

    // Initial render
    applyFilters(all);

    // Wire filters
    if ($('#q'))  $('#q').addEventListener('input', debounce(() => applyFilters(all), 200));
    if ($('#cat')) $('#cat').addEventListener('change', () => applyFilters(all));
  } catch (e) {
    console.error(e);
    const grid = document.getElementById('grid') || document.getElementById('product-list');
    if (grid) grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#b54a64">No pudimos cargar la tienda.</p>`;
  }
});
