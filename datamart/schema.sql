-- JERNIH datamart (PostgreSQL 15+). Load with: analysis/.venv/bin/python datamart/load_postgres.py
-- Schema "mart" = read-only analytical tables; schema "app" = chatbot history (read/write).
CREATE SCHEMA IF NOT EXISTS mart;
CREATE SCHEMA IF NOT EXISTS app;

-- ---------- dimensions ----------
CREATE TABLE IF NOT EXISTS mart.dim_station (
  station_code text PRIMARY KEY, aqms_code text, sensor_id text, hospital_id text, location_id text, station_name text,
  model_sensor text, status_operasional text, tanggal_instalasi date, provinsi text, kota_kabupaten text, kecamatan text,
  province_geo text, island text, lat double precision, lon double precision, site_type text, area_character text,
  archetype text, baseline_pm25 double precision, distance_to_road_m double precision, traffic_per_h double precision,
  tz_offset_h int, hospital_name text, kelas_faskes text, beds int);
CREATE TABLE IF NOT EXISTS mart.dim_province (province_geo text PRIMARY KEY, province_name text, n_stations int, island text);
CREATE TABLE IF NOT EXISTS mart.dim_month (month_start date PRIMARY KEY, year int, month int, month_name text, is_haze_season boolean);

-- ---------- facts ----------
CREATE TABLE IF NOT EXISTS mart.fact_station_day (
  station_code text REFERENCES mart.dim_station, hospital_id text, date date,
  pm25 double precision, pm10 double precision, so2 double precision, no2 double precision, co_8h_max double precision, o3_8h_max double precision,
  pm25_1h_max double precision, hours_gt_55 int, n_valid_hours int, day_valid boolean, exceed_55 double precision,
  ispu double precision, ispu_category text, ispu_critical text,
  temp_station_c double precision, rh_station_pct double precision, wind_speed_ms double precision, wind_dir_deg double precision,
  temp_hosp_c double precision, dewpoint_hosp_c double precision, rh_hosp_pct double precision,
  resp_u5 int, resp_o60 int, asthma int, copd int, resp int, cvd int, death int,
  PRIMARY KEY (station_code, date));
CREATE TABLE IF NOT EXISTS mart.fact_station_month (
  station_code text REFERENCES mart.dim_station, month_start date, days int,
  obs_resp_u5 int, obs_resp_o60 int, obs_resp int, obs_asthma int, obs_copd int, obs_cvd int, obs_death int,
  pm25_mean double precision, valid_days int, exceed_days int, very_unhealthy_days int,
  PRIMARY KEY (station_code, month_start));
CREATE TABLE IF NOT EXISTS mart.fact_excess_station_month (
  station_code text REFERENCES mart.dim_station, month_start date, outcome text, threshold double precision, excess_cases double precision,
  PRIMARY KEY (station_code, month_start, outcome, threshold));
CREATE TABLE IF NOT EXISTS mart.fact_excess_band_month (
  station_code text REFERENCES mart.dim_station, month_start date, pm_band text, excess_cases double precision,
  PRIMARY KEY (station_code, month_start, pm_band));

-- ---------- aggregates, models, quality ----------
CREATE TABLE IF NOT EXISTS mart.agg_diurnal (archetype text, daytype text, hour_local int, pm25_mean double precision, ratio_to_daily_mean double precision);
CREATE TABLE IF NOT EXISTS mart.agg_wind_sector (station_code text, sector text, pm25_mean double precision, share_pct double precision);
CREATE TABLE IF NOT EXISTS mart.model_exposure_response (outcome text, pm25 double precision, rr_vs_15 double precision);
CREATE TABLE IF NOT EXISTS mart.model_event_study (outcome text, day_offset int, ratio_to_prev_week double precision);
CREATE TABLE IF NOT EXISTS mart.model_pct_doubling (outcome text PRIMARY KEY, pct_increase_per_doubling double precision);
CREATE TABLE IF NOT EXISTS mart.model_importance (feature text PRIMARY KEY, permutation_importance double precision);
CREATE TABLE IF NOT EXISTS mart.model_station_archetype (station_code text PRIMARY KEY, offseason_pm25 double precision, haze_pm25 double precision, haze24 double precision,
  haze26 double precision, haze_multiplier double precision, escalation double precision, cluster_id int, archetype text);
CREATE TABLE IF NOT EXISTS mart.station_quality (station_code text PRIMARY KEY, capture_pct double precision, nearest_km double precision, iku_2025 double precision,
  exceed_days_2025 double precision, resp_per100bed_normal double precision, resp_per100bed_peak7 double precision, issue text, is_reliable boolean);
CREATE TABLE IF NOT EXISTS mart.station_pair (station_a text, station_b text, distance_km double precision, pearson_r double precision, mean_abs_diff double precision);
CREATE TABLE IF NOT EXISTS mart.dq_log (station text, rule text, rows int, note text);

-- ---------- semantic views (the only objects the chatbot reads) ----------
-- One row per station x month with every additive measure the dashboard and chatbot use.
CREATE OR REPLACE VIEW mart.v_station_month AS
SELECT s.station_code, s.station_name, s.kota_kabupaten, s.provinsi, s.province_geo, s.island, s.archetype, s.kelas_faskes, s.beds,
       m.month_start, d.year, d.month, d.is_haze_season,
       m.pm25_mean, m.valid_days, m.exceed_days, m.very_unhealthy_days,
       m.obs_resp_u5, m.obs_resp_o60, m.obs_resp,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_u5' AND e.threshold = 25), 0)  AS excess_u5_t25,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_o60' AND e.threshold = 25), 0) AS excess_o60_t25,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_u5' AND e.threshold = 55), 0)  AS excess_u5_t55,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_o60' AND e.threshold = 55), 0) AS excess_o60_t55,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_u5' AND e.threshold = 15), 0)  AS excess_u5_t15,
       COALESCE(SUM(e.excess_cases) FILTER (WHERE e.outcome = 'resp_o60' AND e.threshold = 15), 0) AS excess_o60_t15
FROM mart.fact_station_month m
JOIN mart.dim_station s USING (station_code)
JOIN mart.dim_month d USING (month_start)
LEFT JOIN mart.fact_excess_station_month e ON e.station_code = m.station_code AND e.month_start = m.month_start
GROUP BY s.station_code, s.station_name, s.kota_kabupaten, s.provinsi, s.province_geo, s.island, s.archetype, s.kelas_faskes, s.beds,
         m.month_start, d.year, d.month, d.is_haze_season, m.pm25_mean, m.valid_days, m.exceed_days, m.very_unhealthy_days,
         m.obs_resp_u5, m.obs_resp_o60, m.obs_resp;

CREATE OR REPLACE VIEW mart.v_station_profile AS
SELECT s.*, q.capture_pct, q.nearest_km, q.iku_2025, q.exceed_days_2025, q.resp_per100bed_normal, q.resp_per100bed_peak7, q.issue, q.is_reliable,
       a.offseason_pm25, a.haze_multiplier, a.escalation
FROM mart.dim_station s LEFT JOIN mart.station_quality q USING (station_code) LEFT JOIN mart.model_station_archetype a USING (station_code);

-- ---------- chatbot history (no auth in prototype: one shared history) ----------
CREATE TABLE IF NOT EXISTS app.chat_conversation (
  id uuid PRIMARY KEY, title text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS app.chat_message (
  id uuid PRIMARY KEY, conversation_id uuid NOT NULL REFERENCES app.chat_conversation(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')), content text NOT NULL,
  artifact jsonb,            -- chart spec (bars/lines/table) rendered by the frontend; stored so history redraws exactly
  tool_calls jsonb,          -- [{tool, args, rows, ms, sql}] for traceability
  provider text, model text, prompt_tokens int, completion_tokens int, latency_ms int, route text,
  rating smallint, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS chat_message_conv_idx ON app.chat_message (conversation_id, created_at);

-- Read-only role for the chatbot's SQL tools (optional, recommended in production)
-- CREATE ROLE jernih_reader LOGIN PASSWORD '...'; GRANT USAGE ON SCHEMA mart TO jernih_reader; GRANT SELECT ON ALL TABLES IN SCHEMA mart TO jernih_reader;
