#!/usr/bin/env python3
"""Replace soft cover images with sharper copies of the same cover.

Book cards are up to 270 CSS px wide on desktop (four columns), so a sharp
cover needs about 540 real pixels on a 2x screen. Many covers were saved
smaller, and some that look large were upscaled by the shop that served
them. This script measures each cover's real resolution, looks for sharper
copies of the same image and keeps one only when:

  * it shows the same cover (perceptual hash and proportions match the
    cover already chosen for that edition, so no other edition sneaks in);
  * it really holds more detail (upscaled pixels are not counted).

Sources, in order: the recorded image URL at a larger size or as the
original, then the edition's ISBN on D&R (Turkish editions), Amazon, Open
Library and Google Books.

Every cover then gets two files:
  public/covers/<name>     up to 720 px wide (desktop, 2x screens)
  public/covers/sm/<name>  up to 400 px wide (phones and thumbnails; srcset picks it)

What happened to each cover, with the source of every replacement, is
written to data/cover-upgrades.json.

Usage:
  python3 scripts/upgrade-covers.py --cache <dir> [--limit N] [--only id,...] [--write]
Without --write, nothing in public/ or data/ changes.
"""
from __future__ import annotations

import argparse
import concurrent.futures as futures
import datetime as dt
import hashlib
import io
import json
import pathlib
import re
import threading
import time
import urllib.parse
import urllib.request

import numpy as np
from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
LARGE, SMALL = 720, 400
# Real detail is assumed where halving the image loses at least this much (mean
# absolute grey-level difference). True-resolution covers lose 1.4 to 10;
# upscaled ones 0.2 to 0.8.
DETAIL = 1.2
# 64-bit difference hash: the same cover at another size stays within a few bits.
SAME_COVER_BITS = 10
# Kitapyurdu stamps "kitapyurdu.com" across the lower cover at every size. Such a copy
# replaces only a cover that already carries the stamp, and a clean copy wins over it.
WATERMARKED = ('img.kitapyurdu.com',)
# Matches the hash accepts but a person rejected on sight: another printing's cover.
# Covers a person found wrong on sight, with the right image for the same ISBN.
REPLACE = {
    'marketing': {
        'source': 'Amazon',
        'url': 'https://m.media-amazon.com/images/P/1500619213.01._SCLZZZZZZZ_.jpg',
        'reason': 'The previous image was a text page from inside the book; this is the cover of the same edition (ISBN 9781500619213).',
    },
}
KEEP = {
    'goal': 'The sharper copy is the revised edition ("Gözden geçirilmiş yeni baskı"); the catalog shows the 40th-anniversary printing.',
    'pollyanna': 'The sharper copy has a different series header (Modern Klasikler Dizisi).',
}
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
_host_locks: dict[str, threading.BoundedSemaphore] = {}
_host_last: dict[str, float] = {}
_lock = threading.Lock()


def host_gate(url: str) -> threading.BoundedSemaphore:
    host = urllib.parse.urlparse(url).netloc
    with _lock:
        return _host_locks.setdefault(host, threading.BoundedSemaphore(2))


def fetch(url: str, cache: pathlib.Path, binary: bool = True) -> bytes | None:
    """GET with a disk cache and at most two requests at a time per host, spaced out."""
    key = cache / hashlib.sha1(url.encode()).hexdigest()
    if key.exists():
        data = key.read_bytes()
        return data or None
    host = urllib.parse.urlparse(url).netloc
    with host_gate(url):
        with _lock:
            wait = _host_last.get(host, 0) + 0.6 - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        with _lock:
            _host_last[host] = time.monotonic()
        started = time.monotonic()
        try:
            request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' if binary else 'text/html,*/*'})
            with urllib.request.urlopen(request, timeout=15) as response:
                data = response.read()
            outcome = 'ok'
        except Exception as error:
            data = b''
            outcome = type(error).__name__ + ':' + str(getattr(error, 'code', ''))
    key.write_bytes(data)
    with _lock, open(cache / 'requests.log', 'a') as log:
        log.write(f'{host}\t{outcome}\t{time.monotonic() - started:.1f}s\t{len(data)}\t{url}\n')
    return data or None


def open_image(data: bytes | None) -> Image.Image | None:
    if not data or len(data) < 1500:  # placeholders (Amazon's 1x1 GIF, empty answers)
        return None
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
        image = ImageOps.exif_transpose(image)
        return image.convert('RGB') if image.mode not in ('RGB', 'L') else image
    except Exception:
        return None


def loss(image: Image.Image, scale: float) -> float:
    grey = image.convert('L')
    w, h = grey.size
    back = grey.resize((max(8, round(w * scale)), max(8, round(h * scale))), Image.LANCZOS).resize((w, h), Image.BICUBIC)
    return float(np.mean(np.abs(np.asarray(grey, dtype=np.float32) - np.asarray(back, dtype=np.float32))))


def effective_width(image: Image.Image) -> int:
    """The width up to which the image holds real detail: the largest size at
    which it still behaves like a true-resolution picture."""
    w, h = image.size
    for scale in (1.0, 0.85, 0.7, 0.6, 0.5, 0.42, 0.35, 0.3, 0.25, 0.2):
        width = round(w * scale)
        if width < 100:
            break
        test = image if scale == 1.0 else image.resize((width, max(8, round(h * scale))), Image.LANCZOS)
        if loss(test, 0.5) >= DETAIL:
            return width
    return max(1, round(w * 0.2))


def dhash(image: Image.Image) -> int:
    grey = np.asarray(image.convert('L').resize((9, 8), Image.LANCZOS), dtype=np.int16)
    bits = (grey[:, 1:] > grey[:, :-1]).flatten()
    return int(''.join('1' if bit else '0' for bit in bits), 2)


def trim(image: Image.Image) -> Image.Image:
    """Drops a plain border (white or black padding some shops add) before comparing."""
    grey = np.asarray(image.convert('L'), dtype=np.int16)
    for background in (grey[0, 0], 255, 0):
        mask = np.abs(grey - background) > 18
        if mask.any():
            rows, cols = np.where(mask.any(axis=1))[0], np.where(mask.any(axis=0))[0]
            box = (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)
            if (box[2] - box[0]) * (box[3] - box[1]) >= 0.5 * grey.size:
                return image.crop(box)
    return image


def same_cover(reference: Image.Image, candidate: Image.Image) -> tuple[bool, int, float]:
    a, b = trim(reference), trim(candidate)
    ratio_a, ratio_b = a.height / a.width, b.height / b.width
    ratio_gap = abs(ratio_a - ratio_b) / ratio_a
    distance = bin(dhash(a) ^ dhash(b)).count('1')
    return distance <= SAME_COVER_BITS and ratio_gap <= 0.08, distance, round(ratio_gap, 3)


def isbn10(isbn13: str) -> str | None:
    if not re.fullmatch(r'978\d{10}', isbn13 or ''):
        return None
    core = isbn13[3:12]
    check = (11 - sum((10 - i) * int(d) for i, d in enumerate(core)) % 11) % 11
    return core + ('X' if check == 10 else str(check))


def upgrades_of(url: str) -> list[str]:
    """Larger or original versions of an image URL, by host."""
    if not url:
        return []
    out: list[str] = []
    for marker in ('/image/v2/images/raw/', '/v3/image/raw/'):  # ft.com image service: use the original
        if marker in url:
            out.append(urllib.parse.unquote(url.split(marker, 1)[1].split('?', 1)[0]))
    if 'covers.openlibrary.org' in url:
        out.append(re.sub(r'-[SM]\.jpg', '-L.jpg', url))
    if '/cdn/shop/' in url:  # Shopify: without a width it serves the original
        out.append(re.sub(r'([?&])width=\d+&?', r'\1', url).rstrip('?&'))
        out.append(re.sub(r'_\d+x\d+(\.\w+)', r'\1', url))
    match = re.search(r'img\.kitapyurdu\.com/v1/getImage/fn:(\d+)', url)
    if match:
        out.append(f'https://img.kitapyurdu.com/v1/getImage/fn:{match.group(1)}/wi:1600')
    if re.search(r'-O\.(jpg|png|webp)$', url):
        out.append(re.sub(r'-O\.(jpg|png|webp)$', r'-B.\1', url))
    if 'i.dr.com.tr/cache/' in url:
        out.append(re.sub(r'i\.dr\.com\.tr/cache/[^/]+/', 'i.dr.com.tr/', url))
    if 'cloudfront.net/fit-in/' in url:
        out.append(re.sub(r'/fit-in/\d+x\d+/', '/fit-in/2000x2000/', url))
    if 'mzstatic.com' in url:
        out.append(re.sub(r'/\d+x\d+\w*\.(jpg|png|webp)$', r'/2000x0w.\1', url))
    if 'od-cdn.com/ImageType-' in url:
        out.append(re.sub(r'ImageType-\d+', 'ImageType-100', re.sub(r'Img\d+\.', 'Img100.', url)))
    if '-medium.webp' in url:
        out.append(url.replace('-medium.webp', '.webp'))
    if re.search(r'/products/\d+/', url):
        out.append(re.sub(r'/products/\d+/', '/products/1000/', url))
    if '?w=' in url:
        out.append(re.sub(r'\?w=\d+', '?w=1600', url))
    return [candidate for candidate in dict.fromkeys(out) if candidate != url]


def dr_by_isbn(isbn: str, cache: pathlib.Path) -> list[str]:
    """D&R's search page lists the edition with its uploaded original image."""
    html = fetch(f'https://www.dr.com.tr/search?q={isbn}', cache, binary=False)
    if not html:
        return []
    files = re.findall(r'i\.dr\.com\.tr/cache/500x400-0/originals/([\w.-]+)', html.decode('utf-8', 'ignore'))
    return [f'https://i.dr.com.tr/originals/{name}' for name in list(dict.fromkeys(files))[:3]]


def google_books(isbn: str, cache: pathlib.Path) -> list[str]:
    data = fetch(f'https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}', cache, binary=False)
    try:
        items = json.loads(data or b'{}').get('items') or []
    except ValueError:
        return []
    return [f'https://books.google.com/books/content?id={item["id"]}&printsec=frontcover&img=1&zoom=1&fife=w1600' for item in items[:2] if item.get('id')]


def candidates(cover: dict, cache: pathlib.Path) -> list[tuple[str, str]]:
    found = [('kaynak, büyük boyut', url) for url in upgrades_of(cover.get('imageUrl') or '')]
    isbn = re.sub(r'[^0-9X]', '', cover.get('isbn') or '')
    if isbn:
        if cover.get('language') == 'tr' or isbn.startswith(('978605', '978975', '978625', '978994')):
            found += [('D&R', url) for url in dr_by_isbn(isbn, cache)]
        ten = isbn10(isbn) if len(isbn) == 13 else (isbn if len(isbn) == 10 else None)
        if ten:
            found.append(('Amazon', f'https://m.media-amazon.com/images/P/{ten}.01._SCLZZZZZZZ_.jpg'))
        found.append(('Open Library', f'https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false'))
        found += [('Google Books', url) for url in google_books(isbn, cache)]
    return found


def save(image: Image.Image, path: pathlib.Path, width: int) -> None:
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    suffix = path.suffix.lower()
    if suffix == '.png':
        image.save(path, 'PNG', optimize=True)
    elif suffix == '.webp':
        image.convert('RGB').save(path, 'WEBP', quality=84, method=6)
    else:
        image.convert('RGB').save(path, 'JPEG', quality=84, optimize=True, progressive=True)


def watermarked(url: str) -> bool:
    return urllib.parse.urlparse(url or '').netloc in WATERMARKED


def process(src: str, cover: dict, cache: pathlib.Path, write: bool, target: int) -> dict:
    current = Image.open(PUBLIC / src)
    current.load()
    current = current.convert('RGB')
    eff0 = effective_width(current)
    stamped = watermarked(cover.get('imageUrl'))
    entry: dict = {'from': {'width': current.width, 'effective': eff0, **({'watermark': True} if stamped else {})}}
    best = None
    if cover.get('bookId') in REPLACE:
        fix = REPLACE[cover['bookId']]
        image = open_image(fetch(fix['url'], cache))
        if image is None:
            raise RuntimeError(f"{cover['bookId']}: the reviewed replacement could not be downloaded")
        best = (fix['source'], fix['url'], effective_width(image), image, None, 0, False)
        entry['reason'] = fix['reason']
    elif cover.get('bookId') in KEEP:
        entry['status'] = 'kept-by-review'
        entry['reason'] = KEEP[cover['bookId']]
    elif eff0 < target or stamped:
        for source, url in candidates(cover, cache):
            image = open_image(fetch(url, cache))
            if image is None:
                continue
            same, distance, ratio_gap = same_cover(current, image)
            if not same:
                entry.setdefault('rejected', []).append({'source': source, 'url': url, 'distance': distance, 'ratioGap': ratio_gap})
                continue
            eff = effective_width(image)
            stamp = watermarked(url)
            if stamp and not stamped:
                continue  # never put a stamp on a clean cover
            sharper = eff >= max(round(eff0 * 1.25), eff0 + 60)
            cleaner = stamped and not stamp and eff >= round(eff0 * 0.9)
            score = eff * (0.75 if stamp else 1.0)
            if (sharper or cleaner) and (best is None or score > best[5]):
                best = (source, url, eff, image, distance, score, stamp)
    if best:
        source, url, eff, image, distance, _, stamp = best
        # Pixels beyond the real detail only add bytes.
        if image.width > eff:
            image = image.resize((eff, round(image.height * eff / image.width)), Image.LANCZOS)
        entry.update(status='replaced-by-review' if distance is None else 'upgraded', to={'width': min(eff, LARGE), 'effective': eff, 'source': source, 'url': url, **({} if distance is None else {'hashDistance': distance}), **({'watermark': True} if stamp else {})})
        chosen = image
    else:
        entry.setdefault('status', 'kept' if eff0 >= target else 'kept-no-sharper-copy')
        chosen = current if current.width <= eff0 else current.resize((eff0, round(current.height * eff0 / current.width)), Image.LANCZOS)
    if write:
        # A kept cover wider than the large size is only trimmed to it: same picture, fewer bytes.
        if best or current.width > LARGE:
            save(chosen if best else current, PUBLIC / src, LARGE)
        save(chosen, PUBLIC / 'covers' / 'sm' / pathlib.Path(src).name, SMALL)
    return entry


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--cache', required=True, help='download cache directory (kept outside the repository)')
    parser.add_argument('--write', action='store_true', help='write images and data/cover-upgrades.json')
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--only', default='', help='comma-separated book ids')
    parser.add_argument('--target', type=int, default=540, help='real width a cover should reach (default 540)')
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--report', default='', help='also write the full report (with rejected candidates) here')
    args = parser.parse_args()
    cache = pathlib.Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)

    catalog = json.loads((ROOT / 'src/catalog.json').read_text())
    records: dict[str, dict] = {}
    for path in sorted((ROOT / 'data').glob('*.json')):
        try:
            data = json.loads(path.read_text())
        except ValueError:
            continue
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                if isinstance(node.get('src'), str) and node['src'].startswith('covers/'):
                    records.setdefault(node['src'], {}).update({k: v for k, v in node.items() if v})
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    covers: dict[str, dict] = {}
    for book in catalog['books']:
        cover = book.get('cover')
        if cover and cover.get('src') and (not args.only or book['id'] in args.only.split(',')):
            covers.setdefault(cover['src'], {**records.get(cover['src'], {}), **cover, 'bookId': book['id']})
    items = sorted(covers.items())
    if args.limit:
        items = items[:args.limit]

    report: dict[str, dict] = {}
    with futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        jobs = {pool.submit(process, src, cover, cache, args.write, args.target): src for src, cover in items}
        for done, job in enumerate(futures.as_completed(jobs), 1):
            src = jobs[job]
            try:
                report[src] = {'bookId': covers[src]['bookId'], **job.result()}
            except Exception as error:  # keep going; the cover stays as it is
                report[src] = {'bookId': covers[src]['bookId'], 'status': 'error', 'error': str(error)[:200]}
            if done % 50 == 0:
                print(f'{done}/{len(items)}', flush=True)

    counts: dict[str, int] = {}
    for entry in report.values():
        counts[entry['status']] = counts.get(entry['status'], 0) + 1
    print(json.dumps(counts, ensure_ascii=False))
    if args.report:
        pathlib.Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=1))
    if args.write:
        out = {
            'note': 'Each cover\'s real resolution, and the sharper copy of the same cover that replaced it, if any. Written by scripts/upgrade-covers.py.',
            'checkedAt': dt.date.today().isoformat(),
            'target': args.target,
            'covers': {src: {k: v for k, v in entry.items() if k != 'rejected'} for src, entry in sorted(report.items())},
        }
        (ROOT / 'data' / 'cover-upgrades.json').write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n')
    else:
        print(json.dumps(dict(list(sorted(report.items()))[:5]), ensure_ascii=False, indent=1)[:3000])


if __name__ == '__main__':
    main()
