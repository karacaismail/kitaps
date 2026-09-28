# Kitap Atlası

[Canlı site](https://karacaismail.github.io/kitaps/)

718 eser, 23 küme, 100 alt küme ve 21 kategoriden oluşan birleşik okuma kataloğu.

## Özellikler

- 320 px genişlikten başlayan iki sütunlu mobil katalog; açık ve koyu kahve teması.
- Favoriler, kişisel kitaplık ve beş kitaplık okuma sırası. Satın alınanlar genel katalogda kalır; satın alma simgesi yeşil olur.
- İngilizce, okunabilir URL parametreleri; kategori, küme, yazar ve durum filtreleri. Örnek: `?category=children`.
- Tek ana kategori ve diğer kategorileri açan küçük sayaç; klavyeyle kullanılabilen sekmeler ve sayfalama.
- Mobilde ekranın %90'ını kaplayan kitap paneli; aşağı sürükleme, kapatma düğmesi ve Escape desteği.
- Kitap detayında okuma amacı, gerekçeli önce/sonra önerileri, ilgili kitaplar, yayınevi ve çevirmen bilgisi.
- Google Alışveriş ve Görseller bağlantıları; Türkçe baskısı doğrulanamayanlar için Amazon'da özgün eser araması.
- Kaynak bağlantılarıyla 707 kapak. Türkçe baskı doğrulanamadığında özgün/uluslararası baskı kapağı ve açık durum bilgisi.

## Veri doğruluğu

Baskı künyesi araştırmasında 122 kayıt bulunur; 105 kayıtta kaynakla ilişkilendirilmiş çevirmen bilgisi vardır. Kaynağın yayınevi, önizleme, kütüphane veya kitapçı olduğu detayda belirtilir. Künye doğrulaması, çeviri kalitesi karşılaştırması değildir. Çevirmen seçiminde özgün dilden aktarım, anlam doğruluğu, terim tutarlılığı, üslup ve editoryal çalışma ölçütleri açıklanır.

Eseri veya baskısı belirsiz 11 çocuk kitabı kaydında kapak yerine açıklama gösterilir. Bir çevirinin bulunamaması, hiç yayımlanmadığı anlamında sunulmaz. Çelişkili çevirmen isimleri doğrulanmış gibi gösterilmez. Yanlış eserle eşleşen kapaklar `data/rejected-cover-matches.json` içinde gerekçesiyle korunur.

Araştırma kaynakları `data/edition-verification.json`, `data/translator-research.json` ve kapak listelerinde yer alır. [Kontrol kapsamı ve bilinen sınırlar](docs/UX-VALIDATION.md).

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

GitHub Actions test ve derlemeden sonra GitHub Pages yayını yapar. Kapak dosyaları siteyle birlikte sunulur. `npm run export`, uygulama klasörünün bir üstüne kapakları gömülü `kitaps.html` ve tüm kaynakları içeren JSON dosyası yazar.

Geliştirme ortamında Control+Alt+A ile erişilebilirlik denetimi açılabilir. Bu araç yayın derlemesine dahil edilmez.

## Lisanslar

React Bits SpotlightCard: MIT + Commons Clause (`REACT-BITS-LICENSE.md`). Josefin Sans: SIL Open Font License (`FONT-LICENSES.txt`). Kullanılan diğer arayüz kitaplıkları kendi lisanslarına tabidir.
