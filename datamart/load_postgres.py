"""Load datamart/data/*.csv into PostgreSQL (schema mart). Idempotent: truncates mart tables, keeps app.* (chat history).

Usage:
  DATABASE_URL=postgres://user@localhost:5432/siaga python datamart/load_postgres.py
The script reads DATABASE_URL from the environment only (never from a file).
"""
import csv, io, os, sys
import psycopg

HERE = os.path.dirname(os.path.abspath(__file__))
ORDER = ["dim_station", "dim_province", "dim_month", "fact_station_day", "fact_station_month", "fact_excess_station_month", "fact_excess_band_month",
         "agg_diurnal", "agg_wind_sector", "model_exposure_response", "model_event_study", "model_pct_doubling", "model_importance",
         "model_station_archetype", "station_quality", "station_pair", "dq_log"]

def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set")
    with psycopg.connect(url, autocommit=False) as con, con.cursor() as cur:
        cur.execute(open(os.path.join(HERE, "schema.sql")).read())
        cur.execute("TRUNCATE " + ", ".join(f"mart.{t}" for t in reversed(ORDER)) + " CASCADE")
        for t in ORDER:
            path = os.path.join(HERE, "data", f"{t}.csv")
            with open(path, newline="") as fh:
                header = next(csv.reader(fh)); fh.seek(0)
                with cur.copy(f"COPY mart.{t} ({', '.join(header)}) FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')") as cp:
                    cp.write(fh.read())
            cur.execute(f"SELECT count(*) FROM mart.{t}"); print(f"{t:28s} {cur.fetchone()[0]:>7,d}")
        con.commit()
    print("loaded")

if __name__ == "__main__":
    main()
