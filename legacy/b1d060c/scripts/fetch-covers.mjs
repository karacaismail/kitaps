/**
 * Open Library'den kapak kimliği toplar.
 *
 * Gerçek kapak görselleri telifli; depoya dosya koymuyoruz. Bunun yerine
 * Open Library'nin açık kapak servisindeki görselin kimliğini buluyoruz ve
 * arayüz görseli oradan yüklüyor. Bulunamayan kitap üretilen monogram
 * kapağıyla kalıyor.
 *
 * Sonuç `data/covers.json` içinde önbelleğe alınır ve depoya commit'lenir;
 * böylece CI'da ağ erişimi gerekmez ve her yayında yeniden sorgulanmaz.
 *
 *   node scripts/fetch-covers.mjs           eksikleri sorgular
 *   node scripts/fetch-covers.mjs --force   hepsini yeniden sorgular
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(root, 'data/covers.json');
const force = process.argv.includes('--force');

const { books } = JSON.parse(readFileSync(resolve(root, 'src/data/books.json'), 'utf8'));
const cache = existsSync(CACHE) && !force ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};

/** Latin harfe indirger; başlık eşleşmesini kabaca doğrulamak için. */
const fold = (s = '') => s.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[ıİ]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** Parantez içi çeviri yazımları ("孫子兵法 (Sunzi Bingfa)") aramada işe yaramıyor. */
const searchable = (s = '') => {
  const paren = s.match(/\(([^)]{4,})\)/);
  const base = paren ? paren[1] : s;
  return /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(base) ? base : '';
};

/** Aday başlık ile aranan başlık yeterince örtüşüyor mu? */
function benzer(a, b) {
  const A = new Set(fold(a).split(' ').filter(w => w.length > 2));
  const B = new Set(fold(b).split(' ').filter(w => w.length > 2));
  if (!A.size || !B.size) return false;
  let ortak = 0;
  for (const w of A) if (B.has(w)) ortak++;
  return ortak / Math.min(A.size, B.size) >= 0.6;
}

const UA = 'kitaps/1.0 (github.com/karacaismail/kitaps)';

async function ara(title, author) {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('title', title);
  if (author) url.searchParams.set('author', author);
  url.searchParams.set('fields', 'title,author_name,cover_i,first_publish_year');
  url.searchParams.set('limit', '5');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const { docs = [] } = await res.json();
  const hit = docs.find(d => d.cover_i && benzer(d.title, title));
  return hit ? { coverId: hit.cover_i, matchedTitle: hit.title } : null;
}

const yapilacak = books.filter(b => !(b.key in cache));
console.log(`${books.length} kitap · önbellekte ${books.length - yapilacak.length} · sorgulanacak ${yapilacak.length}`);

let bulunan = 0, sira = 0;
const KUYRUK = 4;                      // Open Library'ye kibar davran

async function isci() {
  while (sira < yapilacak.length) {
    const b = yapilacak[sira++];
    const adaylar = [
      [searchable(b.original), b.author],
      [b.turkish, b.author],
      [searchable(b.original) || b.turkish, ''],
    ].filter(([t]) => t && t.length > 2);

    let sonuc = null;
    for (const [t, a] of adaylar) {
      try { sonuc = await ara(t, a); } catch { /* ağ hatası: kapaksız devam */ }
      if (sonuc) break;
      await new Promise(r => setTimeout(r, 120));
    }
    cache[b.key] = sonuc ?? { coverId: null };
    if (sonuc) bulunan++;
    if (sira % 20 === 0) console.log(`  ${sira}/${yapilacak.length} · bulunan ${bulunan}`);
  }
}

await Promise.all(Array.from({ length: KUYRUK }, isci));

writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n', 'utf8');
const toplam = Object.values(cache).filter(v => v.coverId).length;
console.log(`data/covers.json yazıldı — ${toplam}/${books.length} kitapta kapak var`);
