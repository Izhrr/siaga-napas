"""Profile raw AQMS files: schema, timestamp regularity, duplicates, qc flags, value ranges."""
import glob, os, re
import pandas as pd, numpy as np
D = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/Dataset DA Gelar Rasa 2026"
OUT = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/analysis/out"
frames = []
for f in sorted(glob.glob(f"{D}/*_AQMS.csv")):
    df = pd.read_csv(f, dtype=str)
    vals = [c for c in df.columns[4:14]]
    num = df[vals].apply(pd.to_numeric, errors="coerce")
    df["n_err_strings"] = (num.isna() & df[vals].notna()).sum(axis=1)
    df[vals] = num
    code = re.match(r"([A-Z0-9]+-\d+)", os.path.basename(f)).group(1)
    df["file_code"] = code
    df.columns = [c.replace("_ppm", "_raw").replace("_ug_m3", "_raw") for c in df.columns]
    df["unit_in_header"] = "ppm" if "pm25_ppm" in pd.read_csv(f, nrows=0).columns else "ug_m3"
    frames.append(df)
raw = pd.concat(frames, ignore_index=True)
raw["ts"] = pd.to_datetime(raw["timestamp_start"], format="mixed")
raw["te"] = pd.to_datetime(raw["timestamp_end"], format="mixed")
raw.to_parquet(f"{OUT}/raw_hourly.parquet")
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 40); pd.set_option("display.max_rows", 200)
g = raw.groupby("file_code")
prof = pd.DataFrame({
  "rows": g.size(),
  "sensor_ids": g["sensor_id"].nunique(),
  "sensor": g["sensor_id"].first(),
  "unit": g["unit_in_header"].first(),
  "ts_min": g["ts"].min(), "ts_max": g["ts"].max(),
  "dup_ts": g["ts"].apply(lambda s: s.duplicated().sum()),
  "dup_mid": g["measurement_id"].apply(lambda s: s.duplicated().sum()),
  "nonzero_min": g["ts"].apply(lambda s: (s.dt.minute != 0).sum() + (s.dt.second != 0).sum()),
  "dur_not_1h": g.apply(lambda d: ((d.te - d.ts) != pd.Timedelta("1h")).sum()),
})
print(prof)
print("\nQC flags by station (%)")
print((pd.crosstab(raw.file_code, raw.qc_flag, normalize="index")*100).round(2))
print("\nNull % per column by station")
cols = ["pm25_raw","pm10_raw","so2_raw","co_raw","o3_raw","no2_raw","temperature_c","humidity_pct","wind_speed_ms","wind_direction_deg"]
print((raw.groupby("file_code")[cols].apply(lambda d: d.isna().mean()*100)).round(1))
print("\nMedian values by station")
print(raw.groupby("file_code")[cols].median().round(3))
print("\nNegative counts"); print(raw.groupby("file_code")[cols].apply(lambda d: (d<0).sum()).loc[lambda x: x.sum(axis=1)>0])
