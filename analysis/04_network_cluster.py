"""Network adequacy (distance, redundancy) + unsupervised station archetypes (k-means on log monthly PM2.5 profile)."""
import os
from pathlib import Path
import pandas as pd, numpy as np, warnings
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
warnings.filterwarnings("ignore")
pd.set_option("display.width", 250); pd.set_option("display.max_columns", 30); pd.set_option("display.max_rows", 80)
OUT = str(Path(__file__).resolve().parents[1] / "analysis" / "out")
os.makedirs(OUT, exist_ok=True)
dim = pd.read_csv(f"{OUT}/dim_station.csv").set_index("station")
f = pd.read_parquet(f"{OUT}/fact_station_day.parquet")
lat = np.radians(dim.latitude_dd); lon = np.radians(dim.longitude_dd); S = dim.index.tolist()
def hav(a, b):
    dlat = lat[b] - lat[a]; dlon = lon[b] - lon[a]
    return 6371 * 2 * np.arcsin(np.sqrt(np.sin(dlat / 2) ** 2 + np.cos(lat[a]) * np.cos(lat[b]) * np.sin(dlon / 2) ** 2))
Dm = pd.DataFrame([[hav(a, b) for b in S] for a in S], index=S, columns=S); Dm.to_csv(f"{OUT}/station_distance_km.csv")
P = f[f.day_valid].pivot(index="date", columns="station", values="pm25")
C = P.corr(min_periods=100).reindex(index=S, columns=S)
pp = pd.DataFrame([(a, b, Dm.loc[a, b], C.loc[a, b]) for i, a in enumerate(S) for b in S[i + 1:]], columns=["a", "b", "km", "r"]).dropna()
pp["mad"] = [ (P[a] - P[b]).abs().mean() for a, b in zip(pp.a, pp.b)]
pp.sort_values("r", ascending=False).to_csv(f"{OUT}/station_pairs.csv", index=False)
print(pp.sort_values("r", ascending=False).head(10).round(3).to_string()); print(pp[pp.km < 300].round(3).to_string())
M = f[f.day_valid].assign(ym=lambda d: d.date.dt.to_period("M")).pivot_table(index="station", columns="ym", values="pm25")
M = M.drop(index=["JMB-02", "MER-01"], errors="ignore").T.interpolate().bfill().ffill().T
X = np.log(M)
print({k: round(silhouette_score(X, KMeans(k, n_init=20, random_state=0).fit_predict(X)), 3) for k in range(2, 8)})
hz = [p for p in M.columns if p.month in (8, 9, 10)]; of = [p for p in M.columns if p.month in (1, 2, 3, 4, 5, 6)]
for k in [3, 4, 5]:
    lab = pd.Series(KMeans(k, n_init=50, random_state=0).fit_predict(X), index=M.index); print("k", k)
    for c in range(k):
        mem = lab[lab == c].index.tolist()
        print("  ", c, mem, "mean", round(M.loc[mem].values.mean(), 1), "haze/off", round((M.loc[mem][hz].mean(1) / M.loc[mem][of].mean(1)).mean(), 2))
    if k == 4: lab.rename("cluster").to_csv(f"{OUT}/station_cluster_k4.csv")

# ---- Interpretable archetypes: chronic level x episodic amplification x escalation
v = f[f.day_valid].copy(); v["m"] = v.date.dt.month; v["y"] = v.date.dt.year
feat = pd.DataFrame({
    "offseason_pm25": v[v.m.isin([1, 2, 3, 4, 5, 6])].groupby("station").pm25.mean(),
    "haze_pm25": v[v.m.isin([8, 9, 10])].groupby("station").pm25.mean(),
    "haze24": v[v.m.isin([8, 9, 10]) & (v.y == 2024)].groupby("station").pm25.mean(),
    "haze26": v[v.m.isin([8, 9, 10]) & (v.y == 2026)].groupby("station").pm25.mean(),
}).drop(index=["JMB-02", "MER-01"], errors="ignore")
feat["haze_multiplier"] = feat.haze_pm25 / feat.offseason_pm25
feat["escalation"] = feat.haze26 / feat.haze24
Z = np.log(feat[["offseason_pm25", "haze_multiplier", "escalation"]]); Z = (Z - Z.mean()) / Z.std()
sil = {k: round(silhouette_score(Z, KMeans(k, n_init=50, random_state=0).fit_predict(Z)), 3) for k in range(2, 7)}
print("silhouette (3 features)", sil)
km = KMeans(4, n_init=100, random_state=0).fit(Z); feat["cluster"] = km.labels_
print(feat.round(2).sort_values(["cluster", "offseason_pm25"]).to_string())
feat.to_csv(f"{OUT}/station_archetype.csv")
