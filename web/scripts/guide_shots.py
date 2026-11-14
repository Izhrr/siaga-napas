"""Ambil screenshot tiap halaman + panel Tanya Data untuk Panduan, beserta posisi penanda bernomor.

Pakai (server harus jalan, mis. port 3100, dengan database berisi minimal satu percakapan ber-grafik):
  analysis/.venv/bin/python web/scripts/guide_shots.py http://localhost:3100
Hasil: web/public/guide/<halaman>.jpg dan web/src/lib/guide-shots.json (posisi penanda dalam persen).
Jalankan ulang setiap kali tata letak berubah.
"""
import asyncio, io, json, sys
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100"
WEB = Path(__file__).resolve().parents[1]
OUT_IMG, OUT_JSON = WEB / "public/guide", WEB / "src/lib/guide-shots.json"
PAGES = ["ringkasan", "waktu", "pemicu", "dampak", "jaringan"]
W, H = 1440, 900

JS_PAGE = """() => {
  const r = (el) => el.getBoundingClientRect(), out = [];
  const push = (key, el) => { if (!el) return; const b = r(el); out.push({ key, x: b.left, y: b.top }); };
  push('filter', document.querySelector('.filters'));
  push('crit', document.querySelector('.crit'));
  push('kpi', document.querySelector('.kpis'));
  document.querySelectorAll('.grid .card').forEach((c) => push(c.querySelector('h2').textContent, c));
  push('ai', document.querySelector('.ai-dock'));
  return out; }"""
JS_CHAT = """() => {
  const d = document.querySelector('.drawer').getBoundingClientRect(), out = [];
  // penanda di tepi kiri panel, sejajar tengah elemen (tidak menutupi teks)
  const push = (key, el) => { if (!el) return; const b = el.getBoundingClientRect(); out.push({ key, x: 3, y: b.top - d.top + b.height / 2 }); };
  const tools = document.querySelectorAll('.drawer .dr-tools');
  push('hist', tools[0]); push('q', document.querySelector('.drawer .bub'));
  push('ans', document.querySelector('.drawer .ans p')); push('chart', document.querySelector('.drawer .ans figure'));
  push('sug', tools[tools.length - 1]); push('input', document.querySelector('.drawer .dr-f'));
  return { w: d.width, h: d.height, x: d.left, items: out }; }"""

def save_jpg(png: bytes, path: Path, crop=None):
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if crop: im = im.crop(crop)
    im.save(path, quality=84, optimize=True)

async def main():
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        pg = await b.new_page(viewport={"width": W, "height": H})
        await pg.goto(f"{BASE}/ringkasan"); await pg.evaluate("sessionStorage.clear(); localStorage.setItem('jernih-theme','light')")
        for page in PAGES:
            await pg.goto(f"{BASE}/{page}"); await pg.wait_for_timeout(1800)
            items = await pg.evaluate(JS_PAGE)
            save_jpg(await pg.screenshot(), OUT_IMG / f"{page}.jpg")
            res[page] = {"w": W, "h": H, "markers": [{"key": it["key"], "x": round(it["x"] / W * 100, 2), "y": round(it["y"] / H * 100, 2)} for it in items]}
        await pg.goto(f"{BASE}/ringkasan"); await pg.wait_for_timeout(1500)
        await pg.click(".ai-dock"); await pg.wait_for_timeout(400)
        await pg.click(".drawer >> text=Riwayat"); await pg.wait_for_timeout(800)
        await pg.locator(".hist button", has_text="RS mana").first.click(); await pg.wait_for_timeout(900)
        ch = await pg.evaluate(JS_CHAT)
        save_jpg(await pg.screenshot(), OUT_IMG / "tanya.jpg", crop=(int(ch["x"]), 0, W, H))
        res["tanya"] = {"w": ch["w"], "h": ch["h"], "markers": [{"key": it["key"], "x": round(it["x"] / ch["w"] * 100, 2), "y": round(it["y"] / ch["h"] * 100, 2)} for it in ch["items"]]}
        await b.close()
    OUT_JSON.write_text(json.dumps(res, ensure_ascii=False, indent=1))
    print({k: len(v["markers"]) for k, v in res.items()})

asyncio.run(main())
