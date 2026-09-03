# Arayüz kararları

Her karar bir gerekçeyle bağlı. Gerekçe geçersizleşirse karar da değişmeli.

## 1. 320 piksel taban, oradan yukarı akışkan

320, bugün kullanılan en dar telefon genişliği (iPhone SE 1. nesil). Bütün
kararlar orada çalışacak şekilde verildi: iki sütun sığar, dokunma alanları
44 pikselden küçülmez, hiçbir başlık taşmaz.

Ama düzen 320'ye çivilenmiş değil. 390 piksellik bir iPhone 15'te de 430
piksellik bir Pro Max'te de kartlar, yazı ve kapaklar birlikte büyür. `--app`
(560px) üst sınır: onun ötesinde gövde ortalanır, çünkü iki sütunlu bir kart
düzeni 900 pikselde anlamını yitirir.

Akışkanlık kırılma noktasıyla değil, iki araçla sağlanıyor:

| Araç | Nerede |
|---|---|
| `clamp(en az, akışkan, en çok)` | Görünen alana bağlı ölçüler: boşluk, yazı boyutu, yatay görünümdeki kapak genişliği. |
| `cqw` ve `@container` | Kartın **kendi** genişliğine bağlı ölçüler: monogram harfi, kapak dolgusu, rozet boyutu. |

`@container` tercihi bilinçli. Rozetlerin küçülmesi görünüme (`[data-view="list"]`)
değil kapağın genişliğine bağlı; böylece tek kural hem tek satır görünümünde
hem dar ekrandaki iki sütunda doğru çalışıyor. Görünüme bağlasaydık her yeni
genişlikte ayrı bir istisna yazmak gerekirdi.

**Bilinen sınır:** 320 pikselin altında (`min-width: 320px`) düzen garanti
edilmiyor; o genişlikte yatay kaydırma çıkar.

## 2. Neden tablo değil kart

Tablo satır başına sabit sütun ister. 320 pikselde beş sütun (yazar, çevirmen,
orijinal ad, Türkçe ad, yayınevi) yan yana sığmaz; sığdırmaya çalışmak yatay
kaydırma veya 8 piksel yazı demektir. İkisi de kullanılamaz.

Kart bu veriyi ikiye ayırır:

- **Listede:** tanımaya yetecek kadarı — kapak + orijinal ad.
- **Dokununca:** karar vermeye yetecek kadarı — beş künye alanı + not.

Bu, e-ticaret listeleme sayfalarının çözdüğü problemin aynısı: 170 öğe içinde
gezinirken her öğenin tam künyesi gerekmez, aradığını bulduğunda gerekir.

## 3. Görünüm anahtarı: iki düğme, tek bileşen

İki görünüm aynı `BookCard` bileşeniyle karşılanır; ayrım ebeveyndeki
`data-view` özniteliğiyle CSS tarafında yapılır.

| | Ne zaman işe yarar |
|---|---|
| **İki sütun** (`grid`) | Göz kapaktan tanıyor. Renk ve baş harf hafızada yer etmiş kitaplarda hızlı. |
| **Tek satır yatay** (`list`) | Ad okumak gerekiyor. Uzun başlıklar tam görünür, ekranda iki kat çok kitap sığar. |

Bileşen tek olduğu için geçişte DOM yeniden kurulmaz: kaydırma konumu ve
işaretlenmiş durumlar yerinde kalır. Seçim `localStorage`'a yazılır.

## 4. Künye neden alttan açılan sayfa

Ayrı bir URL'e gitmek yerine `<dialog>`:

- **Bağlam kaybolmuyor.** Kapanınca liste aynı yerde duruyor, odak açan karta
  geri dönüyor. 170 kitap arasında gezinirken en önemlisi bu.
- **Yerel `<dialog>`** odak tuzağını, `Esc` ile kapanmayı ve arka planı
  etkisizleştirmeyi tarayıcıdan hazır getirir. JS ile yeniden yazılmadı.
- **Alta hizalı**, çünkü 320 piksellik bir telefonda başparmağın ulaştığı yer
  ekranın altı. Kapatma düğmesi üstte ama arka plana dokunmak da kapatıyor.

170 kitap için tek bir `<dialog>` var, içeriği JS dolduruyor. 170 ayrı dialog
DOM'u gereksiz yere şişirirdi.

## 5. Kullanıcı durumları

Dört durum: **önemli**, **satın alındı**, **okunuyor**, **okundu**.

- **Çoklu seçim**, çünkü ortogonaller: bir kitap hem önemli hem satın alınmış
  olabilir. Tek seçim olsaydı kullanıcı hangisini feda edeceğini seçmek
  zorunda kalırdı.
- **Kartta rozet olarak görünür**, çünkü işaretlemenin karşılığı listede
  görünmezse işaretlemenin anlamı kalmaz.
- **Satın alınmış kitap geri plana çekilir**: kapak soluklaşır, başlık üstü
  çizilir. Liste "alınacaklar" listesi; alınmış olan gözü meşgul etmemeli.
  Silinmez, çünkü hangi baskıyı aldığını sonra kontrol etmek isteyebilirsin.
- **Süzgeçte durum çipleri var**, çünkü "önemli olanları göster" bu listenin
  en olası ikinci kullanımı.

Saklama: `localStorage`, anahtar `kitaps:states:v1`. Şema
`{ "<kitap-anahtarı>": ["onemli", "alindi"] }`. Kitabın anahtarı satır
sırasından değil adı ve yazarından türetilir — markdown'da satırlar yer
değiştirse de işaretler yerinde kalır.

**Bilinen sınır:** sunucu olmadığı için cihazlar arası eşitleme yok ve tarayıcı
verisi silinirse işaretler gider. Bu, statik bir sitede sunucusuz çözümün
bedeli; alternatifi hesap açtırmaktı, bu ölçekteki bir liste için ağır kaçardı.

## 6. Kapaklar: iki katman

Kapak her zaman iki katman:

1. **Altta üretilen kapak.** Kitabın adından deterministik: sabit renk (djb2
   hash → hue), baş harf monogramı, yazar adı. Ağ gerektirmez.
2. **Üstte gerçek kapak.** Open Library'nin açık kapak servisinden, tembel
   yüklenir. 170 kitabın 132'sinde bulundu.

Neden alttaki katman hiç kaldırılmıyor: gerçek kapak %78 oranında var, %22
yok. Görselin olmadığı yerde boş gri kutu bırakmak listeyi delik deşik
gösterirdi. Üretilen kapak her zaman yerinde durduğu için görsel yüklenemezse
(404, ağ kesik, engelleyici) `error` olayında kendini siliyor ve altındaki
kapak görünüyor — **yer değiştirme (layout shift) olmuyor**, boş kutu da kalmıyor.

`error` olayı balonlanmadığı için dinleyici yakalama aşamasında (`capture`)
belgeye bağlı; 132 ayrı `onerror` yerine tek dinleyici.

Erken bir sürümde üretilen kapağın üstünde başlık da yazıyordu; başlık kartın
altında zaten olduğu için 143 piksellik kartta aynı metin iki kez görünüyordu.
Kapaktan başlık kaldırıldı, yerine monogram kondu. Kapak artık **tanıtır**,
tekrar etmez.

**Bilinen bedel:** kapaklar sitenin tek dış bağımlılığı. `covers.openlibrary.org`
erişilemezse arayüz çalışmaya devam eder ama monogram kapaklara düşer.
Görselleri depoya indirmek bu bağımlılığı kaldırırdı; telifli materyali yeniden
dağıtmamak için tercih edilmedi.

Kendi kapağını koymak isteyen `public/covers/<id>.jpg` koyar; yerel dosya her
ikisini de ezer.

## 7. Emoji yok, Phosphor var

Emoji platforma göre farklı çizilir, boyutu ve hizası kontrol edilemez, rengi
metin rengini almaz. Her görsel işaret Phosphor ikonu ve build sırasında SVG
olarak satır içine gömülüyor — `currentColor` alıyor, boyutu piksel piksel
kontrol ediliyor, ağ isteği yok.

Kaynak markdown'daki durum emojileri (`✅ ⚠️ ❓ 🚫`) veri üretilirken metinden
sökülüp ayrı bir `status` alanına çevriliyor; arayüzde karşılıkları
`check-circle`, `warning`, `question`, `prohibit`.

## 8. Erişilebilirlik

- Her dokunma hedefi en az 44×44 piksel. Görünüm anahtarı düğmeleri görsel
  olarak 32 piksel yüksekliğinde ama `::after` ile dokunma alanı 44'e
  tamamlanıyor.
- Kart bir `<button>`, `aria-label`'ı `"<başlık> — künyeyi aç"`.
- Yalnızca ikon taşıyan düğmelerin adı `aria-label` ile düğmenin üzerinde
  (SVG `<title>` bazı ekran okuyucularda güvenilir okunmuyor).
- Süzgeç ve görünüm düğmeleri `aria-pressed` taşıyor.
- "İçeriğe atla" bağlantısı klavyeyle ilk durak.
- `:focus-visible` her yerde görünür.
- Açık/koyu tema `prefers-color-scheme` ile; renkler ikisinde de ayrı tanımlı.
- `prefers-reduced-motion` verildiğinde animasyon ve dokunma ölçeklemesi kapanır.
- 320 pikselde yatay kaydırma yok; uzun başlıklar `overflow-wrap: anywhere` ile
  kırılıyor, kartta `-webkit-line-clamp` ile sınırlanıyor.

## 9. Bilinçli olarak yapılmayanlar

| | Neden |
|---|---|
| Arama kutusu | Süzgeç çipleri 170 kitap için yetiyor. Arama, klavye açılınca ekranın yarısını götürüyor. Liste büyürse eklenmeli. |
| Geniş ekranda çok sütun | İstenen düzen "iki kutu yan yana". `auto-fill` ile 900 pikselde dört sütun olurdu; bu, verilen karara aykırı. Onun yerine gövde 560'ta durur. |
| Sayfalama / sanal liste | 170 kart tek HTML'de 240 KB. Sanallaştırmanın karmaşıklığı bu ölçekte kazandırdığından fazla. |
| Sıralama | Markdown'daki sıra bilinçli (okuma sırası). Alfabetik sıralama o bilgiyi yok ederdi. |
| Dış bağlantı (satın alma) | Fiyat ve stok değişken; kırık bağlantı hiç bağlantı olmamasından kötü. |
