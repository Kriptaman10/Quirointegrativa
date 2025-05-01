-- Verificar que la tabla está vacía
SELECT COUNT(*) FROM citas;

-- Si está vacía, procedemos a agregar las restricciones
-- Agregar columna unique_key
ALTER TABLE citas ADD COLUMN IF NOT EXISTS unique_key TEXT;

-- Agregar las restricciones únicas
ALTER TABLE citas ADD CONSTRAINT unique_fecha_hora UNIQUE (fecha, hora);
ALTER TABLE citas ADD CONSTRAINT unique_key_constraint UNIQUE (unique_key);

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas(fecha, hora); 