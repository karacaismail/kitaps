# Girişimcilik kitaplığı genişletme

## Hangi eksik adayların kesin resmi yayıncı veya yazar kayıtları var?

### Takeaway

Öneri metinleri ile katalog karşılaştırıldığında, aşağıdaki 19 eser ekleme adayı olarak öne çıkıyor. Bunların 17'si için resmi yayıncı, yazar sayfası veya güvenilir bibliyografik katalog üzerinden tam eser kimliği doğrulandı. `Founding Sales` ve `7 Powers` için resmi yazar siteleri eser kimliğini doğruluyor; ancak ilk baskı yılı ve ISBN bu sitelerde görünmediği için bu iki alan boş bırakılmalı. `The Personal MBA` katalogda tam alt başlığıyla zaten yer aldığı için eksik aday sayılmadı; karşılaştırmanın dayanağı yerel [catalog.json](../../src/catalog.json) dosyasıdır.

### Cited Findings

| Öncelik | İngilizce eser ve yazar | İlk / doğrulanmış baskı | Güvenilir kayıt | Katalog için önerilen işlem |
|---|---|---|---|---|
| 1 | **The Mom Test — Rob Fitzpatrick** | İlk bağımsız baskı 2013, ISBN 9781492180746; Authors Equity'nin gözden geçirilmiş ikinci baskısı 30 Mart 2027, ISBN 9798893312560 | [2013 baskı bibliyografisi](https://konyv.arukereso.hu/the-mom-test-rob-fitzpatrick-isbn-9781492180746-m18377805/); [Simon & Schuster / Authors Equity](https://www.simonandschuster.net/books/The-Mom-Test/Rob-Fitzpatrick/9798893312560) | Eser yılı 2013; gelecekteki ikinci baskının kapağını varsayılan yapma |
| 2 | **Competing Against Luck — Clayton M. Christensen, Taddy Hall, Karen Dillon, David S. Duncan** | HarperCollins, 2016; e-kitap ISBN 9780062435637; basılı ISBN 9780062435613 | [Google Books](https://books.google.com/books/about/Competing_Against_Luck.html?id=zGd_CwAAQBAJ); [Harvard Book Store baskı kaydı](https://www.harvard.com/book/9780062435613) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 3 | **Disciplined Entrepreneurship — Bill Aulet** | Wiley, 2013; ciltli ISBN 9781118692288, e-kitap ISBN 9781118720813 | [Wiley birinci baskı](https://uat.store.wiley.com/en-us/disciplined-entrepreneurship-24-steps-to-a-successful-startup-p-9781118692288); [Wiley ikinci baskı](https://uat.store.wiley.com/en-us/disciplined-entrepreneurship-24-steps-to-a-successful-startup-expanded-updated-2nd-edition-p-9781394222520) | Ekle; eser yılı 2013, 2024 ikinci baskıyı ayrı baskı olarak tut |
| 4 | **Business Model Generation — Alexander Osterwalder, Yves Pigneur** | Wiley, 2010; ISBN 9780470876411 | [Wiley](https://uat.store.wiley.com/en-us/business-model-generation-a-handbook-for-visionaries-game-changers-and-challengers-p-9780470876411) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 5 | **Value Proposition Design — Alexander Osterwalder, Yves Pigneur, Gregory Bernarda, Alan Smith** | Wiley, 2014; basılı ISBN 9781118968055, e-kitap ISBN 9781118968062 | [Wiley](https://uat.store.wiley.com/en-us/value-proposition-design-how-to-create-products-and-services-customers-want-p-9781118968062) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 6 | **Testing Business Ideas — David J. Bland, Alexander Osterwalder** | Wiley, Kasım 2019; basılı ISBN 9781119551447, e-kitap ISBN 9781119551423 | [Wiley Strategyzer serisi](https://www.wiley.com/en-us/shop/the-strategyzer-series-c-5176); [VitalSource/Wiley bibliyografisi](https://www.vitalsource.com/products/testing-business-ideas-david-j-bland-alexander-v9781119551423) | Ekle; Türkçe baskı kanıtlanana kadar uluslararası baskı kullan |
| 7 | **Founding Sales: Sales for Founders (and Others) in First-time Sales Roles — Pete Kazanjy** | Resmi sitede çevrimiçi, basılı ve e-kitap biçimleri var; ilk baskı yılı ve ISBN gösterilmiyor | [Resmi eser sitesi](https://www.foundingsales.com/) | Ekleme öncesi ISBN/yıl için kütüphane kataloğu ile ikinci doğrulama yap |
| 8 | **Obviously Awesome — April Dunford** | Ambient Press, 2019; ISBN 9781999023010 | [Google Books](https://books.google.com/books/about/Obviously_Awesome.html?id=IC7n0AEACAAJ); [resmi yazar kitap sayfası](https://www.aprildunford.com/books) | Ekle; Türkçe baskı kanıtlanana kadar uluslararası baskı kullan |
| 9 | **7 Powers: The Foundations of Business Strategy — Hamilton Helmer** | Resmi site eser ve yazarı doğruluyor; ilk baskı yılı/ISBN sayfada yok | [Resmi eser sitesi](https://7powers.com/); [resmi satın alma sayfası](https://7powers.com/buy-the-book/) | ISBN ve ilk baskı yılı için ikinci bibliyografik kayıt bulmadan kesin metadata yazma |
| 10 | **Traction — Gabriel Weinberg, Justin Mares** | İlk baskı S Curve, 2014; Portfolio baskısı 6 Ekim 2015, ISBN 9781591848363 | [Google Play ilk baskı](https://play.google.com/store/books/details/Traction_A_Startup_Guide_to_Getting_Customers?hl=en_GB&id=9-4bBAAAQBAJ); [Penguin Random House](https://www.penguinrandomhouse.com/books/319121/traction-by-gabriel-weinberg-and-justin-mares/) | Ekle; eser yılı 2014, kalıcı kaynak olarak PRH baskısını da tut |
| 11 | **The Great CEO Within — Matt Mochary** | Mochary Films, 2019; ISBN 9780578599281 | [Google Books](https://books.google.com/books?id=Y3abywEACAAJ); [resmi Mochary Method sayfası](https://mocharymethod.org/the-great-ceo-within/) | Ekle; Türkçe baskı doğrulanmadı |
| 12 | **Who: The A Method for Hiring — Geoff Smart, Randy Street** | Random House Publishing Group, 30 Eylül 2008; ISBN 9780345504197 | [Resmi eser sayfası](https://whothebook.com/order/) | Ekle; Türkçe baskı doğrulanmadı |
| 13 | **Secrets of Sand Hill Road — Scott Kupor** | Portfolio, 4 Haziran 2019; ISBN 9780593083581 | [Penguin Random House](https://www.penguinrandomhouse.com/books/607128/secrets-of-sand-hill-road-by-scott-kupor-foreword-by-eric-ries/) | Ekle; Türkçe baskı doğrulanmadı |
| 14 | **Monetizing Innovation — Madhavan Ramanujam, Georg Tacke** | Wiley, Mayıs 2016; ciltli ISBN 9781119240860, e-kitap ISBN 9781119240884 | [Wiley](https://uat.store.wiley.com/en-us/monetizing-innovation-how-smart-companies-design-the-product-around-the-price-p-9781119240884) | Ekle; Türkçe baskı doğrulanmadı |
| 15 | **Profit First — Mike Michalowicz** | Portfolio, 21 Şubat 2017; ISBN 9780735214149 | [Penguin Random House](https://www.penguinrandomhouse.com/books/549696/profit-first-by-mike-michalowicz/) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 16 | **The Cold Start Problem — Andrew Chen** | HarperCollins, 2021; ISBN 9780062969743 | [Yazarın sitesindeki yayıncı baskı künyesi](https://andrewchen.com/wp-content/uploads/2022/01/ColdStartProb_9780062969743_AS0928_cc20_Final.pdf?trk=public_post_comment-text); [Open Library](https://openlibrary.org/books/OL34688593M/Cold_Start_Problem) | Ekle; Türkçe baskı kanıtlanana kadar uluslararası baskı kullan |
| 17 | **Negotiation Genius — Deepak Malhotra, Max H. Bazerman** | İlk baskı 2007, ISBN 9780553804881; 2008 Bantam paperback ISBN 9780553384116 | [Baskı listesi](https://www.goodreads.com/work/editions/1910943-negotiation-genius?expanded=false); [Harvard Book Store 2008 baskısı](https://www.harvard.com/book/9780553384116) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 18 | **The Outsiders — William N. Thorndike** | Harvard Business Review Press, 2012; ISBN 9781422162675 | [Open British National Bibliography](https://obnb.uk/p16253709-the-outsiders-eight-unconventional-ceos-and-their-radically-rational-blueprint-for-success) | Ekle; doğrulanmış Türkçe baskıyı bağla |
| 19 | **Thinking in Bets — Annie Duke** | Portfolio, 6 Şubat 2018; güncel paperback ISBN 9780735216372 | [Penguin Random House](https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/) | Ekle; Türkçe baskı doğrulanmadı |

### Inferences

- İlk ekleme dalgası için `The Mom Test`, `Business Model Generation`, `Value Proposition Design`, `Testing Business Ideas`, `Obviously Awesome`, `Traction`, `Profit First`, `The Cold Start Problem` ve `The Outsiders` birlikte güçlü bir müşteri keşfi, ürün tasarımı, konumlandırma, dağıtım, finans ve yönetim omurgası oluşturur. Bu seçim öneri metinlerindeki tekrar ve konu kapsamına dayalı editoryal bir çıkarımdır.
- Aynı eserin ilk yayın yılı ile katalogda kullanılacak güncel baskı kaydı ayrı tutulmalı. Özellikle `The Mom Test`, `Disciplined Entrepreneurship` ve `Traction` için tek bir `year` alanı baskı geçmişini kaybettirebilir.

### Gaps

- `Founding Sales` ve `7 Powers` için ISBN ile ilk baskı yılı resmi sayfalarda görünmedi; eklemeden önce WorldCat, Library of Congress veya yayıncı kayıtlarıyla tamamlanmalı.
- `The Mom Test` için resmi sayfa henüz yayımlanmamış 2027 ikinci baskıyı gösteriyor. 2013 ilk baskı kaydı ticari bibliyografiden geliyor; daha güçlü bir kütüphane kaydı tercih edilir.
- `Negotiation Genius` ilk baskı verisi Goodreads üzerinden doğrulandı; katalog provenance alanında Bantam/PRH veya ulusal kütüphane kaydı bulunursa onunla değiştirilmesi daha iyi olur.

## Hangilerinin doğrulanmış Türkçe baskısı var?

### Takeaway

Altı aday için Türkçe basılı baskı, Türkçe başlık, yayınevi ve ISBN doğrulandı. Beşinde çevirmen de ürün veya yayıncı sayfasında açıkça yer alıyor. `Competing Against Luck` çevirmeni, satış sayfasında görünmediği için İstanbul Üniversitesi tezinin kaynakçasıyla ikinci aşamada doğrulandı. Bu altı eser katalogda `translationStatus: available` benzeri kesin bir duruma geçirilebilir; geri kalanlar için “çeviri yok” sonucu çıkarılmamalı.

### Cited Findings

| İngilizce eser | Doğrulanmış Türkçe baskı | Türkçe yayınevi, tarih | Çevirmen | Kaynak ve kanıt gücü |
|---|---|---|---|---|
| **Value Proposition Design** | **Müşteriniz Ne İster?** — ISBN 9786050822649 | Timaş, 31 Mart 2016 | Cem Özdemir | [Timaş resmi ürün sayfası](https://timas.com.tr/musteriniz-ne-ister) — başlık, özgün ad, dil, ISBN, tarih ve çevirmen aynı kayıtta |
| **Business Model Generation** | **İş Modeli Üretimi** — ISBN 9786052202814 | Optimist Yayın Dağıtım, Ocak 2021 | Levent Göktem | [Scala Kitapçı ürün kaydı](https://www.scalakitapci.com/is-modeli-uretimi) — Türkçe baskı künyesi ve özgün ad |
| **Competing Against Luck** | **İnovasyonda Ustalaşmak** — ISBN 9786052261873 | Optimist Kitap, Mart 2018 | Ümit Şensoy | [BKM ürün kaydı](https://www.bkmkitap.com/inovasyonda-ustalasmak) — ISBN/yayınevi/yıl; [İstanbul Üniversitesi tez kaynakçası](https://nek.istanbul.edu.tr/ekos/TEZ/ET000048.pdf) — çevirmen ve Mart 2018 baskısı |
| **Profit First** | **Önce Kar** — ISBN 9786257232296 | Peta Kitap Yayıncılık, 31 Mart 2022 | Gülfiza Balcı | [Kitapyurdu ürün kaydı](https://www.kitapyurdu.com/kitap/once-kar/612937.html?publisher_id=10230) — ISBN, dil, çevirmen, tarih ve yayınevi |
| **Negotiation Genius** | **“Evet” Dedirtme Sanatı** — ISBN 9786054629725 | Koridor Yayıncılık, Eylül 2014 | Korkmaz Haktanır | [Kitap ve Kahve ürün kaydı](https://www.kitapvekahve.com/evet-dedirtme-sanati) — özgün ad, ISBN, çevirmen, tarih ve yayınevi |
| **The Outsiders** | **Aykırılar: Sekiz Sıra Dışı CEO ve Tamamen Rasyonel Başarı Modelleri** — ISBN 9786052998090 | Pegasus Yayınları, Kasım 2019 | Nil Bosna | [Pegasus resmi ürün sayfası](https://pegasusyayinlari.com/kitap_detay.php?kitapid=15766668457) — özgün ad, ISBN, çevirmen, tarih ve yayınevi |

### Inferences

- Bu altı kayıtta Türkçe baskı ile İngilizce eseri ISBN yerine özgün ad + yazar eşleşmesiyle bağlamak daha dayanıklıdır; Türkçe ISBN baskıya özgüdür ve yeni baskıda değişebilir.
- `İnovasyonda Ustalaşmak` için iki ayrı kaynağın kullanılması iki aşamalı doğrulama sağlar: ticari kayıt ISBN/yayınevini, akademik kaynakça çevirmeni doğruluyor.

### Gaps

- `İş Modeli Üretimi` için kaynak güvenilir bir uzman kitapçı kaydıdır, fakat yayıncının kendi kalıcı ürün sayfası bulunursa provenance onunla güçlendirilmeli.
- `Önce Kar` ve `“Evet” Dedirtme Sanatı` için yayıncı sitelerinde kalıcı ürün sayfası bulunursa mevcut perakendeci bağlantılarının yanına eklenmeli.
- Türkçe baskının varlığı doğrulanmış olsa da baskının halen satışta olması ayrı ve zamana duyarlı bir bilgidir; katalog “baskı var” ile “stokta” durumunu karıştırmamalı.

## Hangileri belirsiz kalmalı ve uluslararası kapakla tutulmalı?

### Takeaway

Aşağıdaki 13 eserde bu araştırma sırasında tam Türkçe baskı künyesi doğrulanamadı. Bu sonuç “Türkçe çevirisi yok” anlamına gelmez. Katalogda bunlar uluslararası kapakla ve `translationStatus: unverified` benzeri bir durumla tutulmalı; kırmızı çarpı yalnızca yayıncı veya kütüphane kaydıyla yokluk kesin biçimde belgelenebiliyorsa kullanılmalı.

### Cited Findings

| Eser | Güvenle kullanılabilecek uluslararası kayıt | Türkçe durumuna ilişkin karar |
|---|---|---|
| The Mom Test | [Simon & Schuster / Authors Equity](https://www.simonandschuster.net/books/The-Mom-Test/Rob-Fitzpatrick/9798893312560) | Türkçe ISBN, yayınevi ve çevirmen birlikte doğrulanmadı; belirsiz |
| Disciplined Entrepreneurship | [Wiley](https://uat.store.wiley.com/en-us/disciplined-entrepreneurship-24-steps-to-a-successful-startup-p-9781118692288) | Belirsiz |
| Testing Business Ideas | [Wiley Strategyzer serisi](https://www.wiley.com/en-us/shop/the-strategyzer-series-c-5176) | Türkçe özet sayfaları baskı kanıtı değildir; belirsiz |
| Founding Sales | [Resmi eser sitesi](https://www.foundingsales.com/) | Belirsiz; önce İngilizce ISBN/yıl da tamamlanmalı |
| Obviously Awesome | [Resmi yazar sayfası](https://www.aprildunford.com/books) | Türkiye mağazasında İngilizce e-kitap bulunması Türkçe çeviri kanıtı değildir; belirsiz |
| 7 Powers | [Resmi eser sitesi](https://7powers.com/) | Belirsiz; arama sırasında bulunan benzer Türkçe başlıklar aynı eser değil |
| Traction | [Penguin Random House](https://www.penguinrandomhouse.com/books/319121/traction-by-gabriel-weinberg-and-justin-mares/) | Belirsiz |
| The Great CEO Within | [Resmi Mochary Method sayfası](https://mocharymethod.org/the-great-ceo-within/) | Belirsiz |
| Who: The A Method for Hiring | [Resmi eser sayfası](https://whothebook.com/order/) | Belirsiz |
| Secrets of Sand Hill Road | [Penguin Random House](https://www.penguinrandomhouse.com/books/607128/secrets-of-sand-hill-road-by-scott-kupor-foreword-by-eric-ries/) | Belirsiz |
| Monetizing Innovation | [Wiley](https://uat.store.wiley.com/en-us/monetizing-innovation-how-smart-companies-design-the-product-around-the-price-p-9781119240884) | Belirsiz |
| The Cold Start Problem | [Yayıncı baskı künyesi](https://andrewchen.com/wp-content/uploads/2022/01/ColdStartProb_9780062969743_AS0928_cc20_Final.pdf?trk=public_post_comment-text) | Türkçe özet sayfaları yayımlanmış Türkçe baskı kanıtı değildir; belirsiz |
| Thinking in Bets | [Penguin Random House](https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/) | Aramada görülen Türkçe başlıklı satış sayfası İngilizce baskıyı listeliyor; belirsiz |

### Inferences

- Bir Türkçe başlıkla hazırlanmış özet, blog yazısı veya otomatik çevrilmiş mağaza arayüzü çeviri baskısı kanıtı sayılmamalı. Tam olumlu karar için en az Türkçe ISBN + yayınevi, tercihen çevirmen ve yayın tarihi birlikte aranmalı.
- “Bulunamadı” durumunu kullanıcı arayüzünde “çeviri yok” olarak göstermek epistemik olarak yanlış olur. Belirsiz durum görünür olacaksa nötr çizgi kullanılmalı; ancak kullanıcının son yönlendirmesi doğrultusunda araştırma tamamlandıkça her kayıt ya doğrulanmış Türkçe baskıya ya da güçlü yokluk kanıtına bağlanmalıdır.

### Gaps

- Türkiye ISBN Ajansı veya Milli Kütüphane için toplu ve güvenilir bir arama uç noktası bulunmadan negatif doğrulama zayıf kalır.
- Özellikle `The Mom Test`, `Disciplined Entrepreneurship`, `Testing Business Ideas`, `Traction` ve `Thinking in Bets` için yayınevi katalogları, ISBN veri tabanları ve büyük kütüphane kataloglarında ikinci tur arama gerekir.
- Bu araştırma hiçbir eser için “Türkçe çevirisi kesinlikle yok” iddiası üretmedi.

## Hangi kaynak URL'leri kalıcı katalog provenance'ı için uygun?

### Takeaway

Kalıcı provenance için önce yayıncı/yazar sayfası, sonra ulusal veya kurumsal bibliyografik katalog, en son uzman perakendeci kullanılmalı. Arama sonucu URL'leri, stok sayfaları ve özet siteleri kalıcı kaynak olarak yazılmamalı. Her baskı kaydı `sourceUrl`, `sourceType`, `checkedAt`, `isbn`, `language` ve mümkünse `edition` alanlarıyla saklanmalı.

### Cited Findings

| Kaynak sınıfı | Önerilen kalıcı URL örnekleri | Kullanım |
|---|---|---|
| Resmi İngilizce yayıncı | [Wiley — Business Model Generation](https://uat.store.wiley.com/en-us/business-model-generation-a-handbook-for-visionaries-game-changers-and-challengers-p-9780470876411), [PRH — Profit First](https://www.penguinrandomhouse.com/books/549696/profit-first-by-mike-michalowicz/), [PRH — Thinking in Bets](https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/) | Birincil eser/baskı kimliği, tarih ve ISBN |
| Resmi yazar veya eser sitesi | [Founding Sales](https://www.foundingsales.com/), [7 Powers](https://7powers.com/), [The Great CEO Within](https://mocharymethod.org/the-great-ceo-within/) | Eser-yazar kimliği; ISBN görünmüyorsa tek başına tam künye sayılmaz |
| Resmi Türkçe yayıncı | [Timaş — Müşteriniz Ne İster?](https://timas.com.tr/musteriniz-ne-ister), [Pegasus — Aykırılar](https://pegasusyayinlari.com/kitap_detay.php?kitapid=15766668457) | Türkçe başlık, yayınevi, çevirmen, ISBN ve tarih |
| Kurumsal bibliyografik katalog | [Open British National Bibliography — The Outsiders](https://obnb.uk/p16253709-the-outsiders-eight-unconventional-ceos-and-their-radically-rational-blueprint-for-success), [Open Library — The Cold Start Problem](https://openlibrary.org/books/OL34688593M/Cold_Start_Problem) | Yayıncı sayfası yoksa veya baskı geçmişini ikinci aşamada doğrulamak için |
| Perakendeci / uzman kitapçı | [Kitapyurdu — Önce Kar](https://www.kitapyurdu.com/kitap/once-kar/612937.html?publisher_id=10230), [Scala — İş Modeli Üretimi](https://www.scalakitapci.com/is-modeli-uretimi), [Kitap ve Kahve — “Evet” Dedirtme Sanatı](https://www.kitapvekahve.com/evet-dedirtme-sanati) | Yayıncı sayfası bulunmadığında geçici provenance; yayıncı kaydı bulununca ikincil kaynak olarak korunabilir |

### Inferences

- Katalogda eser düzeyi ile baskı düzeyi provenance ayrılmalı. Örneğin `workSourceUrl` özgün eseri, `editionSourceUrl` belirli Türkçe ISBN'yi kanıtlar.
- Bir baskı için iki aşamalı doğrulama, iki farklı sayfanın aynı ISBN + yazar + özgün ad üçlüsünde birleşmesiyle otomatikleştirilebilir. Çevirmen uyuşmazlığı varsa kayıt insan incelemesine ayrılmalı.
- URL'nin kalıcı olması kadar, hangi alanı kanıtladığının saklanması da önemlidir. Tek bir URL tüm metadata alanlarının kanıtı gibi kullanılmamalı.

### Gaps

- Wiley bağlantıları şu anda resmi `uat.store.wiley.com` alanında çalışıyor; üretim `wiley.com` ürün URL'leri bulunursa katalog provenance'ı onlara taşınmalı.
- Perakendeci sayfaları stoktan kalkınca silinebilir. `checkedAt` ile birlikte erişilen temel künye alanlarının yerel araştırma notunda korunması gerekir.
- Negatif çeviri kanıtı için açık, kalıcı ve toplu sorgulanabilir resmi bir Türkçe bibliyografik kaynak henüz belirlenmedi.
