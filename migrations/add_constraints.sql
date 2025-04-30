-- Agregar columna unique_key si no existe
ALTER TABLE citas ADD COLUMN IF NOT EXISTS unique_key TEXT;

-- Actualizar registros existentes con un unique_key
UPDATE citas SET unique_key = fecha || '_' || hora WHERE unique_key IS NULL;

-- Agregar las restricciones únicas
ALTER TABLE citas ADD CONSTRAINT unique_fecha_hora UNIQUE (fecha, hora);
ALTER TABLE citas ADD CONSTRAINT unique_key_constraint UNIQUE (unique_key);

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas(fecha, hora); 