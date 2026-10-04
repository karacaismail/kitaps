# Kitaplık: ajan talimatları

## Proje sahibinin kesin kuralları

Bu kurallar yalnızca proje sahibinin açık talimatıyla değişir. Hiçbir ajan bunları tasarım, erişilebilirlik ya da "iyileştirme" gerekçesiyle kendi kararıyla değiştiremez. Değişiklik gerektiğini düşünüyorsan önce sor.

1. **Sayfa boyutları:** 24, 48, 96, 192 ve 384 (`src/library.js`, `PAGE_SIZES`). Varsayılan 24'tür. 25, 50, 75 ve 100 gibi 24'ün katı olmayan sayılar kullanılmaz.
2. **Katalog ızgarası (`.books-grid`):** Telefonda 2, tablette 3, masaüstünde ve daha geniş ekranlarda 4 sütun gösterilir; 5 ve üzeri yoktur. Sütun sayısını `src/styles.css` içindeki `--books-columns` belirler. İzin verilen değerler `src/library.js` içindeki `GRID_COLUMNS` listesindedir. Sütun sayısını tarayıcıya bırakan `auto-fill` ve `auto-fit` kullanılmaz.
3. **Dolu son satır:** Her sayfa boyutu her sütun sayısına tam bölünür; dolu bir sayfanın son satırında boşluk kalmaz.

Bu kuralları koruyan testler:

- `tests/routes.test.js`
- `tests/catalog-grid.test.js`
- `tests/e2e/catalog-grid.spec.js` (Chromium, WebKit, Firefox ve iPhone görünümü)

Bu testleri kuralı gevşetmek için değiştirme.

## Kontroller

- `npm test`: node:test ve Vitest
- `npm run typecheck`
- `npm run build`: üretim çıktısını `dist/` klasörüne yazar
- `npm run test:e2e`: önce build gerekir. Paralel worktree'lerde başka bir port kullan, örneğin `E2E_PORT=4517 npm run test:e2e`.
- Veri değiştiğinde `npm run data` çalıştır (bkz. README).

## Aynı depoda birden çok oturum

- Force push yapılmaz.
- Push'tan hemen önce sırasıyla:
  1. `git fetch` ile güncel durumu al.
  2. Değişiklikleri `origin/main` üzerine rebase et.
  3. Kontrolleri yeniden çalıştır.
  4. Yalnız fast-forward olarak push et.
- Push'tan sonra diğer oturumlara yeni `origin/main` SHA'sını bildir.
- Başka bir oturumun alanındaki çakışmayı o oturuma danışarak çöz.

## Kişisel durum deposu

Okuma durumları, sahiplik, favoriler ve okuma sırası herkese açık `karacaismail/kitaps-state` deposundaki `state.json` dosyasında tutulur. Tasarım ve yazma anahtarı kuralları `docs/ADR-001-reading-priority-and-state.md` içindedir. Anahtar, token veya başka bir sır depoya yazılmaz.

## Arayüz

- **Tokenlar:** Renk, boşluk, köşe yarıçapı ve odak `src/styles.css` başındaki tokenlarla yönetilir. Bileşenlerde sabit değer yazılmaz.
- **Açılır listeler:** Mantine Select kullanılır; yerel `<select>` kullanılmaz.
- **Odak:** Tek ve görünür bir `:focus-visible` halkası korunur.
- **Kabul:** 320 px'den başlar. Ayrıntılar `docs/UX-VALIDATION.md` içindedir.
