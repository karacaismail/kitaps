# UX ve erişilebilirlik kontrolü

Kontrol tarihi: 28 Eylül 2026.

## Mobil düzen ve etkileşim

- 320 × 860 görünümde iki sütun: kartlar 148 px; yatay sayfa taşması yok.
- 1280 × 720 görünümde ortalanmış, en fazla 960 px uygulama alanı ve üç sütun.
- Mobil başlık, arama ve filtre boşlukları azaltıldı; kategori adları kartlarda kısaltıldı. Tam adlar erişilebilir etiketlerde ve detayda bulunur.
- Ana kategori 34 px görsel yüksekliğe, ek kategori sayacı 28 px görsel yüksekliğe sahiptir; tıklanabilir alanları 44 px yüksekliğindedir.
- Metinler en az 16 px; kategori yazısı ve simgeler ortalıdır.
- Mobil detay 90dvh yüksekliğinde alttan açılır. Tutamaç aşağı sürüklendiğinde kapanır. Sürüklemeye alternatif kapatma düğmesi, Escape ve tutamaca tıklama vardır.
- Panel kapandıktan sonra odak açan kitap kontrolüne döner. Tarayıcının Geri düğmesi açık kitabı kapatır.
- Azaltılmış hareket tercihi desteklenir; normal sekme/panel geçişleri kısa ease-in-out animasyonları kullanır.
- Yıldız Favoriler listesine ekler. Satın alma kontrolü yeşil olur ve kitap genel katalogdan kaybolmaz. Geri al bildirimi kartları yerinden oynatmaz.
- Sonraki sayfa, sayfaya git, filtre paneli, tema değiştirme, boş favorilerden kataloğa dönüş ve logodan filtresiz ana sayfaya dönüş kullanılarak kontrol edildi.

## WCAG 2.2 AA hedefi

Axe-core 4.13 ile WCAG 2 A/AA, 2.1 A/AA ve 2.2 AA etiketleri tarandı. Açık ve koyu temadaki kitap ayrıntıları, katalog, filtre paneli, okuma sırası ve Notlar sayfası incelendi. Son kitap ayrıntısı taramalarında iki temada da sıfır ihlal ve sıfır kararsız sonuç; koyu tema boş okuma sırası ve Notlar taramalarında da sıfır ihlal ve sıfır kararsız sonuç alındı.

Katalog/filtrede yatay konu listesinin görünüm dışında kalan kısmı bazı taramalarda otomatik kontrast hesabının kararsız sonuç vermesine neden oldu. Konu metni, seçili gösterge ve odak çizgileri ayrıca görsel olarak kontrol edildi. Kaynak bağlantılarının koyu tema renkleri düzeltildi; aktif sekmeler metin/rengin yanında alt çizgiyle belirtilir. Alan dışına taşan ikinci odak çerçevesi kaldırıldı; klavye odağı kontrolün içinde kalan belirgin çizgiyle gösterilir.

Klavye erişimi, odak dönüşü, dokunma alanları ve 320 px yeniden akış ayrıca kontrol edildi. Otomatik tarama, bütün WCAG başarı ölçütlerinin veya her ekran okuyucu/cihaz birleşiminin eksiksiz uygunluk sertifikası değildir. Gerçek iOS/Android cihazı ve ekran okuyucuyla kapsamlı kullanıcı testi bu kontrolün kapsamı dışındadır.

## Yenilenen mobil filtre (28 Eylül 2026)

- Uzun ve klavye açan çoklu açılır menüler, altı başlıklı bir filtre paneliyle değiştirildi. Her başlık ilk seçimi ve seçim sayısını gösterir; tam seçim listesi erişilebilir adında bulunur.
- Kategori, okuma durumu, künye, kaynak ve ödüller doğrudan seçim satırlarıdır. Yazar, küme ve alt küme listelerinde Türkçe karakterleri tanıyan arama vardır. Arama sonuçlarının dışında kalan seçimler de kaldırılabilir; kaldırma sonrası odak aramaya döner. Liste genişletme düğmesi son sayfada daraltma düğmesine dönüşerek odağı korur.
- Panel mobilde 90dvh yüksekliğinde açılır. Yalnızca içerik kayar; başlık, geri/kapat kontrolleri, sonuç sayısı ve uygulama düğmesi sabit kalır. Görsel viewport değişiklikleri izlenerek ekran klavyesi açıldığında panelin görünür alana sığması sağlanır.
- 320 × 760 ve 390 × 844 boyutlarında yatay taşma yok. 320 × 420 görünümde de alt eylemler görünür ve içerik kaydırılabilir. Altı ana başlık 320 × 760 görünümde birlikte görünür.
- Kapanış/Escape taslağı uygulamaz ve odağı filtreyi açan düğmeye geri verir. Uygulama okunabilir URL parametrelerini günceller. Çocuk + Kate DiCamillo seçimi tek kitapla doğrulandı.
- Kategori birleşimi 176, aynı iki kategorinin kesişimi 7 sonuç verdi. Küme değişince artık o kümeye ait olmayan alt seçim kaldırıldı. Hatalı yıl aralığında uygulama engellenir ve alanla ilişkili açıklama gösterilir.
- Form alanları odaklandığında mevcut kenar, 1 px kenarlık ve 1 px iç çizgiyle güçlenir; ikinci bir dış çerçeve çizilmez ve alanın ölçüsü değişmez. Seçim satırları aynı yaklaşımı kullanır. Sistem yüksek kontrast modunda gölge yerine içe çizilen odak çizgisi korunur.
- Altı filtre bölümü ile ana filtre ekranının son açık/koyu tema axe taramalarında sıfır ihlal ve sıfır kararsız sonuç alındı. Seçili kontroller, klavye odağı, 48 px seçim satırları ve sabit alt eylemler ayrıca kontrol edildi.
- Gerçek iPhone/Safari ekran klavyesi bu ortamda çalıştırılmadı; fiziksel cihaz testi hâlâ kapsam dışındadır.

## Kartlar ve satın alma bildirimi (28 Eylül 2026)

- Konu sekmeleri katalogdan kaldırıldı. “Kızım için” bağlantısı üstteki hızlı erişim alanına, Favoriler ve Kitaplığım bağlantılarının yanına taşındı; seçiliyken etkin sayfa durumu görünür ve ekran okuyucuya bildirilir.
- Karttan küme sayısı ve yıl satırı kaldırıldı. Çeviri göstergesi solda, italik yayınevi sağda ve aynı satırdadır; kategori satırı ikisinin altında tam genişliği kullanır. Ek kategori sayacı bulunan 320 px kartlarda kategori satırı bölünmez.
- Kitap adları kart genişliğinde ortalanır ve üstten başlayan sabit iki satırlık alan kullanır. Uzun adlar ikinci satırda üç noktayla kesilir; tek satırlık adlarda ikinci satırın yeri boş bırakılır. Böylece ayırıcı çizgi, yazar ve alttaki diğer bilgiler aynı kart satırında hizalı kalır. Kitap adı ile yazar arasında ortalanmış, iki piksellik kısa bir ayırıcı çizgi bulunur. Çizginin üst ve alt boşluğu eşit 16 px'tir; önceki boşlukların iki katıdır. Çizgi masaüstünde 72 px, 320 px kartlarda 52 px genişliğindedir ve tema renginin saydam tonunu kullanır.
- Kapak alanı kart genişliğine bağlı 9:16 oranındadır. Kapaklar kendi oranları korunarak bu alana sığar; sağdaki düğmelere ayrı sütun ayrılmaz ve düğmeler kapağın üzerinde yüzde 75 opaklıkla görünür. Masaüstünde fare kartın üzerine geldiğinde veya klavye odağı kartın içindeyken açılır; dokunmatik ekranda görünür kalır. Odaklanan düğme tamamen opaktır.
- Çocuk etiketi açık ve koyu temada pembe tonlarını kullanır. Kartta ve kitap ayrıntısında yalnızca “Çeviri” yazısı bulunur; doğrulanmış Türkçe çeviri turkuaz onay, kaynağıyla doğrulanmış çeviri yokluğu kırmızı çarpı, doğrulanamayan durum yatay çizgiyle gösterilir. Durum simgesi, kendi rengiyle çizilmiş 28 px tam yuvarlak çerçeve içindedir. Açılan açıklama, doğrulanamamış bilgiyi çeviri yokluğundan ayırır. Özgün dili Türkçe olarak doğrulanmış eserlerde çeviri metni, simgesi, çevirmen satırı ve çeviri rehberi gösterilmez.
- Satın alma ipucu “Satın aldım” olarak kısaltıldı. “Kütüphanene eklendi” bildirimi mobilde 22 px, geniş ekranda 24 px başlıkla gösterilir. Bildirim 8 saniye sonra kapanır; üzerinde fare veya klavye odağı varken süre durur. Geri alma ve kapatma kontrolleri bulunur.
- Bildirim kartları yerinden oynatmaz. Kitap ayrıntısı açıkken bildirim panelin içinde kalır; geri alma sonrasında odak satın alma düğmesine döner. Bildirim, sıradaki klavye odağını örtecekse kapanır.
- Açık temanın sayfa zemini serin gri `#f2f4f6`, içerik yüzeyleri beyazdır. Zemindeki 22 px aralıklı nokta deseni yüzde 15 opaklıkla ayrı bir dekoratif katmanda yer alır; koyu temada sıcak açık nokta tonu kullanılır.
- Kitaba özgü baskı notları ayrıntıda kalır. Genel “Çeviri seçme rehberi” içeriği her kitapta tekrarlanmak yerine altbilgideki “Genel bilgiler” bağlantısından açılan erişilebilir bir pencerede sunulur; “Kaynaklar ve notlar” da aynı global bağlantı grubundadır.
- Son 320 px açık ve koyu tema katalog taramalarında sıfır axe ihlali alındı. Yatay konu listesinin kısmen görünüm dışında kalması açık temada bir, koyu temada üç otomatik kontrast kararsız sonucu üretti; ilgili metinler görsel olarak kontrol edildi. İki genişlikte yatay taşma yok; sağ hizalar, kategori renkleri, ortalanmış kitap adları ve tek kenarlı alan odağı kontrol edildi. Bildirimin otomatik kapanması, geri alma ve panel içindeki kullanımı ayrıca doğrulandı.

## Veri ve otomatik testler

31 otomatik test geçti. Bunlar kaynakların birleşmesi, eski kişisel verinin taşınması, yedekler, satın alma/favori davranışı, beş kitaplık sıra, okuma ilerlemesi, önerilerin döngü içermemesi, İngilizce URL'ler ve kapak/baskı tutarlılığını kapsar.

- 718 kitap; 707 seçili yerel kapak dosyası.
- Kapakların kaynak URL'leri ve varsa ISBN kontrol basamakları doğrulandı.
- 122 baskı künyesi araştırma kaydı; 105'inde çevirmen adı. Kaynak türleri: 30 yayınevi, 2 yayınevi önizlemesi, 1 kütüphane, 89 kitapçı.
- Kullanıcının talebiyle Claude Code üzerinden beş araştırma turu yapıldı. Son 98 eksik çevirmen kaydı için kaynak sayfaları ayrıca tarandı; sonuçlar doğrudan kesin bilgiye çevrilmedi.
- Çevirmen künyesi ile çeviri niteliği ayrı tutuldu. Metinler arasında yapılmamış kalite karşılaştırmaları yapılmış gibi sunulmaz.
- Çocuk kitapları için son kontrolde 11 çevirmen künyesi daha eklendi. Despero için Gözde Koca, Şamatalı Köy için Ali Arda ve Savaş Atı romanı için Arif Cem Ünver yayınevi kaynaklarıyla doğrulandı. Şeker Portakalı için Can Yayınları önizlemesi Portekizceden Emrah İmre çevirisini doğruladı.
- Bir Şeftali Bin Şeftali için tutarsız kaynak eşleşmesi Çınar Yayınları kapağıyla düzeltildi; Savaş Atı için resimli uyarlama yerine romanın kapağı seçildi.
- Etkin Yöneticilik için farklı bir çalışma kitabına ait Türkçe kapak eşleşmesi kaldırıldı; özgün eserin kapağı ve açıklama kullanıldı.
- Etkili İnsanların 7 Alışkanlığı ve İknanın Psikolojisi için çelişkili çevirmen kayıtları kesin isim yerine uyarıyla gösterilir.

## Kaynağı belirsiz 11 kayıt

Bilimin Yıldızları seti; Robinson Crusoe çocuk uyarlaması; Define Adası çocuk uyarlaması; Masal Masal İçinde; Dede Korkut çocuk uyarlaması; Anadolu Masalları; Arkadaşım Balina; Kar Tanesi Masalı; Kaplumbağa Terbiyecisi; Dostluk Ekmeği; Plastik Deniz.

Bu kayıtlarda yazar-eser eşleşmesi veya belirli uyarlama/baskı tanımı kesinleşmedi. Rastgele aynı adlı bir kitabın kapağı eklenmedi. Ayrıntılı gerekçeler `data/source-issues.json` içinde ve kitap panelindedir.

## Yayın ve geri dönüş

Eski Kitaps deposunun 18 izlenen dosyası `legacy/b1d060c/` altında byte düzeyinde korunur; eski commit geçmişi yeniden yazılmadı. GitHub Actions her yayında test ve derleme çalıştırır. Bir önceki sürüm Git geçmişinden yeniden yayımlanabilir. Kişisel kayıtlar tarayıcıda tutulur; yayın dosyaları kişisel okuma kayıtlarını içermez.
