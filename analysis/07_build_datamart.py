"""Build the SIAGA NAPAS datamart: tidy dimension, fact, and model tables (CSV + Parquet) in datamart/data/.

Run after 01-04 and 06 (clean, daily, health model, network/cluster, dashboard export). Re-run whenever raw data is refreshed.
Grain summary
  fact_station_hour          station x hour (not exported to DB; stays in analysis/out)
  fact_station_day           station-hospital x local date      <- core grain
  fact_station_month         station x month                    <- dashboard & chatbot grain
  fact_excess_station_month  station x month x outcome x threshold
  fact_excess_band_month     station x month x PM2.5 band (threshold 25, under-5 + over-60)
"""
import os
from pathlib import Path
import json, math, os, warnings
import numpy as np, pandas as pd
warnings.filterwarnings("ignore")
ROOT = str(Path(__file__).resolve().parents[1])
OUT = f"{ROOT}/analysis/out"; DM = f"{ROOT}/datamart/data"
os.makedirs(DM, exist_ok=True)

f = pd.read_parquet(f"{OUT}/fact_station_day.parquet")
h = pd.read_parquet(f"{OUT}/hourly_clean.parquet")
dim = pd.read_csv(f"{OUT}/dim_station.csv")
arch = pd.read_csv(f"{OUT}/station_archetype.csv").set_index("station")
att = pd.read_parquet(f"{OUT}/attributable.parquet")
er = pd.read_csv(f"{OUT}/exposure_response.csv")
pairs = pd.read_csv(f"{OUT}/station_pairs.csv")
dist = pd.read_csv(f"{OUT}/station_distance_km.csv", index_col=0)
dq = pd.read_csv(f"{OUT}/dq_log.csv")
ARCH = {0: "gambut", 1: "bersih", 2: "ekstrem", 3: "kronis"}
TZ = {"MRS-01": 1, "PLU-01": 1, "SM2-01": 1, "BJB-01": 1, "SRG-01": 2, "MER-01": 2}
ISL = lambda p: "Jawa" if any(k in p for k in ["Jakarta", "Jawa", "Yogyakarta"]) else "Kalimantan" if "Kalimantan" in p else "Sulawesi" if "Sulawesi" in p else "Papua" if "Papua" in p else "Sumatra"
geo = json.load(open(f"{ROOT}/web/public/data/dashboard.json"))
GEO = {s["code"]: s["geo"] for s in geo["stations"]}

def save(df, name):
    df = df.copy()
    for c in df.columns:  # whole-number floats -> nullable int so Postgres int columns accept them
        if df[c].dtype.kind == "f" and df[c].dropna().apply(float.is_integer).all() and df[c].notna().any():
            df[c] = df[c].astype("Int64")
    df.to_csv(f"{DM}/{name}.csv", index=False); df.to_parquet(f"{DM}/{name}.parquet", index=False)
    print(f"{name:32s} {len(df):>7,d} rows")

# ---------- dimensions ----------
dim = dim.merge(pd.read_csv(os.path.join(os.environ.get("DATA_DIR", f"{ROOT}/Dataset DA Gelar Rasa 2026"), "sensors.csv"))[["sensor_id", "nama_sensor"]], on="sensor_id")
d = dim.rename(columns={"station_code": "aqms_code"}).rename(columns={"station": "station_code", "nama_sensor": "station_name", "kota_kabupaten": "kota_kabupaten", "nama_rumah_sakit": "hospital_name",
                        "kapasitas_tempat_tidur": "beds", "traffic_intensity_per_h": "traffic_per_h", "karakteristik_wilayah": "area_character"})
d["island"] = d.provinsi.map(ISL); d["province_geo"] = d.station_code.map(GEO)
d["archetype"] = d.station_code.map(lambda s: ARCH[int(arch.cluster[s])] if s in arch.index else "tanpa-data")
d["tz_offset_h"] = d.station_code.map(lambda s: TZ.get(s, 0))
dim_station = d[["station_code", "aqms_code", "sensor_id", "hospital_id", "location_id", "station_name", "model_sensor", "status_operasional", "tanggal_instalasi", "provinsi", "kota_kabupaten", "kecamatan",
                 "province_geo", "island", "latitude_dd", "longitude_dd", "site_type", "area_character", "archetype", "baseline_pm25", "distance_to_road_m", "traffic_per_h", "tz_offset_h",
                 "hospital_name", "kelas_faskes", "beds"]].rename(columns={"latitude_dd": "lat", "longitude_dd": "lon"})
save(dim_station, "dim_station")
prov = pd.DataFrame([{"province_geo": p["id"], "province_name": p["name"]} for p in geo["provinces"]])
cnt = dim_station.groupby("province_geo").agg(n_stations=("station_code", "size"), island=("island", "first"))
dim_province = prov.join(cnt, on="province_geo"); dim_province["n_stations"] = dim_province.n_stations.fillna(0).astype(int)
save(dim_province, "dim_province")
months = pd.date_range("2024-01-01", "2026-10-01", freq="MS")
dim_month = pd.DataFrame({"month_start": months.date, "year": months.year, "month": months.month,
                          "month_name": [["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][m - 1] for m in months.month],
                          "is_haze_season": months.month.isin([8, 9, 10])})
save(dim_month, "dim_month")

# ---------- facts ----------
fd = f.rename(columns={"station": "station_code", "temperature_c": "temp_station_c", "humidity_pct": "rh_station_pct", "wind_speed_ms": "wind_speed_ms", "wind_dir_vec": "wind_dir_deg",
                       "n_valid_h": "n_valid_hours", "temp_c": "temp_hosp_c", "dptp_c": "dewpoint_hosp_c", "rhum_pct": "rh_hosp_pct", "resp_admissions_under5": "resp_u5",
                       "resp_admissions_over60": "resp_o60", "asthma_emergency_cases": "asthma", "copd_admissions": "copd", "ispu_cat": "ispu_category"})
fd = fd[fd.date >= "2024-01-01"]
cols = ["station_code", "hospital_id", "date", "pm25", "pm10", "so2", "no2", "co_8h_max", "o3_8h_max", "pm25_1h_max", "hours_gt_55", "n_valid_hours", "day_valid", "exceed_55",
        "ispu", "ispu_category", "ispu_critical", "temp_station_c", "rh_station_pct", "wind_speed_ms", "wind_dir_deg", "temp_hosp_c", "dewpoint_hosp_c", "rh_hosp_pct",
        "resp_u5", "resp_o60", "asthma", "copd", "resp", "cvd", "death"]
fd = fd[cols].copy(); fd["ispu_category"] = fd.ispu_category.astype("string")
for c in ["pm25", "pm10", "so2", "no2", "co_8h_max", "o3_8h_max", "pm25_1h_max", "ispu"]: fd[c] = fd[c].round(2)
save(fd, "fact_station_day")

fd["month_start"] = fd.date.values.astype("datetime64[M]")
v = fd[fd.day_valid]
m1 = v.groupby(["station_code", "month_start"]).agg(pm25_mean=("pm25", "mean"), valid_days=("day_valid", "size"), exceed_days=("exceed_55", "sum"),
                                                    very_unhealthy_days=("ispu", lambda s: int((s > 200).sum())))
m2 = fd.groupby(["station_code", "month_start"]).agg(days=("date", "size"), obs_resp_u5=("resp_u5", "sum"), obs_resp_o60=("resp_o60", "sum"), obs_resp=("resp", "sum"),
                                                     obs_asthma=("asthma", "sum"), obs_copd=("copd", "sum"), obs_cvd=("cvd", "sum"), obs_death=("death", "sum"))
fm = m2.join(m1).reset_index(); fm["valid_days"] = fm.valid_days.fillna(0).astype(int); fm["exceed_days"] = fm.exceed_days.fillna(0).astype(int)
fm["very_unhealthy_days"] = fm.very_unhealthy_days.fillna(0).astype(int); fm["pm25_mean"] = fm.pm25_mean.round(2)
save(fm, "fact_station_month")

att["month_start"] = att.date.values.astype("datetime64[M]")
OUTN = {"resp_admissions_under5": "resp_u5", "resp_admissions_over60": "resp_o60", "asthma_emergency_cases": "asthma", "copd_admissions": "copd", "resp": "resp", "cvd": "cvd", "death": "death"}
ex = att.groupby(["station", "month_start", "outcome", "c0"]).excess.sum().reset_index()
ex = ex.rename(columns={"station": "station_code", "c0": "threshold", "excess": "excess_cases"}); ex["outcome"] = ex.outcome.map(OUTN); ex["excess_cases"] = ex.excess_cases.round(2)
save(ex, "fact_excess_station_month")
a25 = att[(att.c0 == 25) & att.outcome.isin(["resp_admissions_under5", "resp_admissions_over60"])].copy()
a25["pm_band"] = pd.cut(a25.pm25, [0, 25, 55, 150, 250, 1e5], labels=["0-25", "25-55", "55-150", "150-250", "250+"])
xb = a25.groupby(["station", "month_start", "pm_band"], observed=True).excess.sum().reset_index().rename(columns={"station": "station_code", "excess": "excess_cases"})
xb = xb[xb.pm_band != "0-25"]; xb["excess_cases"] = xb.excess_cases.round(2); xb["pm_band"] = xb.pm_band.astype(str)
save(xb, "fact_excess_band_month")

# ---------- aggregates & models ----------
hh = h[h.valid].join(arch.cluster.map(ARCH).rename("archetype"), on="station"); hh["hour_local"] = hh.ts_local.dt.hour
hh["daytype"] = np.where(hh.ts_local.dt.dayofweek >= 5, "akhir_pekan", "hari_kerja")
di = hh.groupby(["archetype", "daytype", "hour_local"]).pm25.mean().reset_index()
di["ratio_to_daily_mean"] = (di.pm25 / di.groupby(["archetype", "daytype"]).pm25.transform("mean")).round(4); di = di.rename(columns={"pm25": "pm25_mean"}); di["pm25_mean"] = di.pm25_mean.round(2)
save(di, "agg_diurnal")
hw = h[h.valid].copy(); SEC = ["U", "TL", "T", "Tg", "S", "BD", "B", "BL"]
hw["sector"] = pd.cut((hw.wind_direction_deg + 22.5) % 360, np.arange(0, 361, 45), labels=SEC, include_lowest=True)
ws = hw.groupby(["station", "sector"], observed=False).agg(pm25_mean=("pm25", "mean"), hours=("pm25", "size")).reset_index()
ws["share_pct"] = (ws.hours / ws.groupby("station").hours.transform("sum") * 100).round(2); ws["pm25_mean"] = ws.pm25_mean.round(2)
save(ws.rename(columns={"station": "station_code"}).drop(columns="hours"), "agg_wind_sector")
er2 = er.copy(); er2["outcome"] = er2.outcome.map(OUTN); er2["rr_vs_15"] = er2.rr_vs_15.round(4); save(er2, "model_exposure_response")
ev_js = geo["event"]; save(pd.DataFrame([{"outcome": {"u5": "resp_u5", "o60": "resp_o60", "cvd": "cvd", "pm": "pm25"}[k], "day_offset": p[0], "ratio_to_prev_week": p[1]} for k, pts in ev_js.items() for p in pts]), "model_event_study")
save(pd.DataFrame([{"outcome": k, "pct_increase_per_doubling": v} for k, v in {"resp_u5": 57.1, "resp_o60": 54.8, "asthma": 54.6, "copd": 59.5, "cvd": 31.8, "death": 40.8}.items()]), "model_pct_doubling")
save(pd.DataFrame(geo["importance"], columns=["feature", "permutation_importance"]), "model_importance")
ac = arch.reset_index().rename(columns={"station": "station_code", "cluster": "cluster_id"}); ac["archetype"] = ac.cluster_id.map(ARCH)
save(ac.round(3), "model_station_archetype")

# ---------- quality & network ----------
cap = (h.groupby("station").valid.mean() * 100).round(2)
issue = {"JMB-02": "Sensor rusak: 99,5% data tidak valid", "MER-01": "Hanya 20% jam valid", "MDN-01": "5 bulan data hilang", "BJB-01": "Macet 9 bulan, tetap berlabel VALID",
         "PLB-01": "14% jam hilang, data 15 menitan", "KTG-02": "Kembar dengan KTG-01 (r = 1,000)"}
y25 = v[v.date.dt.year == 2025]
iku = y25.groupby("station_code")[["so2", "no2"]].mean(); iku = (100 - (50 / 0.9) * (((iku.no2 / 40) + (iku.so2 / 20)) / 2 - 0.1)).clip(upper=100)
f2 = fd.join(dim_station.set_index("station_code").beds, on="station_code").sort_values(["station_code", "date"])
f2["p100"] = f2.resp / f2.beds * 100; f2["r7"] = f2.groupby("station_code").p100.transform(lambda s: s.rolling(7).mean())
sq = pd.DataFrame({"capture_pct": cap, "nearest_km": dist.replace(0, np.nan).min().round(1), "iku_2025": iku.round(1), "exceed_days_2025": y25.groupby("station_code").exceed_55.sum(),
                   "resp_per100bed_normal": f2[f2.date.dt.month <= 6].groupby("station_code").p100.mean().round(2), "resp_per100bed_peak7": f2.groupby("station_code").r7.max().round(2)})
sq.index.name = "station_code"; sq = sq.reset_index(); sq["issue"] = sq.station_code.map(issue).fillna("")
sq["is_reliable"] = (sq.capture_pct >= 85) & ~sq.issue.str.startswith("Macet")
save(sq, "station_quality")
save(pairs.rename(columns={"a": "station_a", "b": "station_b", "km": "distance_km", "r": "pearson_r", "mad": "mean_abs_diff"}).round(3), "station_pair")
save(dq, "dq_log")
print("done ->", DM)
