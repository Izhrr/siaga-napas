"""Export data for the dashboard (web/public/data/dashboard.json).

Grain exported: station x month (time is a filter dimension: year, season), plus static
station attributes, province polygons (pre-projected SVG paths), model curves and events.
Province geometry: assets/geo/indonesia-prov.geojson (BAKOSURTANAL 1:250.000, 34 provinsi),
used only as a basemap; no analysis uses it.
"""
from pathlib import Path
import json, math, os, warnings
import numpy as np, pandas as pd
warnings.filterwarnings("ignore")
ROOT = str(Path(__file__).resolve().parents[1])
OUT = f"{ROOT}/analysis/out"

f = pd.read_parquet(f"{OUT}/fact_station_day.parquet")
h = pd.read_parquet(f"{OUT}/hourly_clean.parquet")
dim = pd.read_csv(f"{OUT}/dim_station.csv").set_index("station")
arch = pd.read_csv(f"{OUT}/station_archetype.csv").set_index("station")
att = pd.read_parquet(f"{OUT}/attributable.parquet")
er = pd.read_csv(f"{OUT}/exposure_response.csv")
ARCH = {0: "gambut", 1: "bersih", 2: "ekstrem", 3: "kronis"}

# ---------------- geometry ----------------
geo = json.load(open(f"{ROOT}/assets/geo/indonesia-prov.geojson"))
LON0, LAT0, K = 94.6, 6.4, 22.0          # 1° = 22 units -> width ~1030
proj = lambda lon, lat: ((lon - LON0) * K, (LAT0 - lat) * K)
def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]; dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy) or 1e-12
    d = [abs(dy * x - dx * y + x2 * y1 - y2 * x1) / n for x, y in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps: return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]
def area(r): return 0.5 * abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r))))
def inside(pt, ring):
    x, y = pt; c = False
    for i in range(len(ring)):
        x1, y1 = ring[i - 1]; x2, y2 = ring[i]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-15) + x1: c = not c
    return c
TITLE = {"DI. ACEH": "Aceh", "NUSATENGGARA BARAT": "Nusa Tenggara Barat", "DAERAH ISTIMEWA YOGYAKARTA": "DI Yogyakarta", "DKI JAKARTA": "DKI Jakarta",
         "PAPUA BARAT": "Papua Barat (incl. Papua Barat Daya)", "PAPUA": "Papua (incl. Papua Selatan)"}
provs = []
for ft in geo["features"]:
    nm = ft["properties"]["Propinsi"]; g = ft["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    rings_raw = [p[0] for p in polys]
    big = max(area(r) for r in rings_raw)
    d = []
    for r in rings_raw:
        a = area(r)
        if a < 0.004 and a < big: continue
        ring = [tuple(x) for x in r]; half = len(ring) // 2  # closed ring: simplify two open halves
        pr = rdp(ring[:half + 1], 0.025)[:-1] + rdp(ring[half:], 0.025)
        if len(pr) < 4: continue
        d.append("M" + "L".join(f"{proj(x, y)[0]:.1f},{proj(x, y)[1]:.1f}" for x, y in pr) + "Z")
    provs.append({"id": nm, "name": TITLE.get(nm, nm.title()), "d": "".join(d), "rings": rings_raw})

for s, r in dim.iterrows():
    hit = [p["id"] for p in provs if any(inside((r.longitude_dd, r.latitude_dd), ring) for ring in p["rings"])]
    if not hit:  # coastal point off simplified ring: nearest ring vertex
        best = min(provs, key=lambda p: min(math.hypot(x - r.longitude_dd, y - r.latitude_dd) for ring in p["rings"] for x, y in ring[::5]))
        hit = [best["id"]]
    dim.loc[s, "prov_geo"] = hit[0]
for p in provs: p.pop("rings")

# ---------------- monthly grain ----------------
v = f.copy(); v["ym"] = v.date.dt.strftime("%Y-%m")
v = v[v.date >= "2024-01-01"]
vv = v[v.day_valid]
mon = vv.groupby(["station", "ym"]).agg(pm=("pm25", "mean"), vd=("day_valid", "size"), exc=("exceed_55", "sum"),
                                       haz=("ispu", lambda s: int((s > 200).sum())))
obs = v.groupby(["station", "ym"])[["resp_admissions_under5", "resp_admissions_over60", "resp"]].sum()
att["ym"] = att.date.dt.strftime("%Y-%m")
ex = att[att.outcome.isin(["resp_admissions_under5", "resp_admissions_over60"])].groupby(["station", "ym", "outcome", "c0"]).excess.sum().unstack(["outcome", "c0"])
a25 = att[(att.c0 == 25) & att.outcome.isin(["resp_admissions_under5", "resp_admissions_over60"])].copy()
a25["band"] = pd.cut(a25.pm25, [0, 25, 55, 150, 250, 1e5], labels=["b0", "b1", "b2", "b3", "b4"])
xb = a25.groupby(["station", "ym", "band"], observed=False).excess.sum().unstack("band").fillna(0)
months = sorted(v.ym.unique())
M = {}
for s in dim.index:
    rows = []
    for ym in months:
        r = {}
        if (s, ym) in mon.index:
            m = mon.loc[(s, ym)]; r.update(pm=round(float(m.pm), 1), vd=int(m.vd), exc=int(m.exc), haz=int(m.haz))
        if (s, ym) in obs.index:
            o = obs.loc[(s, ym)]; r.update(ou=int(o.resp_admissions_under5), oo=int(o.resp_admissions_over60))
        if (s, ym) in ex.index:
            e = ex.loc[(s, ym)]
            r["xu"] = [round(float(e[("resp_admissions_under5", c)]), 1) for c in (15, 25, 37.5, 55)]
            r["xo"] = [round(float(e[("resp_admissions_over60", c)]), 1) for c in (15, 25, 37.5, 55)]
        if (s, ym) in xb.index:
            r["xb"] = [round(float(xb.loc[(s, ym), b]), 1) for b in ["b1", "b2", "b3", "b4"]]
        rows.append(r)
    M[s] = rows

# ---------------- static station attributes ----------------
cap = h.groupby("station").valid.mean() * 100
issue = {"JMB-02": "Sensor rusak: 99,5% data tidak valid", "MER-01": "Hanya 20% jam valid", "MDN-01": "5 bulan data hilang",
         "BJB-01": "Macet 9 bulan, tetap berlabel VALID", "PLB-01": "14% jam hilang, data 15 menitan", "KTG-02": "Kembar dengan KTG-01 (r = 1,000)"}
y25 = vv[vv.date.dt.year == 2025]
iku = y25.groupby("station")[["so2", "no2"]].mean(); iku = (100 - (50 / 0.9) * (((iku.no2 / 40) + (iku.so2 / 20)) / 2 - 0.1)).clip(upper=100)
exc25 = y25.groupby("station").exceed_55.sum()
f2 = f.join(dim[["kapasitas_tempat_tidur"]], on="station").sort_values(["station", "date"])
f2["p100"] = f2.resp / f2.kapasitas_tempat_tidur * 100; f2["r7"] = f2.groupby("station").p100.transform(lambda s: s.rolling(7).mean())
off100 = f2[f2.date.dt.month.isin([1, 2, 3, 4, 5, 6])].groupby("station").p100.mean(); peak100 = f2.groupby("station").r7.max()
dist = pd.read_csv(f"{OUT}/station_distance_km.csv", index_col=0)
nn = dist.replace(0, np.nan).min()
stations = []
for s, r in dim.iterrows():
    a = arch.loc[s] if s in arch.index else None
    stations.append(dict(code=s, kota=r.kota_kabupaten.replace("Kota Administrasi ", "").replace("Kabupaten ", "Kab. "),
        prov=r.provinsi, geo=r.prov_geo, lat=r.latitude_dd, lon=r.longitude_dd, x=round(proj(r.longitude_dd, r.latitude_dd)[0], 1), y=round(proj(r.longitude_dd, r.latitude_dd)[1], 1),
        site=r.site_type, status=r.status_operasional, arch=ARCH[int(a.cluster)] if a is not None else "tanpa-data",
        off=None if a is None else round(float(a.offseason_pm25), 1), mult=None if a is None else round(float(a.haze_multiplier), 2),
        esc=None if a is None else round(float(a.escalation), 2), h24=None if a is None else round(float(a.haze24)), h26=None if a is None else round(float(a.haze26)),
        traffic=int(r.traffic_intensity_per_h), road=float(r.distance_to_road_m), beds=int(r.kapasitas_tempat_tidur), kelas=r.kelas_faskes,
        cap=round(float(cap[s]), 1), issue=issue.get(s, ""), iku=None if s not in iku.index else round(float(iku[s])),
        exc25=None if s not in exc25.index else int(exc25[s]), off100=round(float(off100[s]), 1), peak100=round(float(peak100[s]), 1),
        nn=round(float(nn[s])), baseline=float(r.baseline_pm25)))

hh = h[h.valid].join(arch.cluster.map(ARCH).rename("arch"), on="station"); hh["hr"] = hh.ts_local.dt.hour
hh["we"] = hh.ts_local.dt.dayofweek >= 5
diur = hh.groupby(["arch", "hr"]).pm25.mean().unstack(0); diur = (diur / diur.mean()).round(3)
we = hh.groupby(["we", "hr"]).pm25.mean().unstack(0); we = (we / we.values.mean()).round(3)
curve = er[er.outcome.isin(["resp_admissions_under5", "resp_admissions_over60", "cvd", "death"]) & (er.pm25 <= 300)]
curves = {o: [[float(p), round(float(rr), 3)] for p, rr in zip(g.pm25, g.rr_vs_15)] for o, g in curve.groupby("outcome")}
g = f.sort_values(["station", "date"]).reset_index(drop=True)
g["pmf"] = g.groupby("station").pm25.transform(lambda s: s.interpolate(limit=3))
g["d"] = g.groupby("station").pmf.diff(); g["rel"] = g.d / g.groupby("station").pmf.shift()
rows = []
for i, r in g[(g.rel > 0.5) & (g.d > 20)].iterrows():
    sub = g[g.station == r.station]; idx = sub.index.get_loc(i)
    if idx < 7: continue
    base = sub.iloc[idx - 7:idx][["resp_admissions_under5", "resp_admissions_over60", "cvd", "pmf"]].mean()
    for k in range(-7, 8):
        if idx + k < len(sub):
            q = sub.iloc[idx + k]
            rows.append(dict(k=k, u5=q.resp_admissions_under5 / base.resp_admissions_under5, o60=q.resp_admissions_over60 / base.resp_admissions_over60, cvd=q.cvd / base.cvd, pm=q.pmf / base.pmf))
ev = pd.DataFrame(rows).groupby("k").median().round(2)
event = {c: [[int(k), float(x)] for k, x in ev[c].items()] for c in ev.columns}
hw = h[h.valid & h.station.isin(["PLB-01", "PKU-01", "JKT-02"])].copy()
hw["sec"] = pd.cut((hw.wind_direction_deg + 22.5) % 360, np.arange(0, 361, 45), labels=["U", "TL", "T", "Tg", "S", "BD", "B", "BL"], include_lowest=True)
wind = {st: {"pm": [None if pd.isna(x) else round(float(x), 1) for x in g2.groupby("sec", observed=False).pm25.mean()],
             "share": [round(float(x), 1) for x in g2.groupby("sec", observed=False).size() / len(g2) * 100]} for st, g2 in hw.groupby("station")}
pct2x = {"Asma": 54.6, "PPOK": 59.5, "ISPA balita": 57.1, "ISPA lansia": 54.8, "Kematian": 40.8, "Kardiovaskular": 31.8}

data = dict(meta=dict(period="1 Jan 2024 – 14 Okt 2026", updated="14 Okt 2026", n=27),
            provinces=provs, stations=stations, months=months, monthly=M,
            diurnal={a: [float(x) for x in diur[a]] for a in diur.columns},
            weekpart={"kerja": [float(x) for x in we[False]], "akhir": [float(x) for x in we[True]]},
            curves=curves, event=event, pct2x=pct2x, wind=wind,
            importance=[["Musim (bulan)", 0.78], ["Jarak ke jalan", 0.59], ["Lalu lintas", 0.14], ["Lahan gambut", 0.11], ["Tahun", 0.09], ["Kelembapan", 0.08], ["Suhu", 0.03], ["Kecepatan angin", 0.02]])
WEB = f"{ROOT}/web/public/data/dashboard.json"; os.makedirs(os.path.dirname(WEB), exist_ok=True)
with open(WEB, "w") as fh:
    json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
print("ok", round(os.path.getsize(WEB) / 1024), "KB")
print(dim.prov_geo.value_counts().to_dict())
