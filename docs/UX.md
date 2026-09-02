# Arayüz kararları

Her karar bir gerekçeyle bağlı. Gerekçe geçersizleşirse karar da değişmeli.

## 1. Neden yalnızca 320 piksel

İstenen hedef bu. Ama tek hedef olması bir kısıt değil, avantaj: kırılma
noktası yok, `@media` yok, "geniş ekranda ne olur" tartışması yok. Bütün
ölçüler (kapak oranı, satır uzunluğu, dokunma alanı) tek bir genişlik için
verilmiş kararlar.

`body`'nin `max-width` değeri `--app: 320px`. Daha geniş ekranda gövde
ortalanır, düzen esnemez. Genişletmek istenirse tek değişiklik `--app`.

320, bugün kullanılan en dar telefon genişliği (iPhone SE 1. nesil). Burada
çalışan her şey daha geniş telefonda da çalışır; tersi doğru değil.

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

## 6. Kapaklar

Gerçek kapak görselleri telifli. Depoya koymak yerine kitabın adından
deterministik bir kapak üretiliyor: sabit renk (djb2 hash → hue), baş harf ve
yazar adı.

Erken bir sürümde kapağın üstünde başlık da yazıyordu; başlık kartın altında
zaten olduğu için 143 piksellik kartta aynı metin iki kez görünüyordu. Kapaktan
başlık kaldırıldı, yerine baş harf monogramı kondu. Kapak artık **tanıtır**,
tekrar etmez.

Gerçek kapak isteyen `public/covers/<id>.jpg` koyar; build otomatik bulur.

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
| Sayfalama / sanal liste | 170 kart tek HTML'de 240 KB. Sanallaştırmanın karmaşıklığı bu ölçekte kazandırdığından fazla. |
| Sıralama | Markdown'daki sıra bilinçli (okuma sırası). Alfabetik sıralama o bilgiyi yok ederdi. |
| Dış bağlantı (satın alma) | Fiyat ve stok değişken; kırık bağlantı hiç bağlantı olmamasından kötü. |
