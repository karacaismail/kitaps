/**
 * kitaplar.md  ->  src/data/books.json
 *
 * Tek doğruluk kaynağı `data/kitaplar.md`. Bu script markdown tablolarını okur,
 * kitap satırlarını ayıklar ve arayüzün tükettiği JSON'u üretir.
 * Kural: markdown değişince `npm run data` çalıştır, JSON'u elle düzenleme.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lines = readFileSync(resolve(root, 'data/kitaplar.md'), 'utf8').split('\n');

/* ---------- 1. Markdown tablolarını topla ---------- */
const tables = [];
let h2 = null, h3 = null;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.startsWith('## ')) { h2 = l.slice(3).trim(); h3 = null; continue; }
  if (l.startsWith('### ')) { h3 = l.slice(4).trim(); continue; }
  if (l.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? '')) {
    const header = split(l);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].startsWith('|')) rows.push(split(lines[j++]));
    tables.push({ h2, h3, header, rows });
    i = j - 1;
  }
}
function split(l) { return l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()); }

/* ---------- 2. Metin temizliği ---------- */
const EMOJI = /[☀-➿️\u{1F300}-\u{1FAFF}]/gu;
const clean = (s = '') => s
  .replace(/\*\*(.+?)\*\*/g, '$1')
  .replace(/\*(.+?)\*/g, '$1')
  .replace(/\[(.+?)\]\(.*?\)/g, '$1')
  .trim();
/** Not metninden emojileri söker; durum bilgisi ayrı alanda taşınır (UI'da Phosphor ikonu olur). */
const stripEmoji = (s = '') => s.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim();

const STATUS = { '✅': 'ok', '⚠': 'warn', '❓': 'unverified', '🚫': 'avoid' };
const statusesOf = (s = '') => Object.entries(STATUS).filter(([g]) => s.includes(g)).map(([, v]) => v);

const EMPTY = new Set(['', '—', '❓', '-']);
const val = (header, row, ...names) => {
  for (const n of names) {
    const k = header.indexOf(n);
    if (k !== -1) return clean(row[k] ?? '');
  }
  return '';
};
const norm = (s = '') => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
/**
 * Kalıcı anahtar. Kullanıcının işaretlediği durumlar (satın alındı, önemli...)
 * tarayıcıda bu anahtarla saklanır; bu yüzden satır sırasına DEĞİL, kitabın
 * kendisine bağlı olmalı. Markdown'da satırlar yer değiştirse de bozulmaz.
 */
const slug = (...parts) => parts.filter(Boolean).join('-')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

/* ---------- 3. Bölüm meta verisi ---------- */
const SECTIONS = {
  A: { label: 'Strateji klasikleri',   icon: 'strategy' },
  B: { label: 'Strateji: eklenecek',   icon: 'plus-circle' },
  C: { label: 'Davranış bilimi',       icon: 'brain' },
  D: { label: 'Scrum / yalın üretim',  icon: 'gear' },
  E: { label: 'Çocuk: alınacaklar',    icon: 'baby' },
  F: { label: 'Tarih ve edebiyat',     icon: 'scroll' },
  G: { label: 'Rus klasikleri',        icon: 'snowflake' },
  H: { label: 'Dünyaya Yön Verenler',  icon: 'users-three' },
  K: { label: 'Musashi külliyatı',     icon: 'sword' },
  M: { label: 'Kriz stratejisi',       icon: 'lightning' },
  N: { label: 'İrade ve iletişim',     icon: 'chats-circle' },
  P: { label: 'Çocuk: 10 yaş programı',icon: 'student' },
  R: { label: 'Geleceğe hazırlık',     icon: 'rocket-launch' },
};

/* ---------- 4. Kitap satırlarını ayıkla ---------- */
const TITLE_KEYS = ['Orijinal Ad', 'Kitap (konu)', 'Kitap'];
const RU_AUTHORS = {
  'Dostoyevski': 'Fyodor Mihayloviç Dostoyevski',
  'Tolstoy': 'Lev Nikolayeviç Tolstoy',
};

const books = [];
const seen = new Map();
const keyUse = new Map();          // slug çakışmalarını sabit biçimde ayır
function uniqueKey(base) {
  const n = (keyUse.get(base) ?? 0) + 1;
  keyUse.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

for (const { h2, h3, header, rows } of tables) {
  const hasTitle = TITLE_KEYS.some(k => header.includes(k));
  if (!hasTitle || !(header.includes('Yazar') || header.includes('Türkçe Ad'))) continue;

  for (const row of rows) {
    const originalCol = val(header, row, 'Orijinal Ad');
    const bookCol = val(header, row, 'Kitap (konu)', 'Kitap');
    let original = originalCol || bookCol;
    let turkish = val(header, row, 'Türkçe Ad') || (originalCol ? '' : bookCol);
    let author = val(header, row, 'Yazar') || RU_AUTHORS[h3] || '';
    const translator = val(header, row, 'Çevirmen (önerilen)', 'Çevirmen / Hazırlayan', 'Çevirmen');
    let publisher = val(header, row, 'Yayınevi');
    const rawNote = val(header, row, 'Not', 'Neden', 'Yaş');
    const id = val(header, row, '#', 'Sıra');

    if (EMPTY.has(original)) original = '';
    if (EMPTY.has(turkish) || /Türkçe baskı (yok|doğrulanamadı)/.test(turkish)) turkish = '';
    if (norm(original) === norm(turkish)) turkish = '';
    if (EMPTY.has(author)) author = '';
    if (EMPTY.has(publisher)) publisher = '';

    const display = original || turkish;
    if (!display) continue;

    // Dünyaya Yön Verenler dizisinin ana listesinde yayınevi satırda yazmıyor.
    if (h2?.startsWith('H.') && !h3 && !publisher) publisher = 'Türkiye İş Bankası Kültür Yayınları';

    const key = `${norm(display)}|${norm(author)}`;
    if (seen.has(key)) {                      // aynı kitap birden çok bölümde geçiyorsa birleştir
      const prev = seen.get(key);
      if (!prev.note && rawNote) { prev.note = stripEmoji(rawNote); prev.status = statusesOf(rawNote); }
      if (!prev.translator && !EMPTY.has(translator)) prev.translator = translator;
      if (!prev.publisher && publisher) prev.publisher = publisher;
      if (!prev.alsoIn.includes(h2[0])) prev.alsoIn.push(h2[0]);
      continue;
    }

    const book = {
      id: id || `${h2[0]}-${books.length}`,
      key: uniqueKey(slug(display, author) || slug(display) || 'kitap'),
      section: h2[0],
      sectionLabel: SECTIONS[h2[0]]?.label ?? h2,
      sub: h3 ?? '',
      alsoIn: [h2[0]],
      original,
      turkish,
      author,
      translator: EMPTY.has(translator) ? '' : translator,
      publisher,
      note: stripEmoji(rawNote),
      status: statusesOf(rawNote),
    };
    seen.set(key, book);
    books.push(book);
  }
}

/* ---------- 5. Yaz ---------- */
const order = Object.keys(SECTIONS);
books.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));

const payload = {
  generatedFrom: 'data/kitaplar.md',
  count: books.length,
  sections: order
    .filter(k => books.some(b => b.section === k))
    .map(k => ({ key: k, ...SECTIONS[k], count: books.filter(b => b.section === k).length })),
  books,
};

writeFileSync(resolve(root, 'src/data/books.json'), JSON.stringify(payload, null, 1) + '\n', 'utf8');
console.log(`src/data/books.json yazıldı — ${books.length} kitap, ${payload.sections.length} bölüm`);
