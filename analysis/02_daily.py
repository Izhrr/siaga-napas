"""Station-day datamart (grain: station x local date) + join to hospital-day (1:1 via booklet mapping)."""
import numpy as np, pandas as pd
OUT = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/analysis/out"
D = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/Dataset DA Gelar Rasa 2026"
h = pd.read_parquet(f"{OUT}/hourly_clean.parquet")
POLL = ["pm25", "pm10", "so2", "co", "o3", "no2"]
v = h.copy()
for c in POLL + ["temperature_c", "humidity_pct", "wind_speed_ms"]:
    v.loc[~v.valid, c] = np.nan
v["date"] = v.ts_local.dt.normalize()
# 8h rolling max for CO/O3 (min 6 of 8 hours)
v = v.sort_values(["station", "ts_local"])
for c in ["co", "o3"]:
    v[f"{c}_8h"] = v.groupby("station")[c].transform(lambda s: s.rolling(8, min_periods=6).mean())
g = v.groupby(["station", "date"])
d = g[["pm25", "pm10", "so2", "no2", "temperature_c", "humidity_pct", "wind_speed_ms"]].mean()
d["co_8h_max"] = g["co_8h"].max(); d["o3_8h_max"] = g["o3_8h"].max()
d["pm25_1h_max"] = g["pm25"].max()
d["n_valid_h"] = g["valid"].sum()
d["hours_gt_55"] = g["pm25"].apply(lambda s: (s > 55.4).sum())
# vector-mean wind direction
rad = np.deg2rad(v["wind_direction_deg"].where(v.valid))
v["u"] = np.sin(rad) * v.wind_speed_ms; v["w"] = np.cos(rad) * v.wind_speed_ms
uv = v.groupby(["station", "date"])[["u", "w"]].mean()
d["wind_dir_vec"] = (np.rad2deg(np.arctan2(uv.u, uv.w)) % 360).round(0)
d = d.reset_index()
d["day_valid"] = (d.n_valid_h >= 18).astype(bool)
# EPA App. N style exception: incomplete day still counts as exceedance if mean of available hours > standard
d["exceed_55"] = np.where(d.day_valid, (d.pm25 > 55).astype(float),
                  np.where((d.n_valid_h >= 6) & (d.pm25 > 55), 1.0, np.nan))

BP = {  # Permen LHK 14/2020 upper bounds for ISPU 50/100/200/300/500
    "pm25": [15.5, 55.4, 150.4, 250.4, 500], "pm10": [50, 150, 350, 420, 500],
    "so2": [52, 180, 400, 800, 1200], "no2": [80, 200, 1130, 2260, 3000],
    "co_8h_max": [4000, 8000, 15000, 30000, 45000], "o3_8h_max": [120, 235, 400, 800, 1000]}
IDX = [0, 50, 100, 200, 300, 500]
def ispu(x, bps):
    if pd.isna(x): return np.nan
    lo_c = 0
    for i, hi_c in enumerate(bps):
        if x <= hi_c:
            return IDX[i] + (IDX[i + 1] - IDX[i]) * (x - lo_c) / (hi_c - lo_c)
        lo_c = hi_c
    return 500.0
for c, bps in BP.items():
    d[f"ispu_{c.split('_')[0]}"] = d[c].apply(lambda x: ispu(x, bps))
sub = [f"ispu_{c.split('_')[0]}" for c in BP]
d["ispu"] = d[sub].max(axis=1)
d["ispu_critical"] = d[sub].fillna(-1).idxmax(axis=1).str.replace("ispu_", "").where(d.ispu.notna())
d["ispu_cat"] = pd.cut(d.ispu, [-1, 50, 100, 200, 300, 9999],
                       labels=["Baik", "Sedang", "Tidak Sehat", "Sangat Tidak Sehat", "Berbahaya"])
d.loc[~d.day_valid, ["ispu", "ispu_cat", "ispu_critical"]] = np.nan

sites = pd.read_csv(f"{D}/sites.csv"); sens = pd.read_csv(f"{D}/sensors.csv"); hosp = pd.read_csv(f"{D}/hospitals.csv")
sites["station"] = sites.location_id.str.replace("LOC-", "")
sens["station"] = sens.location_id.str.replace("LOC-", "")
m = sites.merge(sens[["station", "sensor_id", "status_operasional", "tanggal_instalasi", "model_sensor"]], on="station")
m["hospital_id"] = "RS-XXX-" + m.sensor_id.str[-2:]
m = m.merge(hosp, on="hospital_id", suffixes=("", "_rs"))
m.to_csv(f"{OUT}/dim_station.csv", index=False)

hl = pd.read_csv(f"{D}/HLT-01_health_outcomes_daily.csv", parse_dates=["date"])
hl = hl.merge(m[["hospital_id", "station"]], on="hospital_id")
fact = hl.merge(d, on=["station", "date"], how="left")
fact["day_valid"] = fact.day_valid.fillna(False).astype(bool)
fact.to_parquet(f"{OUT}/fact_station_day.parquet")
d.to_parquet(f"{OUT}/air_daily.parquet")
print(fact.shape, "valid days %", round(fact.day_valid.mean() * 100, 1))
print(fact.groupby("station").agg(pm25=("pm25", "mean"), exceed=("exceed_55", "mean"), valid=("day_valid", "mean")).round(2).sort_values("pm25").to_string())
