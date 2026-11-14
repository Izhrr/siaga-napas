"""Exposure-response (Poisson GLM, station FE + natural spline of log PM2.5) and attributable (excess) cases.
Counterfactual: PM2.5 capped at C0 (25 = data-driven no-effect level / WHO IT-4; 55 = PP 22/2021 daily standard)."""
import os
from pathlib import Path
import numpy as np, pandas as pd, statsmodels.api as sm, statsmodels.formula.api as smf, warnings
warnings.filterwarnings("ignore")
OUT = str(Path(__file__).resolve().parents[1] / "analysis" / "out")
os.makedirs(OUT, exist_ok=True)
f = pd.read_parquet(f"{OUT}/fact_station_day.parquet")
use = f[f.day_valid & ~f.station.isin(["JMB-02", "MER-01"])].copy()
use["yr"] = use.date.dt.year.astype(str); use["lpm"] = np.log(use.pm25.clip(lower=1))
O = ["resp_admissions_under5", "resp_admissions_over60", "asthma_emergency_cases", "copd_admissions", "resp", "cvd", "death"]
knots = "df=5"
curves, attrib, coefs = [], [], {}
grid = pd.DataFrame({"pm25": np.r_[np.arange(5, 100, 2.5), np.arange(100, 900, 25)]})
for o in O:
    m = smf.glm(f"{o} ~ C(station) + cr(lpm, {knots}) + C(dow) + temp_c + C(yr)", data=use,
                family=sm.families.Poisson()).fit(scale="X2")
    coefs[o] = m
    # curve relative to PM=15 at reference station/day
    base = use.iloc[[0]].copy()
    g = pd.concat([base] * len(grid), ignore_index=True); g["lpm"] = np.log(grid.pm25)
    p = m.predict(g); b0 = g.iloc[[0]].copy(); b0["lpm"] = np.log(15)
    curves.append(pd.DataFrame({"outcome": o, "pm25": grid.pm25, "rr_vs_15": p.values / m.predict(b0).values[0]}))
    for c0 in [15, 25, 37.5, 55]:
        cf = use.copy(); cf["lpm"] = np.log(np.minimum(use.pm25, c0).clip(lower=1))
        exc = m.predict(use) - m.predict(cf)
        attrib.append(pd.DataFrame({"station": use.station, "date": use.date, "outcome": o, "c0": c0,
                                    "pm25": use.pm25, "excess": exc.clip(lower=0).values, "observed": use[o].values}))
    print(o, "pearson dispersion", round(m.scale, 2))
curves = pd.concat(curves); attrib = pd.concat(attrib)
curves.to_csv(f"{OUT}/exposure_response.csv", index=False); attrib.to_parquet(f"{OUT}/attributable.parquet")
pd.set_option("display.width", 250)
print(curves.pivot(index="pm25", columns="outcome", values="rr_vs_15").loc[[15, 25, 37.5, 55, 75, 100, 150, 250, 500, 850]].round(2))
a = attrib[attrib.c0 == 25]
tot = a.groupby("outcome").agg(excess=("excess", "sum"), observed=("observed", "sum"))
tot["share_%"] = (tot.excess / tot.observed * 100).round(1); print(tot.round(0))
a["band"] = pd.cut(a.pm25, [0, 25, 55, 150, 250, 1e4], labels=["<=25", "25-55 (legal)", "55-150", "150-250", ">250"])
print((a.groupby(["outcome", "band"], observed=True).excess.sum().unstack().pipe(lambda x: x.div(x.sum(1), axis=0) * 100)).round(1))
a55 = attrib[attrib.c0 == 55].groupby("outcome").excess.sum(); print("excess vs 55 cap", a55.round(0).to_dict())
a["yr"] = a.date.dt.year
print(a[a.outcome == "resp_admissions_under5"].groupby("yr").excess.sum().round(0))
print(a[a.outcome == "resp_admissions_under5"].groupby("station").excess.sum().sort_values(ascending=False).round(0).head(12))
