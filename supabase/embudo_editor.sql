-- Editor de embudos estilo Holded: etapas con descripcion, probabilidad y
-- aviso de estancamiento; y en cada deal, desde cuando esta en su etapa.
ALTER TABLE pipeline_columnas ADD COLUMN IF NOT EXISTS descripcion text;
ALTER TABLE pipeline_columnas ADD COLUMN IF NOT EXISTS probabilidad int NOT NULL DEFAULT 100;
ALTER TABLE pipeline_columnas ADD COLUMN IF NOT EXISTS estancado_dias int;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS columna_desde timestamptz NOT NULL DEFAULT now();

SELECT 'OK: editor de embudos listo' AS resultado;
