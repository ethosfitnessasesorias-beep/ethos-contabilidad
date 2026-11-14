-- Funnel: outbounds y agendas de outbounds (manual, diario) — 14/11/2026
ALTER TABLE kpi_diario ADD COLUMN IF NOT EXISTS outbounds integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS agendas_outbounds integer NOT NULL DEFAULT 0;
