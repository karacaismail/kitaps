# ADR 001: Okuma önceliği ve cihazlar arası durum

## Karar

Uygulama mevcut React görünüm katmanını korur. Aynı ekranda Alpine.js eklemek yerine, iş kurallarını TypeScript sınıflarında ve React dışındaki saf modüllerde tutar.

- **Model:** `UserBookState`, `CatalogReadingProfile` ve `ReadingPriorityEngine` sahiplik, okuma durumu ve katalog sinyallerini değerlendirir.
- **ViewModel:** `ReadingRankingViewModel`, görünümün kullanacağı sıralı listeyi ve kitap kimliğine göre sonuç haritasını üretir.
- **View:** React bileşenleri puanı, sıra numarasını, olgunluk düzeyini ve her ölçütün kanıtını gösterir.
- **Repository:** `GitHubStateRepository`, `kitaps-state/state.json` dosyasını GitHub Contents API üzerinden okur ve yazar.
- **Batcher:** `GitHubStateBatcher`, her değişikliği önce kalıcı yerel kuyruğa alır ve uzak yazımları en az 120 saniye boyunca biriktirir.

Bu ayrım MVC ve MVVM sorumluluklarını birlikte uygular: etki alanı modeli React'tan bağımsızdır; ViewModel ekran verisini hazırlar; Repository uzak depolamayı soyutlar.

## Okuma önceliği politikası

Varsayılan sıralama okuma önceliğidir. Satın alma durumu tek başına hedef değildir. Motor sekiz ölçüt kullanır:

1. Editoryal uzlaşma
2. Öğrenme kaldıracı
3. Erişim hazır oluşu
4. Okuma ivmesi
5. Sıra taahhüdü
6. Koleksiyon kapsamı
7. Zorluk uyumu
8. Kalıcılık

Sahip olunan ve okunmamış kitap erişim avantajı kazanır. Okunmakta olan kitap, sıradaki kitaptan önce gelir. Okunmuş fakat sahip olunmayan kitap yeniden okuma için düşük öncelik alır. Katalogdaki kitaplar eklenince veya çıkarılınca katalog ölçütleri yeniden normalize edilir ve bütün kitaplar tekrar sıralanır.

## Durum deposu

`karacaismail/kitaps-state` ikinci ve zorunlu uzak durum deposudur. Proje ve kullanıcı durumu bilinçli olarak herkese açıktır. Favoriler, sahiplik ve okuma durumları, beş kitaplık sıra, başlangıç ve bitiş tarihleri, sayfa ilerlemesi ile okuma notları `state.json` içinde tutulur; her cihaz bu dosyayı anahtarsız okuyabilir. Arayüz bu görünürlüğü bağlantı alanında açıkça belirtir. Yazma için yalnız bu depoya Contents izni olan fine-grained GitHub anahtarı gerekir; anahtar tarayıcının yerel alanından çıkmaz ve istek gövdesine yazılmaz.

Her kitap kaydı kendi `updatedAt` değeriyle birleştirilir. Eş zamanlı cihaz güncellemelerinde son yazılan kitap kaydı kazanır. Başarısız veya yarıda kalan yazımlar yerel kuyrukta kalır. İstemci ilk değişiklikten sonra en az 120 saniye bekler ve biriken kayıtları tek GitHub güncellemesinde gönderir.

## Sonuçlar

- Sıralama açıklanabilir ve test edilebilir.
- Sahiplik ile okuma durumu birbirinden bağımsız kalır.
- Telefon ve bilgisayar aynı GitHub durumunu görür.
- Her kullanıcı hareketi için ayrı GitHub commit'i oluşmaz.
- Yeni bir sıralama politikası, görünüm bileşenlerini değiştirmeden eklenebilir.
