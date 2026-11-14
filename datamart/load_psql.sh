#!/usr/bin/env bash
# Muat datamart ke PostgreSQL hanya dengan psql (tanpa Python). Idempoten: isi schema mart diganti, riwayat chat (schema app) tetap.
# Pakai: DATABASE_URL='postgresql://...' bash datamart/load_psql.sh
# Untuk Neon/Supabase gunakan connection string DIRECT (bukan pooler) agar \copy lancar.
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL belum diatur}"
cd "$(dirname "$0")"
TABLES=(dim_station dim_province dim_month fact_station_day fact_station_month fact_excess_station_month fact_excess_band_month
        agg_diurnal agg_wind_sector model_exposure_response model_event_study model_pct_doubling model_importance
        model_station_archetype station_quality station_pair dq_log)

{
  echo '\set ON_ERROR_STOP on'
  echo 'SET client_min_messages = warning;'
  echo 'BEGIN;'
  cat schema.sql
  printf 'TRUNCATE %s CASCADE;\n' "$(printf 'mart.%s, ' "${TABLES[@]}" | sed 's/, $//')"
  for t in "${TABLES[@]}"; do
    cols=$(head -1 "data/$t.csv")
    echo "\\copy mart.$t ($cols) FROM 'data/$t.csv' WITH (FORMAT csv, HEADER true, NULL '')"
  done
  echo 'COMMIT;'
} | psql "$DATABASE_URL" -q

for t in "${TABLES[@]}"; do
  printf '%-28s %s\n' "$t" "$(psql "$DATABASE_URL" -tAc "select count(*) from mart.$t")"
done
echo "Validasi (harus 56354 | 16215):"
psql "$DATABASE_URL" -tAc "select round(sum(excess_u5_t25)), round(sum(excess_u5_t55)) from mart.v_station_month"
