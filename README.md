# Kitap Atlası

[Canlı site](https://karacaismail.github.io/kitaps/)

718 eser, 23 küme, 100 alt küme ve 21 kategoriden oluşan birleşik okuma kataloğu.

## Bu sürüm

- 320 px genişlikten başlayan iki sütunlu mobil katalog, açık ve koyu tema.
- Favoriler, kişisel kitaplık ve beş kitaplık okuma sırası. Satın alınanlar genel katalogda kalır.
- İngilizce, okunabilir URL parametreleri; kategori, küme, yazar ve durum filtreleri.
- Kitap detayında okuma amacı, önce/sonra okunacaklar, benzer kitaplar ve baskı bilgileri.
- Kaynak bağlantılarıyla 677 kapak. Türkçe baskı doğrulanamadığında uluslararası kapak ve açık durum bilgisi.
- Yayınevi ve çevirmen künyeleri ISBN ile ilişkilendirilir. Künye doğrulaması çeviri kalitesi garantisi değildir.

## Korunan eski sürüm

Önceki uygulamanın bütün izlenen dosyaları `legacy/b1d060c/` altında korunur. Git geçmişi değiştirilmemiştir. Özgün Markdown ve kapak listesi ayrıca `data/kitaplar.md` ve `data/covers.json` yollarında kalır. Birleştirilen girdiler `data/sources/` altındadır.

Kişisel işaretler ve notlar tarayıcıda saklanır. Eski Kitaps işaretleri aynı origin içinde taşınır; eski depolama silinmez. Başka cihazların veya localhost üzerindeki tarayıcı kayıtlarının otomatik aktarımı yoktur. Notlar bölümünden yedek alınıp içe aktarılabilir.

## Geliştirme

```sh
npm ci
npm run data
npm test
npm run dev
npm run build
```

GitHub Actions test ve derlemeden sonra GitHub Pages yayını yapar. Kapak dosyaları siteyle birlikte sunulur. Kaynak kayıtlarındaki çelişkiler ve eksik çevirmen bilgileri tamamlanmış olarak gösterilmez.

## Lisanslar

React Bits SpotlightCard: MIT + Commons Clause (`REACT-BITS-LICENSE.md`). Josefin Sans: SIL Open Font License (`FONT-LICENSES.txt`). Kullanılan diğer arayüz kitaplıkları kendi lisanslarına tabidir.
