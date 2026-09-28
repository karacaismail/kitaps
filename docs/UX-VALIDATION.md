# UX ve erişilebilirlik kontrolü

Son kontrol: 28 Eylül 2026. Kontrollerin çoğu otomatik testlere bağlıdır; her yayından önce GitHub Actions içinde yeniden çalışır.

## Otomatik kontroller

| Kontrol | Nerede | Kapsam |
|---|---|---|
| Veri, sıralama ve eşitleme | `npm test` (node:test) | Katalog bütünlüğü, dışa aktarma, rotalar, sıralama motoru, GitHub durum deposu |
| Bileşenler | `npm test` (Vitest + Testing Library, jsdom) | Baskı özeti, çeviri durumu, puan kartı ve özeti, kitap keşfi, eşitleme paneli, yeni cihaz penceresi, eşitleme kancası |
| Tarayıcı | `npm run test:e2e` (Playwright, Chromium, derlenmiş site) | GitHub'dan gerçek okuma ve CORS, katalog açılışı, telefon ilk ekranı, satın almanın puanı değiştirmemesi, özgün Türkçe eser, URL'de sayfa durumu, axe taraması |
| Tip | `npm run typecheck` | Sıralama ve durum alanı sıkı TypeScript; JS/JSX görünümleri gevşek kurallarla |

## Görsel dil

- Kitap adları, sayfa başlıkları ve logo Literata ile yazılır; site bu yazı tipini kendisi sunar. Arayüz metni cihazın kendi yazı tipini kullanır (iPhone ve Mac'te SF, Android'de Roboto, Windows'ta Segoe UI); böylece ikinci bir yazı tipi indirilmez.
- Açık tema sıcak kâğıt zemin (#f6f3ee), beyaz yüzeyler ve tek bir tuğla kırmızısı vurgu (#9a3f1e) kullanır. Koyu tema aynı yapıyı nötr koyu yüzeylerle kurar; vurgu rengi açılır (#ef9a70).
- Metin renkleri iki temada da WCAG AA sınırının üstündedir. En düşük değerler: açık temada soluk metin 5,35:1, vurgu 5,49:1; koyu temada soluk metin 5,60:1. Form alanı kenarları zemine karşı en az 3,27:1'dir.
- Renkler tek bir değişken kümesinden gelir (`src/styles.css` başı); Mantine bileşenleri de aynı değişkenleri kullanır.

## Katalog ve kart düzeni

- Kapak kartın asıl öğesidir: 2:3 oranlı alanda kitap gibi gölgelenir, küçük kaynak görselleri oranı bozulmadan alanı doldurur. Kapağın üstünde yalnız sıra ve puan rozeti vardır.
- Kapağın altında sırasıyla kitap adı (en fazla iki satır), yazar, çocuk kitaplarında önerilen yaş, çeviri durumu ile Türkçe yayınevi ve kişisel düğmeler (kalp, çanta, sıra) yer alır. Düğmeler kapağı örtmez; fare kullanılan ekranlarda kart üzerine gelinince ya da düğme işaretliyse görünür, dokunmatik ekranlarda her zaman görünür.
- Kapağı henüz doğrulanmamış kitaplarda boş bir simge yerine kitabın adını ve yazarını taşıyan sade bir kapak gösterilir.
- Çeviri durumu bir simge ve kısa bir sözcükle verilir: doğrulanmış Türkçe baskı "Türkçe", kaynağıyla doğrulanmış yokluk "Türkçesi yok", henüz doğrulanamayan durum "Doğrulanmadı". Renk tek başına anlam taşımaz. Üzerine gelince kısa açıklama, tıklayınca kaynak ayrıntısı açılır. Özgün Türkçe eserlerde çeviri göstergesi yoktur.
- Izgara telefonda 2, tablette 3, masaüstünde 4 ve geniş ekranda 5 sütundur.

## Mobil düzen ve etkileşim

- 320 px ve 375 px genişlikte iki sütun; yatay sayfa taşması yok (tarayıcı testi). Üst menü sayfa kaydırılırken üstte kalır. Masaüstünde logo, bölüm sekmeleri (Kitaplar, Sıram, Kümeler), Kızım için, Favoriler, Kitaplığım ve tema tek satırdadır; telefonda sekmeler ikinci satırda eşit genişlikte durur.
- 375 × 812 görünümde ilk kitap kartlarının adları ilk ekranda görünür (tarayıcı testi). Arama tek alandır; filtre ve sıralama altında yan yana durur. Okuma önceliği açıklaması tek satırlık, açılır bir düğmedir.
- Mobil kitap ayrıntısı 92dvh yüksekliğinde alttan açılır. Başlık satırı ve ortalanmış tutamaç içerik kaydırılırken üstte sabit kalır; tutamaç aşağı sürüklenince panel kapanır; kapatma düğmesi, Escape ve tutamaca dokunma da çalışır. Panel kapanınca odak açan kitaba döner; tarayıcının Geri düğmesi açık kitabı kapatır.
- "Kızım için" kısayolu özel çizilmiş kız çocuğu simgesini kullanır. Bu sayfada "13 yaşına kadar temel kütüphane" paneli yaş bantlarını (3–5, 5–7, 7–8, 8–10, 10–11, 11–12, 12–13) ve iki çekirdek seçkiyi (Çekirdek 14 · 10 yaş öncesi, İlk altı · 10–13) tek dokunuşla açar.
- Kitaplığım, Favoriler, Sıram ve Notlar sayfalarında açıklama paragrafı yoktur; yalnız işlevsel metinler ve eşitleme bölümündeki gizlilik bildirimi kalır.

## WCAG 2.2 AA

Tarayıcı testi, axe-core ile WCAG 2 A/AA, 2.1 A/AA ve 2.2 AA etiketlerini katalogda ve bir kitap ayrıntısında, açık ve koyu temada tarar; sonuç sıfır ihlal olmalıdır. Yeni tasarım bu taramayı iki temada da geçer.

- Her denetim öğesi aynı görünür odak çizgisini kullanır (2 px, vurgu renginde, 2 px boşlukla). Form alanlarında odak kenar rengini ve hafif bir gölgeyi değiştirir; yüksek karşıtlık modunda sistem vurgu rengine döner.
- Olgunluk rozeti her düzey ve tema için kendi yazı/zemin çiftini kullanır (en düşük 6,7:1).
- Düğmeler ve simge düğmeleri en az 44 px dokunma alanı taşır; kart düğmeleri 44 × 40 px'dir. Kitap adı düğmeleri en az 24 px yüksekliktedir, kartın tamamı da tıklanabilir.
- Gövde metni 16 px'dir. Kart içindeki yazar ve yayınevi satırları 14–15 px, rozet ve küçük başlık etiketleri 13 px'dir. Önceki "hiçbir metin 16 px'nin altına inmez" kuralı kartların iki sütuna sığması için bu satırlarda bırakıldı.
- Azaltılmış hareket tercihinde geçişler ve kapak hareketleri kapanır.

Otomatik tarama bütün WCAG ölçütlerinin veya her ekran okuyucu/cihaz birleşiminin sertifikası değildir. Gerçek iPhone, Android cihaz, VoiceOver ve TalkBack ile elle test hâlâ kapsam dışıdır.

## Performans

- Site parçalı derlenir: uygulama kodu, katalog verisi, React, Mantine ve simgeler ayrı ve uzun süre önbelleklenebilir dosyalardır.
- Literata değişken ve alt kümelere bölünmüş dosyalardır; tarayıcı yalnız sayfadaki karakterlerin alt kümesini indirir (Türkçe için yaklaşık 95 KB). Arayüz yazı tipi indirilmez.
- Notlar sayfası, Markdown işleyicisi ve ham kaynak arşivleri yalnızca gerektiğinde yüklenir.
- `npm run export` kapakları gömülü tek dosyalık sürümü ayrıca üretir.

## Kaynağı belirsiz kayıtlar

Bilimin Yıldızları seti; Robinson Crusoe çocuk uyarlaması; Masal Masal İçinde; Dede Korkut çocuk uyarlaması; Anadolu Masalları; Arkadaşım Balina; Kar Tanesi Masalı; Kaplumbağa Terbiyecisi; Dostluk Ekmeği; Plastik Deniz.

13 yaşına kadar temel kütüphanede Türkçe baskısı doğrulanamayanlar (seçimi ebeveyne ait olduğu için listede tutuldu): Ayı Avına Gidiyoruz, Gökkuşağı Balığı, Alfons Åberg, Üç Küçük Domuzcuk (yalnız farklı olay örgülü bir parodi bulunabildi) ve Mary Poppins (tek kitabevinde görülen baskı).

Bu kayıtlarda yazar-eser eşleşmesi veya belirli uyarlama/baskı tanımı kesinleşmedi. Rastgele aynı adlı bir kitabın kapağı eklenmedi. Gerekçeler `data/source-issues.json`, `data/children-library.json` içinde ve kitap panelindedir.

## Yayın ve geri dönüş

Eski Kitaps deposunun izlenen dosyaları `legacy/b1d060c/` altında byte düzeyinde korunur; eski commit geçmişi yeniden yazılmadı. Bir önceki sürüm Git geçmişinden yeniden yayımlanabilir. Kişisel kayıtlar tarayıcıda ve bağlanan cihazlarda herkese açık `kitaps-state` deposunda tutulur; site dosyaları kişisel kayıt içermez.
