export const fmt = (v: number | null | undefined, d = 0): string =>
  v == null || !isFinite(v) ? "–" : Number(v).toLocaleString("id-ID", { maximumFractionDigits: d, minimumFractionDigits: d });

/** Ringkas ribuan: 12.400 -> "12rb", 5.300 -> "5,3rb". */
export const kfmt = (v: number): string => (v >= 1000 ? fmt(v / 1000, v % 1000 && v < 10000 ? 1 : 0) + "rb" : fmt(v));

export const MON = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Angka sumbu "bulat" berikutnya: 1, 2, 2.5, 5, 10 × 10^n. */
export const nice = (m: number): number => {
  const p = Math.pow(10, Math.floor(Math.log10(m || 1)));
  const n = m / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
