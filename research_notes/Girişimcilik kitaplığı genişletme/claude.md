# Girişimcilik kitaplığı genişletme: bağımsız değerlendirme

Hazırlayan: Claude (bağımsız araştırma turu) · Tarih: 28 Eylül 2026
Girdiler: iki yapıştırılmış metin (bundan sonra **Metin A**: ChatGPT'nin 25 kitaplık müfredatı, **Metin B**: o müfredata yazılmış eleştiri ve alternatif liste) ve `src/catalog.json` (718 kitap, 28 Eylül 2026 sürümü).
Repo dosyalarında değişiklik yapılmadı. Bu not yalnızca öneri niteliğindedir.

---

## 0. Özet ve sayılar

| Ölçü | Değer |
|---|---|
| İki metinde önerilen benzersiz kitap | **36** (Metin A: 27, Metin B'nin eklediği: 9) |
| Bunlardan katalogda zaten bulunan | **17** |
| Katalogda bulunmayan | **19** |
| Bu 19 kitaptan eklenmesini önerdiğim | **17** (dışarıda kalanlar: *Secrets of Sand Hill Road*, *The Great CEO Within*) |
| Metinlerde geçmeyen, benim araştırmayla eklediğim | **12** |
| **Eklenecek kitap sayısı** | **29** |
| Katalogdan girişimcilik listesine alınan mevcut kitap | **47** (17'si metinlerden, 30'u katalogdaki diğer kitaplardan) |
| **Önerilen toplam girişimcilik listesi** | **76 kitap** (23 core, 32 advanced, 21 optional) |

100'e bilerek tamamlanmadı. 76'dan sonra aklıma gelen adayların her biri ya mevcut bir kitabı tekrar ediyordu ya da ABD'deki VC/SaaS dünyasına fazla bağlıydı ya da kalitesi tartışmalıydı (bkz. bölüm 6). Türkiye'ye özgü tahsilat, çek/senet, kur riski ve enflasyon muhasebesi için güçlü bir kitap bulamadım. Bu boşluğu zayıf bir kitapla kapatmak yerine açıkça işaretledim (bölüm 7). Kalan 24 slot, bu boşluklar için yapılacak ayrı bir doğrulama turuna ayrılabilir.

---

## 1. Kaynak metinlerden çıkarılanlar

### 1.1 Metin A: öneriler ve öğrenme mekanizmaları

**Ana tez:** "Hangi kitabı okuyayım" sorusu yerine "işletmenin hangi mekanizmalarını hangi sırayla öğrenmeliyim" sorusu sorulmalı.

**Zincir:** Problem → müşteri → değer önerisi → ürün/hizmet → satış → gelir → birim ekonomi → tekrar edilebilir dağıtım → operasyon → ekip → stratejik avantaj → ölçek → sermaye.

**Aşamalar ve kitaplar (27 benzersiz başlık):**

| Aşama | Kitaplar | Metnin istediği çıktı |
|---|---|---|
| 1. Müşteri problemi | The Mom Test; Competing Against Luck; Disciplined Entrepreneurship | ICP, problem, alternatif çözüm, satın alma nedeni ve sıklığı, ödeme isteği, karar verici ile kullanıcıyı ayırmak; **30-50 gerçek müşteri görüşmesi** |
| 2. Değer önerisi ve iş modeli | Business Model Generation; Value Proposition Design; Testing Business Ideas | Gelir modeli, fiyatlandırma, brüt marj, kanal, segment, maliyet yapısı, geçiş maliyeti |
| 3. Satış | Founding Sales; SPIN Selling; Obviously Awesome; Never Split the Difference | Lead → qualification → discovery → demo → teklif → müzakere → kapanış → onboarding → genişleme → yenileme hattının her adımını ölçmek |
| 4. Finans | Financial Intelligence for Entrepreneurs; Simple Numbers, Straight Talk, Big Profits | Ciro, brüt kâr/marj, FAVÖK, nakit akışı, işletme sermayesi, burn, runway, CAC, LTV, geri ödeme süresi, katkı payı, churn; kurucunun kendi P&L modelini kurması |
| 5. Strateji | Good Strategy/Bad Strategy; Playing to Win; 7 Powers; The Innovator's Dilemma | "Rakip ürünümü kopyalarsa müşteri neden yine beni seçer?" sorusuna "daha kaliteliyiz" dışında bir cevap verebilmek |
| 6. Dağıtım ve büyüme | Traction; Crossing the Chasm; How Brands Grow | Kanalın tekrar edilebilir, ölçülebilir ve ölçeklenebilir olması |
| 7. Operasyon | High Output Management; The Goal; The Great CEO Within | Süreç, throughput, darboğaz, delegasyon, KPI, toplantı ritmi, hesap verebilirlik, karar hakları; "işi insanlar değil süreçler yapar" dönüşümü |
| 8. Organizasyon ve liderlik | The Hard Thing About Hard Things; Who; Radical Candor | İşe alma, işten çıkarma, teşvik, ücret, organizasyon tasarımı |
| 9. Sermaye | Venture Deals; Secrets of Sand Hill Road | Term sheet, tasfiye tercihi, sulandırma, değerleme, opsiyon havuzu, SAFE; "iyi şirket ≠ VC'lik şirket" |

**Diğer öğrenme mekanizmaları:**
- Okuma ile sahayı iç içe yürütmek: "3 kitap → sahaya çık" döngüsü; **%20 okuma, %80 gerçek iş problemi**.
- Döngü: Read → Model → Execute → Measure → Reflect → Correct.
- 12 çekirdek disiplin (müşteri psikolojisi, müşteri keşfi, ürün, satış, pazarlama/dağıtım, fiyatlandırma, finans, strateji, operasyon, organizasyon, müzakere, sermaye dağıtımı). Bunların üstünde üç yatay yetenek (analitik düşünme, iletişim, belirsizlik altında karar) ve bir meta yetenek: muhakeme (judgment).
- Beş gelişim seviyesi: Entrepreneur → Operator → Manager → Strategist → Capital Allocator.
- On kitaplık omurga: Mom Test → Competing Against Luck → Disciplined Entrepreneurship → Founding Sales → Obviously Awesome → Financial Intelligence for Entrepreneurs → Good Strategy/Bad Strategy → 7 Powers → High Output Management → Venture Deals.

**Kaynak notu:** Metin A, YC, Sequoia ve Stripe'a atıf yapıyor (ör. "Stripe'ın Temmuz 2026 tarihli rehberi"). Atıflar `:chatgpt-content-reference` yer tutucularıyla verilmiş ve metinde doğrulanabilir bağlantı yok. Kitap seçimini etkilemedikleri için bu turda doğrulamadım ve kanıt olarak kullanmadım.

### 1.2 Metin B: eleştiriler ve alternatif liste

**Eleştiriler:**
1. Zincir fazla doğrusal kurulmuş. Gerçekte süreç bir döngü: fiyat değer önerisini, nakit sıkışıklığı stratejiyi değiştirir.
2. Liste ABD/VC/B2B SaaS merkezli. Türkiye için kritik mekanizmalar listede yok: enflasyonda nakit, tahsilat/vade, çek/senet, kur riski, KOBİ müşterisinin satın alma davranışı, SGK/vergi yükünün birim ekonomiye etkisi.
3. Metin A kendi modelini kitaplarla desteklemiyor: Capital Allocator seviyesi, fiyatlandırma ve kurucu ortaklık için hiç kitap yok.
4. Bazı seçimler hedefe uymuyor: *How Brands Grow* (FMCG verisi), *Never Split the Difference* (taktik), *The Innovator's Dilemma* (yerleşik şirketler), *Secrets of Sand Hill Road* (ABD VC'si).
5. Kaynak atıfları doğrulanamıyor.
6. 25 kitaplık bir liste, okumayı sahaya çıkmayı erteleme aracına dönüştürebilir.

**Önerilen mekanizma:** Sabit bir okuma sırası yerine **darboğaza göre okuma**. Bu, Kısıtlar Teorisi'nin öğrenmeye uygulanması: her çeyrek "şirketi şu an en çok ne sınırlıyor?" diye sorulur, o darboğaz için 1-2 kitap okunur, hemen uygulanır ve ölçülür.

**Metin B'nin eklediği 9 kitap:** The Personal MBA, Monetizing Innovation, Profit First, The Cold Start Problem, The E-Myth Revisited, The Founder's Dilemmas, Negotiation Genius, The Outsiders, Thinking in Bets.
**Bilinçli olarak çıkardıkları:** How Brands Grow, Secrets of Sand Hill Road, SPIN Selling, The Innovator's Dilemma.
**Kitap dışı mekanizmalar:** birincil belgeler (S-1, Berkshire mektupları), kendi P&L'ini, nakit projeksiyonunu ve birim ekonomisini kurmak, 4-6 kurucudan oluşan akran grubu, 6 ay sonra geri dönülen karar günlüğü.

### 1.3 İki metin hakkındaki görüşüm

- **Katıldığım noktalar:** darboğaza göre okuma, fiyatlandırma, ortaklık ve sermaye dağıtımı boşlukları, VC ağırlığının azaltılması, *Secrets of Sand Hill Road*'un gereksizliği (katalogdaki *Venture Deals* ve *The Power Law* bu işi zaten görüyor), *Negotiation Genius*'un Voss'tan daha yapısal olması.
- **Kısmen katılmadığım noktalar:**
  - *How Brands Grow* B2C KOBİ'ler (gıda, perakende, e-ticaret) için hâlâ değerli; zihinsel ve fiziksel erişilebilirlik fikri aktarılabilir. Listeden atmadım, `optional` yaptım.
  - *SPIN Selling* orta ve büyük B2B siparişlerde (sanayi, toptan, kurumsal hizmet) Türkiye'de de doğrudan işe yarıyor. `advanced` olarak tuttum.
  - *Profit First* akademik bir kitap değil. Türkiye/KOBİ araştırma ajanı onu "formül tarzı" olduğu için elemeyi önerdi. Ben yine de `core` olarak tutuyorum, çünkü öğrettiği mekanizma (kârı ve vergiyi harcamadan önce ayırmak) KOBİ'de nakit disiplini için en kolay uygulanan araç. Yalnız Türkiye'de uyarlanması gerekiyor. Ayrılan fonların TL vadesiz hesapta beklemesi enflasyonda reel kayıp yaratır. Yüzdeleri ve rezervleri reel terimlerle düşünmek gerekir.
  - *The Cold Start Problem* herkes için değil. Yalnızca pazaryeri veya ağ etkili iş kuranlar için `advanced`.

---

## 2. Katalog eşleştirmesi (başlık + yazar)

Eşleştirmede başlık, yazar, `titleTr` ve `aliases` alanları tarandı. Benzer adlı farklı kitaplar ayrı tutuldu.

| # | Kitap (metindeki adıyla) | Yazar | Kaynak | Katalog durumu | Katalog id |
|---|---|---|---|---|---|
| 1 | The Mom Test | Rob Fitzpatrick | A | **Yok** | - |
| 2 | Competing Against Luck | Clayton Christensen vd. | A | **Yok** | - |
| 3 | Disciplined Entrepreneurship | Bill Aulet | A | **Yok** | - |
| 4 | Business Model Generation | Osterwalder & Pigneur | A | **Yok** | - |
| 5 | Value Proposition Design | Osterwalder vd. | A | **Yok** | - |
| 6 | Testing Business Ideas | Bland & Osterwalder | A | **Yok** | - |
| 7 | Founding Sales | Pete Kazanjy | A | **Yok** | - |
| 8 | SPIN Selling | Neil Rackham | A | Var | `spinselling` |
| 9 | Obviously Awesome | April Dunford | A, B | **Yok** | - |
| 10 | Never Split the Difference | Chris Voss | A | Var | `neversplitthedifference` |
| 11 | Financial Intelligence for Entrepreneurs | Berman & Knight | A, B | Var | `financialintelligenceforentrepreneurs` |
| 12 | Simple Numbers, Straight Talk, Big Profits | Greg Crabtree | A | Var | `simplenumbersstraighttalkbigprofits` |
| 13 | Good Strategy/Bad Strategy | Richard Rumelt | A, B | Var | `goodstrategybadstrategy` |
| 14 | Playing to Win | Lafley & Martin | A | Var | `playingtowin` |
| 15 | 7 Powers | Hamilton Helmer | A, B | **Yok** | - |
| 16 | The Innovator's Dilemma | Clayton Christensen | A | Var | `innovatorsdilemma` |
| 17 | Traction | Weinberg & Mares | A, B | **Yok** | - |
| 18 | Crossing the Chasm | Geoffrey Moore | A | Var | `crossingthechasm` |
| 19 | How Brands Grow | Byron Sharp | A | Var | `howbrandsgrow` |
| 20 | High Output Management | Andrew Grove | A, B | Var | `highoutputmanagement` |
| 21 | The Goal | Eliyahu Goldratt | A | Var | `goal` |
| 22 | The Great CEO Within | Matt Mochary | A | **Yok** | - |
| 23 | The Hard Thing About Hard Things | Ben Horowitz | A | Var | `hardthingabouthardthings` |
| 24 | Who: The A Method for Hiring | Smart & Street | A | **Yok** | - |
| 25 | Radical Candor | Kim Scott | A | Var | `radicalcandor` |
| 26 | Venture Deals | Feld & Mendelson | A, B | Var | `venturedeals` |
| 27 | Secrets of Sand Hill Road | Scott Kupor | A | **Yok** | - |
| 28 | The Personal MBA | Josh Kaufman | B | Var | `personalmbamastertheartofbusiness` |
| 29 | Monetizing Innovation | Ramanujam & Tacke | B | **Yok** | - |
| 30 | Profit First | Mike Michalowicz | B | **Yok** | - |
| 31 | The Cold Start Problem | Andrew Chen | B | **Yok** | - |
| 32 | The E-Myth Revisited | Michael Gerber | B | Var | `emythrevisited` |
| 33 | The Founder's Dilemmas | Noam Wasserman | B | Var | `foundersdilemmas` |
| 34 | Negotiation Genius | Malhotra & Bazerman | B | **Yok** | - |
| 35 | The Outsiders | William Thorndike | B | **Yok** | - |
| 36 | Thinking in Bets | Annie Duke | B | **Yok** | - |

**Karışabilecek adlar:**
- Katalogdaki `financialintelligence` (*Financial Intelligence: A Manager's Guide…*, Berman & Knight) ile `financialintelligenceforentrepreneurs` iki ayrı kitaptır. Metinlerin önerdiği ikincisidir.
- **"Traction" adında iki farklı kitap var:** Weinberg & Mares (dağıtım kanalları, önerilen) ve Gino Wickman'ın *Traction: Get a Grip on Your Business* kitabı (EOS işletim sistemi, eklenmedi).
- Katalogdaki `gettingtoyes` kaydının `titleTr` değeri "\"Evet\" Dedirtme Sanatı…". Aynı Türkçe ad, *Negotiation Genius*'un Koridor baskısında da kullanılıyor (bkz. madde 24). Türkçe eşleştirme mutlaka yazar ve ISBN ile yapılmalı.

---

## 3. Seçim ilkeleri

1. **Mekanizma temelli:** Her kitap listeye belirli bir mekanizma için alındı ve listedeki başka bir kitabın yerini tutmamalı. Birbirinin tekrarı olan kitaplardan biri seçildi.
2. **Aktarılabilirlik:** Kitap ABD'de, SaaS alanında veya VC ekosisteminde yazılmış olsa bile mekanizması KOBİ'ye, öz kaynakla büyüyen işletmeye, aile şirketine ve yüksek enflasyon/kur ortamına aktarılabilmeli. Aktarım sınırlıysa bunu "uyarı" alanında belirttim.
3. **Öncelik tanımları:**
   - `core`: sektörden bağımsız olarak her kurucu için omurga.
   - `advanced`: belirli bir aşamada ya da darboğazda yüksek getirili.
   - `optional`: tamamlayıcı ya da belirli bir iş modeline özgü.
4. **Türkçe baskı:** Yalnızca yayınevi sayfası veya perakende kaydında **yazar, özgün ad ve ISBN birlikte** görüldüyse "doğrulandı" dedim. Bulunamayanlar için "bulunamadı" yazdım ve arama kapsamını belirttim. Bu, Türkçe baskının olmadığı anlamına gelmez.
5. **Liste dengesi:** VC ve SaaS ağırlığını azaltmak için fiyatlandırma, nakit, KOBİ/bootstrapping, aile şirketi, gelişmekte olan pazar ve sermaye dağıtımı mekanizmalarına bilerek fazladan yer verdim.

---

## 4. Önerilen girişimcilik listesi (76 kitap)

### 4.1 Katalogda mevcut olup listeye alınan 47 kitap

"Kaynak" sütununda A/B, kitabın hangi metinde önerildiğini gösterir. "-" işaretli kitaplar metinlerde geçmiyor, bu değerlendirmede katalogdan seçildi.

| # | Katalog id | Kitap | Mekanizma | Öncelik | Kaynak |
|---|---|---|---|---|---|
| 1 | `personalmbamastertheartofbusiness` | The Personal MBA | İşletmenin parçalarının haritası | core | B |
| 2 | `leanstartup` | The Lean Startup | Problem/müşteri: doğrulanmış öğrenme, MVP | core | - |
| 3 | `newbusinessroadtest` | The New Business Road Test | Problem/müşteri: pazar ve sektör çekiciliği testi | advanced | - |
| 4 | `innovationandentrepreneurship` | Innovation and Entrepreneurship (Drucker) | Değer önerisi: fırsatın yedi kaynağı | advanced | - |
| 5 | `spinselling` | SPIN Selling | Satış: büyük B2B siparişte keşif | advanced | A |
| 6 | `ultimatesalesmachine` | The Ultimate Sales Machine | Satış: KOBİ satış sistemi ve disiplini | optional | - |
| 7 | `influence` | Influence (Cialdini) | Satış: ikna ilkeleri | advanced | - |
| 8 | `positioning` | Positioning (Ries & Trout) | Konumlandırma: klasik çerçeve | optional | - |
| 9 | `thisismarketing` | This Is Marketing | Pazarlama: en küçük uygulanabilir pazar | optional | - |
| 10 | `howbrandsgrow` | How Brands Grow | Pazarlama: B2C erişilebilirlik (FMCG kanıtı) | optional | A |
| 11 | `sellingtheinvisible` | Selling the Invisible | Pazarlama: hizmet işletmesi | optional | - |
| 12 | `1windfall` | The 1% Windfall | Fiyatlandırma: fiyat kaldıracı ve fiyat artışı | advanced | - |
| 13 | `valuebasedfees` | Value-Based Fees | Fiyatlandırma: danışmanlık ve hizmet ücreti | optional | - |
| 14 | `financialintelligenceforentrepreneurs` | Financial Intelligence for Entrepreneurs | Finans: tabloları okumak | core | A, B |
| 15 | `simplenumbersstraighttalkbigprofits` | Simple Numbers, Straight Talk, Big Profits | Finans: KOBİ kârlılığı, işgücü verimliliği | core | A |
| 16 | `howtoreadafinancialreport` | How to Read a Financial Report | Finans: tablolar arası bağlantı, işletme sermayesi | optional | - |
| 17 | `greatgameofbusiness` | The Great Game of Business | Finans/operasyon: açık defter yönetimi | advanced | - |
| 18 | `emythrevisited` | The E-Myth Revisited | Operasyon: kurucudan bağımsız sistem | core | B |
| 19 | `goal` | The Goal | Operasyon: darboğaz ve TOC | core | A |
| 20 | `leanthinking` | Lean Thinking | Operasyon: değer akışı ve israf | advanced | - |
| 21 | `toyotaproductionsystem` | Toyota Production System | Operasyon: tam zamanında üretim, jidoka | optional | - |
| 22 | `streetsmarts` | Street Smarts | KOBİ: nakit, marj, alacak, fiyat pratikleri | core | - |
| 23 | `smallgiants` | Small Giants | KOBİ: büyümeyi seçmeme, bağımsızlık | advanced | - |
| 24 | `rework` | Rework | Bootstrapping: sade işletme | optional | - |
| 25 | `samwalton` | Sam Walton: Made in America | KOBİ: maliyet disiplini (vaka) | optional | - |
| 26 | `foundersdilemmas` | The Founder's Dilemmas | Ortaklık: hisse, kontrol ve zenginlik | core | B |
| 27 | `partnershipcharter` | The Partnership Charter | Ortaklık: ortaklık sözleşmesi süreci | core | - |
| 28 | `highoutputmanagement` | High Output Management | Ekip/yönetim: kaldıraç, ritim | core | A, B |
| 29 | `hardthingabouthardthings` | The Hard Thing About Hard Things | Ekip: kriz dönemi CEO kararları | advanced | A |
| 30 | `radicalcandor` | Radical Candor | Ekip: geri bildirim | advanced | A |
| 31 | `effectiveexecutive` | The Effective Executive | Ekip: yöneticinin zamanı ve kararı | advanced | - |
| 32 | `fivedysfunctionsofateam` | The Five Dysfunctions of a Team | Ekip: yönetim ekibi uyumu | optional | - |
| 33 | `gettingtoyes` | Getting to Yes | Müzakere: çıkar temelli pazarlık, BATNA | core | - |
| 34 | `bargainingforadvantage` | Bargaining For Advantage | Müzakere: hazırlık, kaldıraç, etik | advanced | - |
| 35 | `neversplitthedifference` | Never Split the Difference | Müzakere: taktik dinleme | optional | A |
| 36 | `goodstrategybadstrategy` | Good Strategy, Bad Strategy | Strateji: teşhis, yol gösterici ilke, tutarlı eylem | core | A, B |
| 37 | `playingtowin` | Playing to Win | Strateji: nerede oynanacak, nasıl kazanılacak | advanced | A |
| 38 | `competitivestrategy` | Competitive Strategy (Porter) | Strateji: sektör yapısı, beş güç | advanced | - |
| 39 | `coopetition` | Co-opetition | Strateji: değer ağı, tedarikçi ve ortakla oyun | advanced | - |
| 40 | `innovatorsdilemma` | The Innovator's Dilemma | Strateji: yıkıcı yenilik (yerleşik şirketi okumak) | optional | A |
| 41 | `blueoceanstrategy` | Blue Ocean Strategy | Strateji: değer eğrisi | optional | - |
| 42 | `8020principle` | The 80/20 Principle | Strateji: müşteri ve ürün kârlılığı analizi | optional | - |
| 43 | `superforecasting` | Superforecasting | Belirsizlik: kalibre tahmin | advanced | - |
| 44 | `thinkingfastandslow` | Thinking, Fast and Slow | Belirsizlik: yargı hataları | optional | - |
| 45 | `antifragile` | Antifragile | Belirsizlik: opsiyonellik, yedeklilik | optional | - |
| 46 | `venturedeals` | Venture Deals | Sermaye: yatırım sözleşmesi terimleri | advanced | A, B |
| 47 | `crossingthechasm` | Crossing the Chasm | Dağıtım: erken benimseyenden ana pazara | advanced | A |

### 4.2 Eklenecek 29 kitap

Her kayıtta şu alanlar var: exact English title, author, why, mechanism, priority, officialSourceUrl, Türkçe baskı.
"Doğrulandı" etiketinin iki düzeyi var:
- **(sayfa):** ilgili yayınevi veya perakende sayfasını bu turda doğrudan açtım.
- **(arama):** bilgi birden çok bağımsız perakende kaydında görüldü, ama tek bir sayfayı açıp tüm alanları teyit etmedim.

#### A. Metinlerde önerilen 17 kitap

**1. The Mom Test: How to Talk to Customers & Learn if Your Business is a Good Idea When Everyone is Lying to You**
- author: Rob Fitzpatrick
- priority: **core**
- mechanism: Problem/müşteri keşfi
- why: Müşteri görüşmesinde fikir sormak yerine geçmişteki somut davranışı sormayı öğretir. Böylece nezaketen verilen olumlu cevaplar ayıklanır. Metin A'nın 30-50 görüşme hedefinin uygulama aracı budur. Sektör ve ülkeden bağımsızdır, KOBİ satıcısı için de doğrudan kullanılır.
- officialSourceUrl: https://www.momtestbook.com/
- Türkçe baskı: **bulunamadı**. Arama kapsamı: yazar sitesindeki çeviri listesi (Türkçe yok), Kitapyurdu, D&R, idefix, Pandora ve Nadir Kitap'ta yalnızca İngilizce baskı satılıyor.

**2. Competing Against Luck: The Story of Innovation and Customer Choice**
- author: Clayton M. Christensen, Taddy Hall, Karen Dillon, David S. Duncan
- priority: **core**
- mechanism: Problem/müşteri (Jobs to Be Done)
- why: Müşterinin ürünü "hangi ilerleme için işe aldığını" sorar. Bu çerçeve, rakip olarak görünmeyen alternatifleri (Excel, telefon, bir çalışan) görünür kılar.
- uyarı: Örnekler büyük şirketlerin inovasyon ekiplerinden seçilmiş.
- officialSourceUrl: https://www.christenseninstitute.org/book/competing-against-luck/
- Türkçe baskı: **doğrulandı (arama)**. *İnovasyonda Ustalaşmak*, Optimist, ISBN 9786052261873. Çeviren Ümit Şensoy (ikincil kaynağa göre). Perakende kayıtlarında dört yazarın adı görülüyor. Pandora sayfası açıldığında yalnızca ISBN yüklendi. Kataloğa girmeden önce yayınevi sayfasıyla bir kez daha kontrol edilmeli.

**3. Disciplined Entrepreneurship: 24 Steps to a Successful Startup** (Expanded & Updated, 2nd ed., Wiley 2024)
- author: Bill Aulet
- priority: **core**
- mechanism: Problem → pazar → ürün → fiyat → CAC zincirinin adım adım kurulması
- why: Metin A'daki zincirin uygulamalı kitabı. Pazar segmentasyonu, "beachhead" pazar seçimi, persona, birim ekonomisi ve fiyat adımlarını tek bir iş planı altında toplar.
- officialSourceUrl: https://www.wiley.com/en-us/Disciplined+Entrepreneurship:+24+Steps+to+a+Successful+Startup,+Expanded+&+Updated,+2nd+Edition-p-9781394222513
- Türkçe baskı: **doğrulandı (arama), ancak 2013 tarihli ilk baskının çevirisi**. *Disciplined Entrepreneurship: Başarılı Startup İçin 24 Adım*, Türk Hava Yolları Yayınları. Ciltli baskı ISBN 9786053222781 (2015), karton kapak ISBN 9786052202029 (2018). 2024 genişletilmiş baskının çevirisi bulunamadı. Katalogda İngilizce baskı ile Türkçe baskı ayrı kayıtlar olarak işaretlenmeli.

**4. Business Model Generation: A Handbook for Visionaries, Game Changers, and Challengers**
- author: Alexander Osterwalder, Yves Pigneur
- priority: **core**
- mechanism: Değer önerisi ve iş modeli (dokuz bloklu kanvas)
- why: Gelir modeli, kanal, maliyet yapısı ve kilit ortakları tek sayfada ilişkilendirir. Birim ekonomisini hesaplamadan önce varsayımların nerede olduğunu görmeyi sağlar.
- officialSourceUrl: https://www.wiley.com/en-us/Business+Model+Generation%3A+A+Handbook+for+Visionaries%2C+Game+Changers%2C+and+Challengers-p-9780470876411
- Türkçe baskı: **doğrulandı (sayfa, kısmi)**. *İş Modeli Üretimi*, Optimist, ISBN 9786052202814, çeviren Levent Göktem, 2016. Kitapyurdu sayfasında yalnızca Osterwalder'ın adı var ve özgün ad belirtilmemiş, ancak içerik tanımı birebir örtüşüyor. Pigneur'ün Türkçe baskıda yer alıp almadığı yayınevi sayfasından teyit edilmeli.

**5. Founding Sales: The Early Stage Go-to-Market Handbook**
- author: Pete Kazanjy
- priority: **core** (B2B satan kurucular için)
- mechanism: Satış (kurucunun ilk tekrar edilebilir satış süreci)
- why: Satış kökenli olmayan kurucuya nitelendirme, keşif görüşmesi, fiyat konuşması ve ilk satış temsilcisini işe alma adımlarını öğretir. Türkiye'de KOBİ'ye B2B satan kurucu için de aktarılabilir.
- uyarı: Örnekler SaaS ağırlıklı. Tüketiciye satan işletmede önceliği düşer.
- officialSourceUrl: https://www.foundingsales.com/ (tam metin ücretsiz. Basılı baskı: ISBN 9781734505115, 2020)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu, D&R, idefix ve genel Türkçe arama.

**6. Obviously Awesome: How to Nail Product Positioning So Customers Get It, Buy It, Love It**
- author: April Dunford
- priority: **core**
- mechanism: Konumlandırma
- why: Konumlandırmayı adım adım bir sürece çevirir: gerçek rakip alternatifi, ayırt edici özellik, müşteri için değeri ve pazar kategorisi. Katalogdaki *Positioning* (Ries & Trout) kitabının uygulamaya dönük tamamlayıcısıdır.
- officialSourceUrl: https://www.aprildunford.com/books
- Türkçe baskı: **bulunamadı**. Arama kapsamı: yazar sitesi, D&R (yalnızca İngilizce ithal baskı), Türkçe başlık aramaları.
- Not: Araştırma ajanı yazar sitesinde genişletilmiş yeni bir baskının duyurulduğunu bildirdi. Ben baskı yılını ayrıca doğrulamadım. Katalog kaydında hangi baskının esas alınacağı ayrıca kontrol edilmeli.

**7. Profit First** (Revised & Expanded Edition, Portfolio/Penguin 2017. İlk baskı 2014'te yazarın kendi yayını. Alt başlık baskıya göre değişiyor)
- author: Mike Michalowicz
- priority: **core** (KOBİ)
- mechanism: Finans/nakit disiplini
- why: "Satış − Kâr = Gider" kuralıyla kârı, vergiyi ve sahibin payını harcamadan önce ayrı hesaplara aktarır. Metin B'nin işaret ettiği nakit disiplini boşluğunu en basit biçimde kapatır.
- Türkiye uyarlaması: Ayrılan fonlar TL vadesiz hesapta bekletilmemeli. Oranlar reel terimlerle belirlenmeli. Vergi ve SGK tahakkuk takvimi ayrı bir hesap olarak modellenmeli.
- officialSourceUrl: https://www.penguinrandomhouse.com/books/549696/profit-first-by-mike-michalowicz/
- Türkçe baskı: **doğrulandı (sayfa)**. *Önce Kâr*, Peta Kitap, ISBN 9786257232296, çeviren Gülfiza Balcı, 31 Mart 2022. Sayfada özgün ad "Profit First" olarak geçiyor.

**8. Traction: How Any Startup Can Achieve Explosive Customer Growth**
- author: Gabriel Weinberg, Justin Mares
- priority: **core**
- mechanism: Dağıtım/büyüme ("Bullseye" çerçevesi)
- why: 19 kanalı ucuz testlerle sıralar ve işe yarayan bir veya iki kanala odaklanmayı öğretir. Metin A'daki "tekrar edilebilir, ölçülebilir, ölçeklenebilir" dağıtım koşulunun uygulama yöntemidir. Bayi, fuar ve iş ortaklığı gibi KOBİ kanallarına da uygulanabilir.
- officialSourceUrl: https://www.penguinrandomhouse.com/books/319121/traction-by-gabriel-weinberg-and-justin-mares/
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu yazar araması, D&R ve Nadir Kitap'ta yalnızca İngilizce baskı. Gino Wickman'ın *Traction* kitabıyla karıştırılmamalı.

**9. Who: The A Method for Hiring**
- author: Geoff Smart, Randy Street
- priority: **core**
- mechanism: Ekip (işe alma)
- why: Pozisyon için sonuç odaklı bir "scorecard" hazırlanmasını, yapılandırılmış mülakatı ve referans kontrolünü öğretir. Küçük şirkette tek bir yanlış işe alımın maliyeti çok yüksektir. Katalogdaki *Hire With Your Head* kitabının yerine bunu öneriyorum.
- uyarı: Örnekler üst düzey işe alım ağırlıklı.
- officialSourceUrl: https://geoffsmart.com/books/who-the-a-method-for-hiring/
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu yazar araması. Araştırma sırasında öne sürülen "Kimi İşe Alalım" adına hiçbir kaynakta rastlanmadı. Bu ad kullanılmamalı.

**10. Thinking in Bets: Making Smarter Decisions When You Don't Have All the Facts**
- author: Annie Duke
- priority: **core**
- mechanism: Belirsizlik ve karar
- why: Karar kalitesini sonuç kalitesinden ayırmayı öğretir ("resulting" hatası). Metin A'nın meta yetenek dediği muhakeme ve Metin B'nin karar günlüğü önerisi için en pratik kitap budur. Kur ve talep oynaklığı yüksek bir ortamda doğrudan uygulanabilir.
- officialSourceUrl: https://www.penguinrandomhouse.com/books/552885/thinking-in-bets-by-annie-duke/
- Türkçe baskı: **doğrulandı (sayfa)**. *Bahse Var mısın?*, MediaCat Kitapları, ISBN 9786052314142, çeviren Taner Gezer, 4 Ocak 2019. Sayfada özgün ad "Thinking in Bets" olarak geçiyor.

**11. Value Proposition Design: How to Create Products and Services Customers Want**
- author: Alexander Osterwalder, Yves Pigneur, Gregory Bernarda, Alan Smith
- priority: **advanced**
- mechanism: Değer önerisi
- why: Müşterinin işleri, acıları ve kazançlarıyla ürünün acı gidericilerini ve kazanç yaratıcılarını eşleştirir. *Competing Against Luck* ile *Business Model Generation* arasında köprü kurar.
- officialSourceUrl: https://www.wiley.com/en-us/Value+Proposition+Design:+How+to+Create+Products+and+Services+Customers+Want-p-9781118968055
- Türkçe baskı: **doğrulandı (sayfa)**. *Müşteriniz Ne İster? Değer Önerisi Tasarımı ile Müşteri Odaklı Yönetim*, Timaş, ISBN 9786050822649, çeviren Cem Özdemir, 2016. Yayınevi sayfasında özgün ad "Value Proposition Design" olarak geçiyor.

**12. Testing Business Ideas: A Field Guide for Rapid Experimentation**
- author: David J. Bland, Alexander Osterwalder
- priority: **advanced**
- mechanism: Doğrulama/deney tasarımı
- why: 44 deneyi maliyet ve kanıt gücüne göre sıralar ve her birini test ettiği varsayımla eşleştirir. Böylece "önce ucuz kanıt, sonra yatırım" disiplini kurulur. Nakdi kısıtlı KOBİ için özellikle değerlidir.
- officialSourceUrl: https://www.wiley.com/en-us/Testing+Business+Ideas:+A+Field+Guide+for+Rapid+Experimentation-p-9781119551447
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Wiley, Strategyzer, Türkçe başlık denemeleri ve perakende aramaları.

**13. Monetizing Innovation: How Smart Companies Design the Product Around the Price**
- author: Madhavan Ramanujam, Georg Tacke
- priority: **advanced**
- mechanism: Fiyatlandırma (ürünü geliştirmeden önce ödeme isteğini ölçmek)
- why: Metin B'nin haklı olarak işaret ettiği fiyatlandırma boşluğunu kapatır. Paketleme, segment bazlı fiyat ve ödeme isteği görüşmesi yöntemlerini öğretir.
- uyarı: Örnekler B2B, teknoloji ve ilaç ağırlıklı. Mevcut ürünün yeniden fiyatlandırılmasından çok ilk fiyat tasarımıyla ilgilenir. Enflasyonda fiyat güncelleme konusu için bkz. madde 18 ve 19.
- officialSourceUrl: https://www.wiley.com/en-us/Monetizing+Innovation:+How+Smart+Companies+Design+the+Product+Around+the+Price-p-9781119240860
- Türkçe baskı: **bulunamadı**. Arama kapsamı: genel web ve Nadir Kitap (yalnızca İngilizce). Kitapyurdu ve D&R'da ayrıca arama yapılmadı, bu nedenle güven orta.

**14. The Cold Start Problem: How to Start and Scale Network Effects**
- author: Andrew Chen
- priority: **advanced** (yalnızca pazaryeri veya ağ etkili modeller için)
- mechanism: Dağıtım ve savunma (ağ etkisini ilk kurmak)
- why: İki taraflı pazarda "atomik ağ"ı kurmayı, sert tarafı (genellikle arzı) kazanmayı ve devrilme noktasını anlatır. Metin B'deki pazaryeri portföyü için doğrudan ilgilidir.
- uyarı: Silikon Vadisi tüketici teknolojisi örnekleri ağırlıklı.
- officialSourceUrl: https://www.coldstart.com/ (yayınevi: Harper Business, 2021)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu yazar araması, "Soğuk Başlangıç" aramaları.

**15. Negotiation Genius: How to Overcome Obstacles and Achieve Brilliant Results at the Bargaining Table and Beyond**
- author: Deepak Malhotra, Max H. Bazerman
- priority: **advanced**
- mechanism: Müzakere (yapı, bilgi asimetrisi, bilişsel yanlılıklar)
- why: Tedarikçi, bayi, büyük müşteri ve ortak pazarlıklarında değer yaratma ve değer paylaşma adımlarını araştırmaya dayalı bir yöntemle öğretir. Katalogdaki *Getting to Yes* kitabının sistematik devamıdır.
- officialSourceUrl: https://www.penguinrandomhouse.com/books/106602/negotiation-genius-by-deepak-malhotra-and-max-bazerman/
- Türkçe baskı: **doğrulandı (sayfa)**. *"Evet" Dedirtme Sanatı*, Koridor Yayıncılık, ISBN 9786054629725, çeviren Korkmaz Haktanır, 2014. D&R sayfasında yazar olarak Malhotra ve Bazerman görülüyor.
- **Uyarı:** Aynı Türkçe ad, Fisher ve Ury'nin *Getting to Yes* kitabı için de kullanılıyor (katalogda `gettingtoyes`). Kayıtlar yazar ve ISBN ile ayrılmalı.

**16. The Outsiders: Eight Unconventional CEOs and Their Radically Rational Blueprint for Success**
- author: William N. Thorndike Jr.
- priority: **advanced**
- mechanism: Sermaye dağıtımı (Capital Allocator seviyesi)
- why: Nakit akışı odağı, merkezsiz yönetim, hisse geri alımı ve disiplinli satın alma kararlarını sekiz CEO üzerinden anlatır. Metin A'nın tanımlayıp kitapsız bıraktığı beşinci seviyeyi karşılar.
- uyarı: Örnekler halka açık ABD şirketlerinden ve hayatta kalma yanlılığı riski taşıyor. KOBİ için okunacak ders şu: "Fazla nakdi nereye koyuyorum?" sorusu her dönem açıkça sorulmalı.
- officialSourceUrl: https://store.hbr.org/product/the-outsiders-eight-unconventional-ceos-and-their-radically-rational-blueprint-for-success/10344
- Türkçe baskı: **doğrulandı (sayfa)**. *Aykırılar: Sekiz Sıra Dışı CEO ve Tamamen Rasyonel Başarı Modelleri*, Pegasus Yayınları, ISBN 9786052998090, çeviren Nil Bosna, 9 Kasım 2019. Sayfada özgün ad tam olarak eşleşiyor.

**17. 7 Powers: The Foundations of Business Strategy**
- author: Hamilton Helmer
- priority: **advanced**
- mechanism: Strateji ve savunma (kalıcı üstünlük kaynakları)
- why: Yedi güç kaynağını (ölçek ekonomisi, ağ ekonomisi, karşı konumlanma, geçiş maliyeti, marka, ele geçirilmiş kaynak, süreç gücü) "fayda + engel" ölçütüyle tanımlar. Metin A'daki "rakip kopyalarsa ne olur?" sorusunun analitik aracıdır. KOBİ için özellikle geçiş maliyeti, süreç gücü ve yerel olarak ele geçirilmiş kaynak (lisans, lokasyon, tedarik ilişkisi) aktarılabilir.
- officialSourceUrl: https://7powers.com/buy-the-book/ (yayınevi: Deep Strategy LLC, 2016)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu yazar araması, "7 Güç" ve "Yedi Güç" aramaları.

#### B. Metinlerde geçmeyen, bu araştırmada eklenen 12 kitap

**18. Confessions of the Pricing Man: How Price Affects Everything**
- author: Hermann Simon
- priority: **core**
- mechanism: Fiyatlandırma (fiyatın kâr üzerindeki kaldıracı, fiyat psikolojisi, fiyat artışı)
- why: Fiyatın kârın en güçlü kaldıracı olduğunu Simon-Kucher'in kırk yıllık vakalarıyla gösterir. Türkçe baskısı olan ve KOBİ'ye doğrudan uygulanabilen en güçlü fiyatlandırma kitabıdır. Katalogdaki *The 1% Windfall* ile birlikte fiyatlandırma omurgasını oluşturur.
- Not: Bir araştırma ajanı kitabın enflasyon dönemi fiyatlamasını da ele aldığını bildirdi. Bunu kitabın içindekiler kısmından teyit edemedim, bu yüzden gerekçeye eklemedim.
- officialSourceUrl: https://link.springer.com/book/10.1007/978-3-319-20400-0 (Springer/Copernicus, 2015. Yazar sayfası: https://hermannsimon.com/book/)
- Türkçe baskı: **doğrulandı (sayfa)**. *Bir Fiyatlandırmacının İtirafları*, Optimist, ISBN 9786053223719, çeviren Ümit Şensoy, 2017. D&R sayfasında özgün ad eşleşiyor. Kitapyurdu'nda görülen ikinci ISBN (9786254340093) yeni bir baskıya ait olabilir. Onu doğrulamadım.

**19. The Strategy and Tactics of Pricing: A Guide to Growing More Profitably** (7th ed., Routledge 2023)
- author: Thomas T. Nagle, Georg Müller, Evert Gruyaert
- priority: **advanced**
- mechanism: Fiyatlandırma (değer temelli fiyat yapısı, fiyat politikası, maliyet artışının fiyata yansıtılması)
- why: Fiyat yapısı, iskonto disiplini ve fiyat politikası için başvuru ders kitabı. Enflasyonda asıl sorun liste fiyatı değil, iskonto ve istisnaların kontrolden çıkmasıdır. Kitabın "fiyat politikası" çerçevesi bunu düzeltmek için doğrudan kullanılabilir.
- officialSourceUrl: https://www.routledge.com/The-Strategy-and-Tactics-of-Pricing-A-Guide-to-Growing-More-Profitably/Nagle-Muller-Gruyaert/p/book/9781032016825
- Türkçe baskı: **bulunamadı**. Arama kapsamı: genel web ve Türkçe başlık varyasyonları.

**20. Lean Analytics: Use Data to Build a Better Startup Faster**
- author: Alistair Croll, Benjamin Yoskovitz
- priority: **advanced**
- mechanism: Ölçüm ve birim ekonomisi (iş modeline göre metrik)
- why: E-ticaret, SaaS, pazaryeri ve medya gibi farklı modeller için aşamaya uygun tek bir kritik metrik seçmeyi öğretir. Metin A'daki CAC, LTV ve churn tablosunun işletmeye göre nasıl uyarlanacağını gösterir.
- uyarı: 2013 tarihli. Kıyas değerleri eskidi, çerçeve hâlâ geçerli.
- officialSourceUrl: https://www.oreilly.com/library/view/lean-analytics/9781449335687/
- Türkçe baskı: **bulunamadı**. Arama kapsamı: D&R'daki kayıt İngilizce e-kitap, "Yalın Analitik" aramaları.

**21. Scaling Up: How a Few Companies Make It...and Why the Rest Don't (Rockefeller Habits 2.0)**
- author: Verne Harnish
- priority: **advanced**
- mechanism: Ölçek ve operasyon (insan, strateji, uygulama, nakit)
- why: Orta ölçekli, kurucu yönetimindeki şirket için tek sayfalık stratejik plan, toplantı ritmi ve ayrı bir nakit bölümü sunar. Nakit dönüşüm döngüsünü kısaltma konusu Türkiye'deki vade ve tahsilat baskısı için doğrudan ilgilidir. Metin A'daki *The Great CEO Within* yerine, VC dışı şirketlere daha uygun olduğu için bunu öneriyorum.
- officialSourceUrl: https://scalingup.com/book (araştırma ajanı arama sonuçlarında gördü. Ben açmadım)
- Türkçe baskı: **doğrulandı (sayfa)**. *Scaling Up: Rockefeller Alışkanlıklarında Ustalaşmak 2.0*, Optimist, ISBN 9786254340918, çeviren Büşra Gündoğdu Düzgün. Yayınevi sayfası kitabı *Mastering the Rockefeller Habits* kitabının "ilk büyük revizyonu" olarak tanımlıyor. Türkçe baskının 2014 metnine mi yoksa 2022 revize baskısına mı dayandığı sayfadan anlaşılmıyor.

**22. Built to Sell: Creating a Business That Can Thrive Without You**
- author: John Warrillow
- priority: **advanced** (KOBİ ve hizmet işletmesi)
- mechanism: Operasyon ve ölçek (hizmeti ürünleştirmek, kurucudan bağımsız ve tekrarlayan gelir)
- why: Şirketi satmak istemeyen kurucu için de değerlidir. Öğretilebilir, tekrarlanabilir ve değerli bir hizmet tasarlamak; peşin veya düzenli ödeme almak nakit döngüsünü iyileştirir. *The E-Myth Revisited* kitabının somut uygulamasıdır.
- officialSourceUrl: https://www.penguinrandomhouse.com/books/309117/built-to-sell-by-john-warrillow/ (yazar sitesi: https://builttosell.com/the-books/)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu, D&R, 1000Kitap ve BKM yazar sayfaları. Warrillow'un Türkçeye çevrilmiş *Otomatik Müşteri* (*The Automatic Customer*) kitabı farklı bir eserdir.

**23. Effectual Entrepreneurship** (3rd ed., Routledge 2025)
- author: Saras Sarasvathy, Glen B. Wheatley
- priority: **advanced**
- mechanism: Belirsizlik ve karar (eldeki araçlardan başlamak, katlanılabilir kayıp, ortaklarla pazarı birlikte kurmak)
- why: Uzman girişimcilerin tahmine dayalı değil, kontrole dayalı düşündüğünü gösteren araştırmanın uygulama kitabı. Öz kaynakla büyüyen ve tahminin zor olduğu Türkiye ortamı için "ne kadar kaybetmeyi göze alabilirim?" ölçütü, beklenen getiri hesabından daha sağlam bir karar kuralıdır.
- Not: Önceki baskıların yazarları Read, Sarasvathy, Dew ve Wiltbank. Bu bilgi ikincil kaynaktan geliyor. Katalogda baskı ve yazar eşleşmesi dikkatle kurulmalı. Akademik temel eser: Sarasvathy, *Effectuation: Elements of Entrepreneurial Expertise* (Edward Elgar, 2008).
- officialSourceUrl: https://www.routledge.com/Effectual-Entrepreneurship/Sarasvathy-Wheatley/p/book/9781032427287
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu yazar araması, genel Türkçe arama.

**24. Winning in Emerging Markets: A Road Map for Strategy and Execution**
- author: Tarun Khanna, Krishna G. Palepu
- priority: **advanced**
- mechanism: Türkiye ve gelişmekte olan pazar bağlamı (kurumsal boşluklar)
- why: Sermaye, emek ve ürün piyasalarındaki kurumsal boşlukları (güvenilir kredi bilgisi, sözleşme icrası, aracı eksikliği) haritalamayı öğretir. Bu boşluğa uyum sağlamak ya da boşluğu doldurmak bir iş modeli fırsatı olabilir. Tahsilat riski ve güven sorunu gibi Türkiye'ye özgü mekanizmaları çerçeveleyen en güçlü genel kitap budur.
- officialSourceUrl: https://store.hbr.org/product/winning-in-emerging-markets-a-road-map-for-strategy-and-execution/13216 (Harvard Business Review Press, 2010)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: genel Türkçe arama. Bu kitap için ayrıca bir Kitapyurdu veya D&R yazar araması yapılmadı, bu nedenle güven orta.

**25. Generation to Generation: Life Cycles of the Family Business**
- author: Kelin E. Gersick, John A. Davis, Marion McCollom Hampton, Ivan Lansberg
- priority: **advanced**
- mechanism: Ortaklık ve yönetişim (aile şirketinde sahiplik, aile ve işletme ekseni, halefiyet)
- why: Türkiye'deki KOBİ'lerin önemli bir kısmı aile işletmesidir. Kurucu ortaklık kitapları (*Founder's Dilemmas*, *Partnership Charter*) ikinci kuşağa devri ve kardeş ortaklığını kapsamıyor. Üç boyutlu gelişim modeli bu boşluğu dolduran standart eserdir.
- officialSourceUrl: https://store.hbr.org/product/generation-to-generation-life-cycles-of-the-family-business/555X (Harvard Business School Press, 1997)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Google, Kitapyurdu, D&R, Nadir Kitap.

**26. The Lean Product Playbook: How to Innovate with Minimum Viable Products and Rapid Customer Feedback**
- author: Dan Olsen
- priority: **optional**
- mechanism: Ürün (ürün-pazar uyumu piramidi, MVP tasarımı)
- why: Listede ürün mekanizmasını doğrudan ele alan kitap azdı. *The Lean Startup* kitabının "nasıl yapılır" tamamlayıcısıdır ve Türkçe baskısı var.
- officialSourceUrl: https://www.wiley.com/en-us/The+Lean+Product+Playbook:+How+to+Innovate+with+Minimum+Viable+Products+and+Rapid+Customer+Feedback-p-9781118960875
- Türkçe baskı: **doğrulandı (sayfa)**. *Yalın Ürün El Kitabı: MVP'lerle Yenilik ve Girişimcilik*, Buzdağı Yayınları, ISBN 9786056685880, çeviren Ali Atav, 29 Nisan 2017. Sayfada özgün ad eşleşiyor.

**27. New Sales. Simplified.: The Essential Handbook for Prospecting and New Business Development**
- author: Mike Weinberg
- priority: **optional**
- mechanism: Satış (yeni müşteri bulma, hedef listesi, satış hikâyesi)
- why: Sektörden bağımsız bir B2B yeni iş geliştirme el kitabı. SaaS'a bağlı olmadığı için sanayi, hizmet ve toptan satış yapan KOBİ'ye *Founding Sales* kitabından daha kolay aktarılır.
- officialSourceUrl: https://www.harpercollinsleadership.com/9780814431788/new-sales-simplified/ (ilk baskı AMACOM, 2012)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Goodreads baskı listesi (İspanyolca baskı var, Türkçe yok), Kitapyurdu, D&R.

**28. The Essays of Warren Buffett: Lessons for Corporate America** (5th ed., 2020)
- author: Warren E. Buffett; editör Lawrence A. Cunningham
- priority: **optional**
- mechanism: Sermaye dağıtımı ve birincil kaynak
- why: Metin B'nin "birincil belgeler" önerisinin kitap biçimi. Berkshire mektuplarını konu başlıklarına göre derler: sermaye dağıtımı, satın alma, muhasebe kârı ile ekonomik gerçeklik farkı. *The Outsiders* kitabının kaynak metni gibi okunabilir.
- officialSourceUrl: https://cap-press.com/books/isbn/9781531017507/The-Essays-of-Warren-Buffett-Fifth-Edition (sayfa doğrudan erişimde 403 döndürdü. URL ve baskı bilgisi perakende kayıtlarıyla çapraz kontrol edildi)
- Türkçe baskı: **bulunamadı**. Arama kapsamı: Kitapyurdu, D&R, Pandora ve Amazon.com.tr'de yalnızca İngilizce baskı. *Hayat Denen Kartopu* (Alice Schroeder'ın Buffett biyografisi *The Snowball*, katalogda mevcut) farklı bir eserdir.

**29. State and Business in Modern Turkey: A Comparative Study**
- author: Ayşe Buğra
- priority: **optional**
- mechanism: Türkiye bağlamı (devlet ile iş dünyası ilişkisi, holdingleşme, iş örgütleri)
- why: Türkiye'de girişimciliğin kurumsal ortamını, yani teşvik, düzenleme ve devletle ilişkinin iş stratejisini nasıl biçimlendirdiğini analiz eden akademik bir temel eser. Nasıl yapılır kitabı değildir. Strateji okumalarını yerel bağlama oturtmak için okunur.
- uyarı: 1994 tarihli, güncel dönemi kapsamıyor.
- officialSourceUrl: https://sunypress.edu/isbn/9780791417881 (SUNY Press, 1994)
- Türkçe baskı: **doğrulandı (sayfa)**. *Devlet ve İşadamları*, İletişim Yayınları, ISBN 9789754704617, çeviren Fikret Adaman, ilk baskı Haziran 1995. Yayınevi sayfasında özgün ad "State and Business in Modern Turkey" olarak geçiyor.

### 4.3 Türkçe baskı özeti (eklenecek 29 kitap)

| Durum | Sayı | Kitaplar |
|---|---|---|
| Doğrulandı (sayfa) | 10 | Profit First, Thinking in Bets, Value Proposition Design, Negotiation Genius, The Outsiders, Confessions of the Pricing Man, Scaling Up, The Lean Product Playbook, State and Business in Modern Turkey, Business Model Generation (kısmi) |
| Doğrulandı (arama) | 2 | Competing Against Luck, Disciplined Entrepreneurship (yalnızca 2013 baskısının çevirisi) |
| Bulunamadı | 17 | Diğerleri. Bu, Türkçe baskının olmadığı anlamına gelmez. Milli Kütüphane kataloğu bu turda taranmadı. |

---

## 5. Mekanizma dengesi (76 kitap)

M = katalogda mevcut, Y = yeni eklenen. Her kitap birincil mekanizmasına göre bir kez sayıldı.

| Mekanizma | Kitaplar | Toplam | core |
|---|---|---|---|
| Harita / temel | Personal MBA (M) | 1 | 1 |
| Problem / müşteri | Mom Test (Y), Competing Against Luck (Y), Disciplined Entrepreneurship (Y), Lean Startup (M), New Business Road Test (M) | 5 | 4 |
| Değer önerisi / iş modeli / doğrulama | Business Model Generation (Y), Value Proposition Design (Y), Testing Business Ideas (Y), Innovation and Entrepreneurship (M) | 4 | 1 |
| Ürün / ölçüm | Lean Product Playbook (Y), Lean Analytics (Y) | 2 | 0 |
| Satış | Founding Sales (Y), New Sales. Simplified. (Y), SPIN Selling (M), Ultimate Sales Machine (M), Influence (M) | 5 | 1 |
| Konumlandırma / pazarlama | Obviously Awesome (Y), Positioning (M), This Is Marketing (M), How Brands Grow (M), Selling the Invisible (M) | 5 | 1 |
| Fiyatlandırma | Confessions of the Pricing Man (Y), Monetizing Innovation (Y), Strategy and Tactics of Pricing (Y), 1% Windfall (M), Value-Based Fees (M) | 5 | 1 |
| Finans / nakit | Financial Intelligence for Entrepreneurs (M), Simple Numbers (M), Profit First (Y), How to Read a Financial Report (M), Great Game of Business (M) | 5 | 3 |
| Dağıtım / büyüme | Traction (Y), Crossing the Chasm (M), Cold Start Problem (Y) | 3 | 1 |
| Operasyon | The Goal (M), E-Myth Revisited (M), Lean Thinking (M), Toyota Production System (M) | 4 | 2 |
| KOBİ / bootstrapping | Street Smarts (M), Small Giants (M), Rework (M), Built to Sell (Y), Sam Walton (M) | 5 | 1 |
| Ekip / ortaklık / aile şirketi | Founder's Dilemmas (M), Partnership Charter (M), Who (Y), High Output Management (M), Hard Thing (M), Radical Candor (M), Effective Executive (M), Five Dysfunctions (M), Generation to Generation (Y) | 9 | 4 |
| Müzakere | Getting to Yes (M), Bargaining for Advantage (M), Negotiation Genius (Y), Never Split the Difference (M) | 4 | 1 |
| Strateji / savunma | Good Strategy Bad Strategy (M), Playing to Win (M), Competitive Strategy (M), 7 Powers (Y), Co-opetition (M), Innovator's Dilemma (M), Blue Ocean (M), 80/20 Principle (M) | 8 | 1 |
| Belirsizlik / karar | Thinking in Bets (Y), Effectual Entrepreneurship (Y), Superforecasting (M), Thinking Fast and Slow (M), Antifragile (M) | 5 | 1 |
| Ölçek | Scaling Up (Y) | 1 | 0 |
| Sermaye / yatırım / sermaye dağıtımı | Venture Deals (M), The Outsiders (Y), Essays of Warren Buffett (Y) | 3 | 0 |
| Türkiye / gelişmekte olan pazar | Winning in Emerging Markets (Y), State and Business in Modern Turkey (Y) | 2 | 0 |
| **Toplam** | | **76** | **23** |

**Denge yorumu:**
- VC'ye bağlı başlıklar (*Venture Deals*, *Cold Start*, *Founding Sales*, *Crossing the Chasm*) 76 kitabın yalnızca 4'ü ve hiçbiri sermaye mekanizmasında `core` değil. Sermayede `core` bilerek yok: yatırım almak zorunlu bir aşama değil.
- Fiyatlandırma 0'dan 5 kitaba çıktı. Metin A'da bu alanda hiç kitap yoktu.
- Nakit ve KOBİ mekanizmaları birlikte 10 kitapla listenin en güçlü bölümü oldu.
- Ölçek ve Türkiye satırları ince kaldı. Bunun nedeni güçlü aday bulunamamasıydı (bkz. bölüm 7).

---

## 6. Eklenmeyen adaylar ve gerekçeleri

| Kitap | Neden eklenmedi |
|---|---|
| Secrets of Sand Hill Road (Kupor) | ABD VC ekosistemine özgü. Katalogdaki *Venture Deals* (sözleşme terimleri) ve *The Power Law* (VC mantığı) yeterli. Metin B de aynı sonuca vardı. |
| The Great CEO Within (Mochary) | ABD'de VC destekli teknoloji CEO'suna yönelik bir kontrol listesi. *High Output Management* ve *Scaling Up* bu ihtiyacı karşılıyor. Tam metni ücretsiz olduğundan istenirse kaynak bağlantısı olarak verilebilir. |
| Traction: Get a Grip on Your Business (Wickman, EOS) | *Scaling Up* ile aynı işlevi görüyor ve Türkçe baskısı bulunamadı. Aynı adlı Weinberg & Mares kitabıyla karışma riski de var. |
| The Startup Owner's Manual (Blank & Dorf) | Türkçe baskısı var (*Girişimcinin El Kitabı*, Boyut, ISBN 9789752311350). Ancak *Mom Test*, *Lean Startup* ve *Disciplined Entrepreneurship* ile büyük ölçüde örtüşüyor. 500 sayfalık bir başvuru kitabı, okuma listesine uygun değil. |
| Zero to One (Thiel) | Türkçe baskısı var (*Sıfırdan Bire*, Pegasus). Tekel ve savunma fikrini *7 Powers* daha sistematik öğretiyor. Ayrıca VC bakış açısı listeye tekrar ağırlık kazandırırdı. |
| $100M Offers (Hormozi) | Teklif tasarımı KOBİ için ilginç bir mekanizma, ama kitap kendi yayını, reklam dili ağır ve kanıt temeli zayıf. Fiyat ve teklif mekanizması Simon ve Ramanujam ile daha sağlam biçimde karşılanıyor. |
| Company of One (Jarvis) | Türkçe baskısı var (*Tek Kişilik Şirket*, Nova Kitap, ISBN 9786258489309). *Small Giants* ve *Rework* ile örtüşüyor. |
| Succeeding Generations (Lansberg); Family Business on the Couch (Kets de Vries vd.) | *Generation to Generation* aile şirketi mekanizmasını tek başına karşılıyor. |
| Katalogda olup girişimcilik listesine alınmayanlar | *Accounting Made Simple* (FIE ile örtüşüyor), *Work the System* (E-Myth ile örtüşüyor), *Hire With Your Head* (yerine Who), *Information Rules* (Cold Start ve 7 Powers karşılıyor), *The Power Law* ve *Boulevard of Broken Dreams* (VC ve politika tarihi), *The Art of the Start 2.0*, *Guerrilla Marketing*, *Pitch Anything*, *Ready, Fire, Aim*, *How to Make Millions with Your Ideas* (zayıf veya dönemsel), şirket hikâyeleri (*Bad Blood*, *The Everything Store* vb.: vaka okuması, mekanizma kitabı değil). |

---

## 7. Kitapla kapanmayan boşluklar (Türkiye ve KOBİ)

Metin B'nin işaret ettiği Türkiye mekanizmalarının bir kısmı için güçlü, güncel ve aktarılabilir bir kitap **bulamadım**. Bu boşlukları zayıf kitaplarla doldurmadım:

| Mekanizma | Durum | Öneri |
|---|---|---|
| Tahsilat, vade, çek/senet riski | Güçlü bir KOBİ kitabı yok | Koşullu aday: *Credit Management Handbook* (Burt Edwards, Gower, 5. baskı 2004). Kredi limiti, tahsilat ve ihracat ödeme koşullarını ele alan uygulayıcı kitabı, ancak eski tarihli ve Birleşik Krallık hukuk bağlamında. Listeye alınmadı. |
| İşletme sermayesi ve nakit dönüşüm döngüsü (Türkçe) | Aday var, ama doğrulanmadı | *İşletme Sermayesi Yönetimi* (Ahmet Aksoy & Kürşat Yalçıner). Gazi Kitabevi ve Detay Yayıncılık altında farklı yıllarda ve farklı ISBN'lerle baskıları görülüyor. Güncel baskı teyit edilemedi. Doğrulanırsa `optional` olarak eklenebilir. |
| Kur riski ve enflasyon muhasebesi | Konu mevzuata bağlı ve hızlı değişiyor | Kitap yerine güncel resmi kaynaklar ve mali müşavir ile çalışılmalı. Kitap önerisi yapılmadı. |
| SGK ve vergi yükünün birim ekonomiye etkisi | Kitap konusu değil | Uygulama olarak kendi P&L ve birim ekonomisi modelinde işveren maliyeti ayrı bir satır olarak modellenmeli. |
| Türk girişimci vakası | Koşullu aday | Vehbi Koç, *Hayat Hikâyem* (Vehbi Koç Vakfı Yayınları, ilk baskı 1973). Eserin varlığı doğrulandı, ancak ISBN'li güncel baskısı doğrulanamadı. Listeye alınmadı. |

**Kitap dışı uygulamalar (Türkiye'ye uyarlanmış):**
1. **Reel P&L:** Aylık P&L ve nakit akışı hem nominal hem reel (TÜFE veya kura endeksli) olarak kurulmalı. Brüt marj, yenileme maliyetiyle hesaplanmalı.
2. **Nakit dönüşüm döngüsü panosu:** Alacak gün sayısı, stok gün sayısı ve borç gün sayısı haftalık izlenmeli. Vadeli satışın gizli finansman maliyeti fiyata yansıtılmalı.
3. **Fiyat ritmi:** Fiyat gözden geçirme takvimi (ör. aylık) sabitlenmeli. Sözleşmelere endeks veya kur maddesi eklenmeli, iskonto yetkisi yazılı bir politikaya bağlanmalı (bkz. madde 19).
4. **Karar günlüğü ve akran grubu:** Metin B'nin önerisi aynen geçerli. *Thinking in Bets* ile birlikte uygulanmalı.
5. **Ortaklık:** Kurucu ortaklar arasında *Partnership Charter* sürecinin çıktısı yazılı bir pay sahipleri sözleşmesine dönüştürülmeli. *Venture Deals* kavramlarının (ör. SAFE, tercihli pay) Türk hukukunda karşılığı ve uygulanabilirliği yerel bir hukukçuyla teyit edilmeli.

---

## 8. Darboğaza göre okuma haritası

Metin B'nin önerisini benimsiyorum: sabit sıra yerine her çeyrekte darboğaz belirlenmeli. `core` kitaplar (23) omurgayı oluşturur. Diğerleri darboğaza göre seçilir.

| Darboğaz | Önce | Sonra |
|---|---|---|
| Harita yok | Personal MBA | - |
| Gerçek bir problem veya müşteri bulamıyorum | Mom Test, Competing Against Luck | Lean Startup, Disciplined Entrepreneurship, Testing Business Ideas |
| Model tutmuyor | Business Model Generation | Value Proposition Design, New Business Road Test |
| Satış kapanmıyor | Founding Sales veya New Sales. Simplified., Obviously Awesome | SPIN Selling, Influence |
| Satıyorum ama kâr yok | Confessions of the Pricing Man, Simple Numbers | 1% Windfall, Strategy and Tactics of Pricing, Monetizing Innovation |
| Kâr var ama nakit yok | Profit First, Financial Intelligence for Entrepreneurs, Street Smarts | Scaling Up (nakit bölümü), How to Read a Financial Report |
| Her şey bana bağlı | E-Myth Revisited, The Goal | Built to Sell, Who, High Output Management |
| Müşteri bizi bulmuyor | Traction | Crossing the Chasm, Cold Start Problem (pazaryeri ise) |
| Rakip kopyalıyor | Good Strategy Bad Strategy | 7 Powers, Playing to Win, Competitive Strategy |
| Ortak veya aile sorunu | Founder's Dilemmas, Partnership Charter | Generation to Generation |
| Pazarlık kaybediyorum | Getting to Yes | Negotiation Genius, Bargaining for Advantage |
| Belirsizlikte karar veremiyorum | Thinking in Bets | Effectual Entrepreneurship, Superforecasting |
| Fazla nakit veya yatırım kararı | The Outsiders | Venture Deals, Essays of Warren Buffett |
| Yerel bağlamı okumak | Winning in Emerging Markets | State and Business in Modern Turkey |

---

## 9. Katalog entegrasyonu için notlar

1. **Önerilen koleksiyon:** 76 kitaplık tek bir "Girişimcilik kitaplığı" koleksiyonu kurulabilir. Mekanizma satırları (bölüm 5) koleksiyon içi grup (`groupId`) olarak kullanılabilir. `core` işareti mevcut `roles` veya `tags` yapısına eşlenebilir.
2. **Kategori:** Yeni kayıtların çoğu `enterprise` altında toplanmalı. Fiyatlandırma kitapları `marketing` + `finance`, *Negotiation Genius* `communication`, *Thinking in Bets* ve *Effectual Entrepreneurship* `psychology` + `enterprise`, *State and Business in Modern Turkey* `economy` + `politics` kategorilerine yakın.
3. **Türkçe ad çakışması:** *Negotiation Genius* kaydı eklenirken "\"Evet\" Dedirtme Sanatı" adı yalnızca ISBN 9786054629725 ile eşlenmeli. Aynı ad `gettingtoyes` kaydında da var.
4. **Baskı uyumsuzluğu:** *Disciplined Entrepreneurship* için İngilizce kayıt 2024 baskısını, Türkçe baskı ise 2013 metnini temsil ediyor. *Scaling Up* ve *Effectual Entrepreneurship* için de hangi baskının esas alındığı kayıtta açıkça belirtilmeli.
5. **Mevcut kayıtta tutarsızlık (değiştirilmedi, yalnızca not):** `emythrevisited` kaydında `titleTr` "Girişimcilik Tutkusu", `aliases` ise "Girişimcilik Efsanesi" diyor. Hangi Türkçe baskının doğru olduğu ayrıca kontrol edilmeli.
6. **Mevcut 47 kitabın Türkçe durumu** bu turda yeniden doğrulanmadı. Kataloğun `turkishStatus` alanı ve `data/edition-verification.json` kayıtları esas alınmalı.

---

## 10. Yöntem ve sınırlar

- Katalog `src/catalog.json` üzerinden tarandı: 718 kaydın başlık, yazar, `titleTr` ve `aliases` alanları.
- Kitap doğrulaması dört paralel araştırma ajanıyla yapıldı. Kritik iddiaları (10 Türkçe baskı sayfası; Routledge, HBR, SUNY ve İletişim sayfaları) ayrıca kendim açarak kontrol ettim. Raporda geçen 18 ISBN-13 numarasının kontrol basamağı hesaplanarak geçerli bulundu.
- Web sayfaları yalnızca kanıt olarak kullanıldı. Sayfalardaki yönlendirici metinler talimat olarak dikkate alınmadı.
- "Bulunamadı" sonuçları ağırlıklı olarak Kitapyurdu, D&R, idefix, Pandora ve Nadir Kitap aramalarına dayanıyor. Milli Kütüphane ve üniversite katalogları taranmadı. Bu nedenle bu sonuçlar Türkçe baskının olmadığını göstermez.
- Metin A'nın YC, Sequoia ve Stripe atıfları doğrulanmadı ve kanıt olarak kullanılmadı.
