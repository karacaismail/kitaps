# Çeviri durumu araştırma hattı

Bu hat, çeviri durumu belirsiz kayıtlar için küçük araştırma paketleri üretir ve iki bağımsız Claude çıktısını doğrular. Scriptler Claude'u çalıştırmaz, ağa bağlanmaz ve uygulama verisini değiştirmez. Nihai JSON yalnızca incelenecek bir öneridir.

## 1. Batch girdilerini üret

Üretilen dosyaları depo dışında tut:

```sh
RESEARCH_DIR="$PWD/../../work/research/translation-status"
python3 scripts/prepare-translation-research.py \
  --out-dir "$RESEARCH_DIR/input" \
  --batch-size 10 \
  --checked-at 2026-09-28
```

`manifest.json`, katalog SHA-256 değerini, beklenen kayıt kimliklerini ve batch dosyalarını kaydeder. Bilinen Türkçe özgün eserler ile kaynakla doğrulanmış Türkçe baskılar kuyruğa alınmaz.

## 2. Birinci araştırmayı çalıştır

Her batch ayrı ve oturumsuz çalışır. `--safe-mode` yerel eklenti, CLAUDE.md ve benzeri özelleştirmeleri kapatır. `--restricted` ile yalnız web arama araçları açılır. `--permission-prompts none` bekleyen etkileşimli izin sorularını reddeder. Bütçe değerini çalıştırmadan önce kullanıcı belirlemelidir.

```sh
mkdir -p "$RESEARCH_DIR/stage1"
SCHEMA1="$(cat scripts/translation-research-stage1.schema.json)"

claude -p \
  --safe-mode \
  --restricted \
  --tools WebSearch WebFetch \
  --permission-mode dontAsk \
  --permission-prompts none \
  --no-session-persistence \
  --model sonnet \
  --effort medium \
  --max-budget-usd 2 \
  --system-prompt-file scripts/prompts/translation-research-stage1.txt \
  --output-format json \
  --json-schema "$SCHEMA1" \
  < "$RESEARCH_DIR/input/translation-0001.json" \
  > "$RESEARCH_DIR/stage1/translation-0001.json"
```

`--dangerously-skip-permissions` kullanma. Önce tek batch ile çıktı ve maliyeti kontrol et; batchleri seri çalıştır. Başarısız veya bütçe sınırına ulaşmış CLI zarfını başarılı araştırma sonucu sayma.

## 3. Bağımsız doğrulamayı çalıştır

İkinci aşamaya özgün batch ile birinci aşamanın yapılandırılmış çıktısını birlikte ver. İkinci aşama yeni, oturumsuz bir çağrı olmalı ve birinci aşamanın alan adlarından farklı kaynaklar bulmalıdır.

```sh
mkdir -p "$RESEARCH_DIR/stage2" "$RESEARCH_DIR/verify-input"
jq -s '{input: .[0], stage1: .[1]}' \
  "$RESEARCH_DIR/input/translation-0001.json" \
  "$RESEARCH_DIR/stage1/translation-0001.json" \
  > "$RESEARCH_DIR/verify-input/translation-0001.json"

SCHEMA2="$(cat scripts/translation-research-stage2.schema.json)"
claude -p \
  --safe-mode \
  --restricted \
  --tools WebSearch WebFetch \
  --permission-mode dontAsk \
  --permission-prompts none \
  --no-session-persistence \
  --model sonnet \
  --effort medium \
  --max-budget-usd 2 \
  --system-prompt-file scripts/prompts/translation-research-stage2.txt \
  --output-format json \
  --json-schema "$SCHEMA2" \
  < "$RESEARCH_DIR/verify-input/translation-0001.json" \
  > "$RESEARCH_DIR/stage2/translation-0001.json"
```

## 4. Sonuçları doğrula ve birleştir

```sh
python3 scripts/merge-translation-research.py \
  --manifest "$RESEARCH_DIR/input/manifest.json" \
  --stage1-dir "$RESEARCH_DIR/stage1" \
  --stage2-dir "$RESEARCH_DIR/stage2" \
  --stage1-reviewer claude-stage1 \
  --stage2-reviewer claude-stage2 \
  --checked-at 2026-09-28 \
  --output "$RESEARCH_DIR/merged-proposal.json"
```

Bir kayıt ancak iki aşama aynı kararı verirse ve iki aşama farklı kaynak alan adları kullanırsa `records` nesnesine girer. “Çeviri yok” kararı ayrıca iki aşamada da yüksek güven ve milli bibliyografya kanıtı ister. Diğer kayıtlar gerekçeleriyle `manualReview` listesine yönlendirilir.

Kararların arayüz karşılığı:

- `original`: çeviri bilgisi gösterilmez.
- `available`: “Çeviri” ve onay simgesi gösterilir.
- `unavailable`: “Çeviri” ve çarpı simgesi gösterilir.
- `manual_review`: uygulama verisine aktarılmaz.

`merged-proposal.json` doğrudan `data/` altına kopyalanmamalıdır. Kaynaklar elle gözden geçirildikten sonra ayrı bir entegrasyon değişikliği hazırlanmalı ve `npm run data`, testler ve arayüz doğrulaması çalıştırılmalıdır.
