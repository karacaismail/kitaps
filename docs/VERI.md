# Veri modeli

## Akış

```
data/kitaplar.md  →  scripts/build-data.mjs  →  src/data/books.json  →  arayüz
```

`data/kitaplar.md` tek doğruluk kaynağı. `src/data/books.json` üretilmiş
çıktıdır ve **elle düzenlenmez** — `npm run data` her seferinde üzerine yazar.

## Dönüştürücü nasıl karar veriyor

`scripts/build-data.mjs` markdown'daki bütün tabloları tarar ve bir tabloyu
yalnızca şu koşulda kitap tablosu sayar:

- başlık satırında `Orijinal Ad`, `Kitap (konu)` veya `Kitap` sütunlarından
  biri var, **ve**
- `Yazar` veya `Türkçe Ad` sütunlarından biri var.

Bu sayede künye tabloları alınır; "hangi sorunda hangi kitap", "durum
işaretleri", "eksik isimler" gibi yönlendirme tabloları alınmaz.

Sütun adları şu alanlara eşlenir:

| Markdown sütunu | Alan |
|---|---|
| `Orijinal Ad` / `Kitap (konu)` / `Kitap` | `original` |
| `Türkçe Ad` | `turkish` |
| `Yazar` | `author` |
| `Çevirmen (önerilen)` / `Çevirmen / Hazırlayan` / `Çevirmen` | `translator` |
| `Yayınevi` | `publisher` |
| `Not` / `Neden` / `Yaş` | `note` |
| `#` / `Sıra` | `id` |

## Kayıt

```jsonc
{
  "id": "A3",                       // markdown'daki satır numarası; kapak dosyası adı da bu
  "key": "vom-kriege-carl-von-clausewitz",  // kalıcı anahtar — durumlar buna bağlanır
  "section": "A",
  "sectionLabel": "Strateji klasikleri",
  "sub": "",                        // varsa alt başlık (örn. "Dostoyevski")
  "alsoIn": ["A"],                  // kitap birden çok bölümde geçiyorsa hepsi
  "original": "Vom Kriege",
  "turkish": "Savaş Üzerine",
  "author": "Carl von Clausewitz",
  "translator": "H. Fahri Çeliker",
  "publisher": "Özne Yayınları (1999) / aynı çeviri Alfa baskısında",
  "note": "Tam metin şart. Şiar Yalçın / Spartaküs (1997): 4-5-6-7. Kitaplar eksik...",
  "status": ["warn", "avoid"]
}
```

### `key` neden `id`'den ayrı

`id` markdown'daki konuma bağlı (`A3`). Satırlar yeniden sıralanırsa değişir.
Kullanıcının işaretlediği durumlar `localStorage`'da saklandığı için konuma
bağlı bir anahtara bağlanamaz — bu yüzden `key` kitabın **adı ve yazarından**
türetiliyor. Çakışma olursa sonuna sayı ekleniyor (`-2`, `-3`).

### `status`

Markdown'daki emojiler metinden sökülüp bu diziye çevriliyor:

| Markdown | `status` | Arayüzdeki ikon | Anlamı |
|---|---|---|---|
| ✅ | `ok` | `check-circle` | Künye doğrulandı |
| ⚠️ | `warn` | `warning` | Dikkat edilmesi gereken nokta var |
| ❓ | `unverified` | `question` | Künye doğrulanmadı |
| 🚫 | `avoid` | `prohibit` | Bu baskıdan kaçın |

Bir kitapta birden çok durum olabilir. Kartta yalnızca en kritiği gösterilir:
`avoid` > `warn` > `unverified` > `ok`.

## Temizleme kuralları

- `—`, `❓`, boş hücreler boş dizeye çevrilir; boş alan künyede hiç gösterilmez.
- `*(Türkçe baskı yok)*` ve `*(Türkçe baskı doğrulanamadı)*` Türkçe ad sayılmaz.
- Orijinal ad ile Türkçe ad aynıysa Türkçe ad boşaltılır (telif Türkçe eserler).
- Kalın/italik/bağlantı işaretleri sökülür.
- Aynı kitap birden çok bölümde geçiyorsa tek kayıt olur; eksik alanlar
  diğer geçişlerden tamamlanır, bölümler `alsoIn`'e eklenir.

## Bölüm etiketleri

`scripts/build-data.mjs` içindeki `SECTIONS` sabiti bölüm harfini insan
okunur etikete ve Phosphor ikonuna bağlar. Markdown'a yeni bir `## X.` bölümü
eklenirse buraya da bir satır eklenmeli; eklenmezse kitaplar yine listelenir
ama süzgeç çipi ham başlığı gösterir.
