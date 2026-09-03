/**
 * kitaplar.md  ->  src/data/books.json
 *
 * Tek doğruluk kaynağı `data/kitaplar.md`. Bu script markdown tablolarını okur,
 * kitap satırlarını ayıklar ve arayüzün tükettiği JSON'u üretir.
 * Kural: markdown değişince `npm run data` çalıştır, JSON'u elle düzenleme.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
const uyarilar = [];
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
    // Hücre sayısı başlıkla uyuşmuyorsa sütunlar kaymış demektir; sessizce
    // yanlış veri üretmektense uyar. (Bir kez gerçekten oldu: N6 satırında
    // yazar hücresi eksikti, yayınevi çevirmen sütununa kaymıştı.)
    if (row.length !== header.length) {
      uyarilar.push(`${h2} · ${row[0] || row[1]} — ${row.length} hücre, beklenen ${header.length}`);
    }
    /** Künye hücrelerinde de emoji olabilir; sök ve boşa düşeni boş say. */
    const kunye = (v) => {
      const t = stripEmoji(v).replace(/^\s*\(([^)]*)\)\s*$/, '').trim();   // yalnız parantezse bilgi yok
      return EMPTY.has(t) ? '' : t;
    };
    const originalCol = val(header, row, 'Orijinal Ad');
    const bookCol = val(header, row, 'Kitap (konu)', 'Kitap');
    let original = originalCol || bookCol;
    let turkish = val(header, row, 'Türkçe Ad') || (originalCol ? '' : bookCol);
    let author = kunye(val(header, row, 'Yazar')) || RU_AUTHORS[h3] || '';
    const translatorRaw = val(header, row, 'Çevirmen (önerilen)', 'Çevirmen / Hazırlayan', 'Çevirmen');
    const translator = kunye(translatorRaw);
    // Çevirmen hücresinde ❓ varsa künye doğrulanmamış demektir.
    const translatorUnverified = /❓/.test(translatorRaw);
    let publisher = kunye(val(header, row, 'Yayınevi'));
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
      status: [...new Set([...statusesOf(rawNote), ...(translatorUnverified ? ['unverified'] : [])])],
    };
    seen.set(key, book);
    books.push(book);
  }
}


/* ---------- 4b. Çevirmen güveni ve alternatif çevirmen ----------
 *
 * BU BİR DIŞ OTORİTE PUANI DEĞİL. Skor tamamen `data/kitaplar.md` içindeki
 * nottan ve durum işaretinden türetilir; notta yazmayan hiçbir şeyi bilmez.
 * Kural açık tutuldu ki sonuç denetlenebilsin:
 *
 *   Taban        ✅ doğrulanmış künye        -> 5
 *                ⚠️ uyarı var                -> 3
 *                ❓ künye doğrulanmamış      -> 2
 *                işaret yok                  -> 3
 *
 *   Düzeltme     "İngilizcesini oku" / makine çevirisi        -2
 *                ağır/ciddi eleştiri, argüman kaybı           -1
 *                ara dilden çeviri (aslından değil)           -1
 *                editörlük/dizgi zayıf, metne müdahale        -1
 *                özgün dilden çevrilmiş                       +1
 *
 * Sonuç 1-5 arasına sıkıştırılır. Gerekçe `why` alanında saklanır ve
 * arayüzde gösterilir — puan tek başına bırakılmaz.
 *
 * ÖNEMLİ: Not çoğu zaman birden çok baskıdan söz eder ("Alt.: ...",
 * "Kaçın: ..."). Puanlama yalnızca notun ÖNERİLEN baskıyı anlatan ilk
 * bölümüne bakar; yoksa başka bir baskıya yazılmış eleştiri, önerilen
 * çevirmenin puanını haksız yere düşürüyordu.
 */
const SINIR = /\s*(?:Yeni alternatif|Alternatif|Alt\.|Eski baskı|Piyasada|Diğer(?:leri)?|Kaçın)\s*:?/i;
const oneriliKisim = (note = '') => note.split(SINIR)[0];
const KURALLAR = [
  { re: /ingilizcesini oku|makine çevirisi/i,                        d: -2, why: 'İngilizce okunması öneriliyor' },
  { re: /ağır eleştiri|ciddi biçimde eleştiril|eleştiri alıyor|kayboluyor|kaybol/i, d: -1, why: 'Çeviri eleştiriliyor' },
  { re: /ara dilden|üzerinden|aslından değil|fransızcadan/i,         d: -1, why: 'Ara dilden çevrilmiş' },
  { re: /editörlük|dizgi|metne müdahale|dili eski/i,                 d: -1, why: 'Editörlük/dil sorunu' },
  { re: /aslından(?! değil)/i,                                       d: +1, why: 'Özgün dilden' },
];

function puanla(status, notTamami) {
  const note = oneriliKisim(notTamami);
  let p = status.includes('ok') ? 5
        : status.includes('unverified') ? 2
        : status.includes('warn') ? 3
        : 3;
  const temel = status.includes('ok') ? 'Künye doğrulandı'
              : status.includes('unverified') ? 'Künye doğrulanmadı'
              : status.includes('warn') ? 'Notta uyarı var'
              : 'Ek bilgi yok';
  const nedenler = [temel];
  for (const k of KURALLAR) {
    if (k.re.test(note)) { p += k.d; nedenler.push(k.why); }
  }
  return { score: Math.max(1, Math.min(5, p)), why: nedenler.join(' · ') };
}

/** "Betül Parlak çevirisi" -> { name, publisher } */
function ayikla(parca) {
  let t = parca.trim();
  // "Kitap adı, çev. İsim, Yayınevi" biçiminde asıl ad "çev."den sonra gelir.
  const cev = t.match(/çev(?:\.|iren)\s*:?\s*([^]*)$/i);
  if (cev) t = cev[1];
  t = t.trim();
  t = t.split(/\s+—\s+|\.\s|;/)[0].trim();                    // ilk cümle/parça
  /** Yıl, sayfa sayısı, cilt bilgisi yayınevi değildir. */
  const yayineviMi = x => x && !/^\d/.test(x) && !/^\d|\bs\.|\bc\.|cilt/i.test(x);

  const adaylar = [];
  const paren = t.match(/\(([^)]+)\)/);
  if (paren) { adaylar.push(paren[1].split(',')[0].trim()); t = t.replace(/\([^)]*\)/g, ' '); }
  const virgul = t.split(',');
  adaylar.push((virgul[1] ?? '').replace(/\(.*$/, '').trim());
  const publisher = adaylar.find(yayineviMi) ?? '';

  let name = virgul[0]
    .replace(/\s*çevirisi.*$/i, '').replace(/\s*da güçlü.*$/i, '')
    .replace(/[.\s]+$/, '').trim();
  // Baştaki küçük harfli kelimeleri at ("karşılaştırmalarında Ergin Altay").
  const kelime = name.split(/\s+/);
  while (kelime.length && !/^[A-ZÇĞİÖŞÜ]/.test(kelime[0])) kelime.shift();
  name = kelime.join(' ');
  if (!name || kelime.length > 4 || name.length < 4) return null;
  return { name, publisher: publisher.replace(/[.\s]+$/, '') };
}

const ALT_DESENLERI = [
  /(?:Yeni alternatif|Alternatif|Alt\.)\s*:\s*([^]*?)(?=$)/i,
  /Eski baskı:\s*([^]*?)(?=$)/i,
  /Piyasada\s+([^]*?)\s+çevirisi de var/i,
  /([A-ZÇĞİÖŞÜ][\wçğıöşü.]*(?:\s+[A-ZÇĞİÖŞÜ][\wçğıöşü.]*){1,2}\s*\([^)]*\))\s*çevirisinin/i,
  /baskısı\s*\(([A-ZÇĞİÖŞÜ][^)]{4,})\)\s*da güçlü/i,
];

/** Not metninden ve çevirmen alanından ikinci bir güvenilir çevirmen çıkarır. */
function alternatif(book) {
  // 1) Çevirmen alanı iki isim taşıyorsa ("X veya Y")
  if (/\s+veya\s+/i.test(book.translator)) {
    const [, ikinci] = book.translator.split(/\s+veya\s+/i);
    const a = ayikla(ikinci);
    if (a) return { ...a, publisher: a.publisher || book.publisher.split('/').pop().trim() };
  }
  // 2) Not metnindeki alternatif kalıpları
  for (const re of ALT_DESENLERI) {
    const m = book.note.match(re);
    if (!m) continue;
    const a = ayikla(m[1]);
    if (a && a.name !== book.translator) return a;
  }
  return null;
}

for (const b of books) {
  // Ana çevirmen alanı "X veya Y" ise ilkini ana kabul et
  if (/\s+veya\s+/i.test(b.translator)) b.translator = b.translator.split(/\s+veya\s+/i)[0].replace(/\s*\([^)]*\)\s*$/, '').trim();
  // Güven puanı yalnızca adı bilinen bir çevirmen için anlamlı.
  b.trust = b.translator ? puanla(b.status, b.note) : null;
  // Alternatif, ana çevirmen bilinmese de not içinde geçebiliyor (bkz. N6).
  const a = alternatif(b);
  // Alternatif her zaman ana öneriden bir kademe altta sayılır: dosya onu
  // ikinci sıraya koymuş, bunu puanla da göstermek gerekiyor.
  b.alt = a ? { ...a, score: Math.max(1, (b.trust?.score ?? 3) - 1) } : null;
}

/* ---------- 5. Kapaklar ----------
   `data/covers.json` Open Library'den toplanan kapak kimliklerini tutar
   (bkz. scripts/fetch-covers.mjs). Depoya commit'lenir, CI'da ağ gerekmez. */
const coversPath = resolve(root, 'data/covers.json');
const covers = existsSync(coversPath) ? JSON.parse(readFileSync(coversPath, 'utf8')) : {};
for (const b of books) b.coverId = covers[b.key]?.coverId ?? null;

/* ---------- 6. Yaz ---------- */
const order = Object.keys(SECTIONS);
books.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));

const payload = {
  generatedFrom: 'data/kitaplar.md',
  count: books.length,
  withCover: books.filter(b => b.coverId).length,
  withAlt: books.filter(b => b.alt).length,
  sections: order
    .filter(k => books.some(b => b.section === k))
    .map(k => ({ key: k, ...SECTIONS[k], count: books.filter(b => b.section === k).length })),
  books,
};

writeFileSync(resolve(root, 'src/data/books.json'), JSON.stringify(payload, null, 1) + '\n', 'utf8');
if (uyarilar.length) {
  console.warn(`\nUYARI — ${uyarilar.length} satırda hücre sayısı başlıkla uyuşmuyor:`);
  for (const u of uyarilar) console.warn('  ' + u);
  console.warn('');
}
console.log(`src/data/books.json yazıldı — ${books.length} kitap, ${payload.sections.length} bölüm`);
