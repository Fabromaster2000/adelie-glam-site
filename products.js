// ====== CONFIG ======
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGncMkuJIgCWEwgnBNOA3jCdCt4uz3ENDfW1dpC8Jmj_kbfompeOHyipVojo1tnV56WXCnER-Smopf/pub?output=csv";
const PLACEHOLDER_IMG = "img/products/placeholder.jpg";

// ====== HELPERS ======
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
  return undefined;
}

function toNumberAR(v) {
  const s = (v ?? '').toString().replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function formatARS(n) {
  return n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

// Consistent slug maker (accents → plain, spaces → - , lowercase)
function slugify(str = '') {
  return str
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/ñ/gi, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
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

  return objs.map(p => {
    const name  = p.Producto || p.name || '';
    const price = toNumberAR(p.Precio_Venta || p.price);
    const stock = parseInt(p.Cantidad || p.stock || '0', 10) || 0;
    const img   = p.img || p.ImageURL || PLACEHOLDER_IMG;
    const link  = p.link || '#';
    const cat   = (p.category || p.categoria || '').toLowerCase();
    const tags  = p.tags || '';
    const desc  = p.Descripcion || p.description || '';
    const activeRaw = p.Active ?? '';
    const slug = slugify(name);  // <-- auto slug
    return { name, price, stock, img, link, category: cat, tags, desc, activeRaw, slug };
  });
}

// ====== FILTER, RENDER, WIRE UI ======
function visibleFilter(item) {
  const a = normBool(item.activeRaw);
  if (a === 'hide') return false;
  if (a === true)  return item.stock > 0;
  if (a === false) return false;
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
      <img src="${p.img}" alt="${p.name}" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
      <div class="info">
        <span>${p.name}</span>
        <span class="badge">$${formatARS(p.price)}</span>
      </div>
      <div class="info">
        <span style="opacity:.6">${(p.category || '').toUpperCase()}</span>
        <a class="btn-mini" href="product.html?slug=${encodeURIComponent(p.slug)}">Ver</a>
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

    const qpCat = (getQueryParam('cat') || '').toLowerCase();
    if (qpCat && $('#cat')) $('#cat').value = qpCat;

    applyFilters(all);
    if ($('#q'))  $('#q').addEventListener('input', debounce(() => applyFilters(all), 200));
    if ($('#cat')) $('#cat').addEventListener('change', () => applyFilters(all));
  } catch (e) {
    console.error(e);
    const grid = document.getElementById('grid') || document.getElementById('product-list');
    if (grid) grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#b54a64">No pudimos cargar la tienda.</p>`;
  }
});
