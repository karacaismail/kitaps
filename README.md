# Kitaps

Alınacak kitapların künye listesi. Tek amacı şu soruyu cevaplamak:
**bu kitabı hangi çevirmenden, hangi yayınevinden almalıyım?**

Türkiye'de bir klasiğin on ayrı baskısı olur; bazıları özgün dilden, bazıları ara
dilden, bazıları eksik. Bu arayüz o farkı görünür kılar.

- **Canlı:** https://karacaismail.github.io/kitaps
- **Veri kaynağı:** [`data/kitaplar.md`](data/kitaplar.md) — 170 kitap
- **Hedef:** mobil. Taban **320 piksel**, oradan yukarı **akışkan**.

---

## Ne yapar

| | |
|---|---|
| **Liste** | Her kitap bir kart: kapak + orijinal ad. Tablo değil, e-ticaret listeleme sayfası mantığı. |
| **Görünüm anahtarı** | İki düğme: iki sütun yan yana / tek satır yatay. Seçim tarayıcıda hatırlanır. |
| **Künye sayfası** | Karta dokununca alttan açılır: yazar, önerilen çevirmen, orijinal ad, Türkiye'de yayın adı, yayınevi, not. |
| **Durumlar** | Her kitap **önemli / satın alındı / okunuyor / okundu** olarak işaretlenebilir. Aynı anda birden çoğu seçilebilir. |
| **Süzgeç** | Duruma veya bölüme göre. |
| **Durum işaretleri** | Künyenin doğrulanıp doğrulanmadığı, uyarı olup olmadığı, kaçınılacak baskı olup olmadığı. Emoji değil, Phosphor ikonu. |
| **Akışkan düzen** | 320 pikselde iki sütun sığar; genişlik arttıkça kartlar, yazı ve kapaklar birlikte büyür. 560 pikselde durur ve ortalanır. |

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:4321/kitaps
```

```bash
npm run data       # data/kitaplar.md -> src/data/books.json
npm run covers     # Open Library'den eksik kapakları arar -> data/covers.json
npm run build      # dist/ üretir
npm run preview    # dist/ önizlemesi
```

## Veriyi güncelleme

Tek doğruluk kaynağı `data/kitaplar.md`. Akış:

```
data/kitaplar.md  →  scripts/build-data.mjs  →  src/data/books.json  →  arayüz
```

1. `data/kitaplar.md` içindeki tabloyu düzenle.
2. `npm run data` çalıştır.
3. Commit'le. GitHub Actions yayında bu adımı yeniden çalıştırır.

`src/data/books.json` **elle düzenlenmez** — her üretimde üzerine yazılır.
Ayrıntı: [`docs/VERI.md`](docs/VERI.md).

## Dosya düzeni

```
data/kitaplar.md            tek doğruluk kaynağı (markdown tablolar)
scripts/build-data.mjs      markdown -> JSON dönüştürücü
scripts/fetch-covers.mjs    Open Library kapak kimliği toplayıcı
data/covers.json            kapak kimliği önbelleği (commit'lenir)
src/data/books.json         üretilen veri (elle düzenleme)
src/pages/index.astro       tek sayfa: liste + süzgeç + künye sayfası + durumlar
src/components/
  BookCard.astro            kart (iki görünümü de aynı bileşen karşılar)
  BookCover.astro           kapak (üretilen veya public/covers/ altındaki gerçek görsel)
  Icon.astro                Phosphor ikonu, build sırasında satır içine gömülür
src/styles/global.css       tüm stiller; 320 piksel taban, akışkan
docs/UX.md                  arayüz kararları ve gerekçeleri
docs/VERI.md                veri modeli
```

## Kapak görselleri

Her kapak iki katmandan oluşur:

1. **Altta üretilen kapak.** Kitabın adından türetilen sabit renk, baş harf
   monogramı ve yazar adı. Ağ gerektirmez, hiçbir kart boş kalmaz.
2. **Üstte gerçek kapak.** [Open Library](https://openlibrary.org)'nin açık
   kapak servisinden. **170 kitabın 132'sinde** kapak bulundu; kalan 38'i
   üretilen kapakla kalıyor. Görsel yüklenemezse (404, ağ kesik, engellenmiş)
   kendini siler ve alttaki kapak görünür — düzen kaymaz.

Kapak kimlikleri `npm run covers` ile toplanır ve `data/covers.json` içinde
depoya commit'lenir; yayın sırasında ağ erişimi gerekmez.

**Kendi kapağını koymak:** `public/covers/<id>.jpg` (veya `.png` / `.webp`).
`<id>` kitabın `src/data/books.json` içindeki `id` alanı (`A1`, `B3`, `F10` …).
Yerel dosya her ikisini de ezer.

## Teknik notlar

- **Astro 5**, statik çıktı. Sunucu yok, veritabanı yok.
- **JavaScript çerçevesi yok.** Görünüm anahtarı, süzgeç ve künye sayfası
  yaklaşık 120 satır düz JS. Künye sayfası yerel `<dialog>` — odak tuzağı ve
  Esc tarayıcıdan hazır gelir.
- **Tek dış bağımlılık kapak görselleri.** İkonlar build sırasında SVG olarak
  gömülür, yazı tipi sistem yığınından gelir, JSON sayfanın içindedir. Ağa
  giden tek şey `covers.openlibrary.org` üzerindeki kapaklar — onlar da tembel
  yükleniyor ve başarısız olurlarsa arayüz üretilen kapakla çalışmaya devam ediyor.
- **Emoji kullanılmaz.** Her görsel işaret [Phosphor](https://phosphoricons.com)
  ikonudur (`@phosphor-icons/core`, `Icon.astro` ile satır içi).
- **Durumlar tarayıcıda saklanır** (`localStorage`). Sunucu olmadığı için
  cihazlar arasında eşitlenmez; tarayıcı verisi silinirse gider.

## Yayın

`main` dalına her push GitHub Pages'e yayınlar
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

Kendi alan adına taşırsan `astro.config.mjs` içinde `site`'ı değiştir ve
`base`'i kaldır.
