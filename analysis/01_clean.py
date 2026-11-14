"""Clean hourly AQMS data into a regular station x hour grid (µg/m³, WIB + local time).

Rules (each one is logged to out/dq_log.csv):
  R1  Drop rows with timestamp outside 2024-01-01..2026-10-14 (JMB-02 has 1970 epoch rows).
  R2  Snap clock drift: round timestamp_start to the nearest hour (offsets are seconds-minutes).
  R3  PLB-01 sub-hourly 15-min windows: average quarter-hours into their hour, prefer native 1h row.
  R4  Unit harmonisation for loggers exporting "ppm" (MDN-01, PSW-01, BJB-01):
        PM: mg/m³ mislabelled as ppm -> x1000; gases: true ppm -> µg/m³ at 25°C, 1 atm.
  R5  Only qc_flag == VALID is used for official metrics.
  R8  Stuck sensor: >=6h identical PM2.5 while flagged VALID -> invalid.
  R6  Physical limits: negative or sentinel values -> NaN; PM2.5 > PM10*1.05 -> flagged.
  R7  Reindex to a full hourly grid so missing hours are explicit.
"""
import glob, os, re
import numpy as np, pandas as pd

D = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/Dataset DA Gelar Rasa 2026"
OUT = "/Users/izhar/Personal/Lomba/Gelar Rasa 2026/analysis/out"
POLL = ["pm25", "pm10", "so2", "co", "o3", "no2"]
MET = ["temperature_c", "humidity_pct", "wind_speed_ms", "wind_direction_deg"]
MOLAR = {"so2": 64.066, "co": 28.010, "o3": 47.998, "no2": 46.006}
TZ_OFFSET = {"MRS-01": 1, "PLU-01": 1, "SM2-01": 1, "BJB-01": 1, "SRG-01": 2, "MER-01": 2}
START, END = pd.Timestamp("2024-01-01 00:00"), pd.Timestamp("2026-10-14 23:00")

log = []
def L(station, rule, n, note=""):
    log.append({"station": station, "rule": rule, "rows": int(n), "note": note})

frames = []
for f in sorted(glob.glob(f"{D}/*_AQMS.csv")):
    code = re.match(r"([A-Z0-9]+-\d+)", os.path.basename(f)).group(1)
    df = pd.read_csv(f, dtype=str)
    unit = "ppm" if "pm25_ppm" in df.columns else "ug_m3"
    df.columns = [re.sub(r"_(ppm|ug_m3)$", "", c) for c in df.columns]
    L(code, "R0 raw rows", len(df))
    vals = POLL + MET
    num = df[vals].apply(pd.to_numeric, errors="coerce")
    n_err = int((num.isna() & df[vals].notna()).any(axis=1).sum())
    if n_err:
        L(code, "R0 error strings in value cells", n_err, "0xDEADBEEF, ERR_COMM_TIMEOUT, #VALUE!, ...")
    df[vals] = num
    df["ts"] = pd.to_datetime(df["timestamp_start"], format="mixed")
    df["te"] = pd.to_datetime(df["timestamp_end"], format="mixed")

    out_range = (df.ts < START - pd.Timedelta("30min")) | (df.ts > END + pd.Timedelta("30min"))
    if out_range.any():
        L(code, "R1 timestamp outside period", out_range.sum(), str(df.loc[out_range, "ts"].dt.year.unique()))
    df = df[~out_range].copy()

    drift = (df.ts - df.ts.dt.round("h")).abs()
    if (drift > pd.Timedelta(0)).any():
        L(code, "R2 clock drift snapped", (drift > pd.Timedelta(0)).sum(), f"max offset {drift.max()}")

    sub = (df.te - df.ts) < pd.Timedelta("1h")
    if sub.any():
        L(code, "R3 sub-hourly rows", sub.sum(), "15-min windows")
        df["hour"] = df.ts.dt.floor("h")
        native = df[~sub]
        quarter = df[sub & df.qc_flag.eq("VALID")].groupby("hour")[vals].mean()
        native = native.set_index("hour")
        # hours where native row is not VALID but quarter-hours are -> use quarter mean
        fill_idx = quarter.index.difference(native.index[native.qc_flag.eq("VALID")])
        L(code, "R3 hours rebuilt from 15-min mean", len(fill_idx))
        fill = quarter.loc[fill_idx].assign(qc_flag="VALID")
        native = native.drop(index=fill_idx, errors="ignore")
        df = pd.concat([native, fill]).reset_index().rename(columns={"index": "hour"})
    else:
        df["hour"] = df.ts.dt.round("h")

    dup = df.duplicated("hour", keep="first")
    if dup.any():
        L(code, "R2 duplicate hour after snapping", dup.sum())
    df = df[~dup]

    if unit == "ppm":
        df["pm25"] *= 1000; df["pm10"] *= 1000
        for g, mw in MOLAR.items():
            df[g] = df[g] * mw * 1000 / 24.45
        L(code, "R4 unit converted ppm->µg/m³", len(df), "PM x1000 (mg/m³); gas x MW*1000/24.45")

    df["valid"] = df.qc_flag.eq("VALID")
    L(code, "R5 non-VALID qc rows", (~df.valid).sum(), df.loc[~df.valid, "qc_flag"].value_counts().to_dict().__repr__())

    phys = {"pm25": (0, 1500), "pm10": (0, 2000), "so2": (0, 2000), "co": (0, 60000), "o3": (0, 1000), "no2": (0, 2000),
            "temperature_c": (5, 45), "humidity_pct": (0, 100), "wind_speed_ms": (0, 40), "wind_direction_deg": (0, 360)}
    for c, (lo, hi) in phys.items():
        bad = df[c].notna() & ((df[c] < lo) | (df[c] > hi))
        if bad.any():
            L(code, f"R6 out of physical range {c}", bad.sum(), f"[{lo},{hi}]")
            df.loc[bad, c] = np.nan
    inv = df.valid & (df.pm25 > df.pm10 * 1.05)
    if inv.any():
        L(code, "R6 PM2.5 > PM10", inv.sum())
    df["pm_inverted"] = inv

    # R8 stuck sensor: >= 6 consecutive identical PM2.5 readings while flagged VALID
    df = df.sort_values("hour")
    run_id = (df.pm25 != df.pm25.shift()).cumsum()
    run_len = df.groupby(run_id).pm25.transform("size")
    stuck = df.valid & df.pm25.notna() & (run_len >= 6)
    if stuck.any():
        L(code, "R8 stuck/flatline sensor (VALID flag overridden)", stuck.sum(),
          f"{df.loc[stuck,'hour'].min():%Y-%m-%d} to {df.loc[stuck,'hour'].max():%Y-%m-%d}; values {sorted(df.loc[stuck,'pm25'].round(1).unique())[:4]}")
        df.loc[stuck, "valid"] = False
        df.loc[stuck, "qc_flag"] = "STUCK"
    df = df.set_index("hour").reindex(pd.date_range(START, END, freq="h"))
    df.index.name = "ts_wib"
    missing = df.qc_flag.isna().sum()
    if missing:
        L(code, "R7 hours absent from file", missing)
    df["qc_flag"] = df.qc_flag.fillna("ABSENT")
    df["valid"] = df.valid.fillna(False).astype(bool) & df.pm25.notna()
    df["station"] = code
    df["unit_raw"] = unit
    df["ts_local"] = df.index + pd.Timedelta(hours=TZ_OFFSET.get(code, 0))
    frames.append(df.reset_index()[["station", "ts_wib", "ts_local", "qc_flag", "valid", "pm_inverted", "unit_raw"] + POLL + MET])
    L(code, "R* final VALID hours", df.valid.sum(), f"of {len(df)} grid hours")

hourly = pd.concat(frames, ignore_index=True)
hourly.to_parquet(f"{OUT}/hourly_clean.parquet")
pd.DataFrame(log).to_csv(f"{OUT}/dq_log.csv", index=False)
cap = hourly.groupby("station").valid.mean().mul(100).round(1).sort_values()
print("VALID capture % by station\n", cap.to_string())
