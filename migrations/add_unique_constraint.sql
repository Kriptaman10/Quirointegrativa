-- Primero, identificamos las citas duplicadas
CREATE TEMP TABLE duplicados AS
SELECT fecha, hora, COUNT(*), array_agg(id) as ids
FROM citas
GROUP BY fecha, hora
HAVING COUNT(*) > 1;

-- Mostrar los duplicados para revisión
SELECT * FROM duplicados;

-- Mantener solo la cita más reciente para cada fecha/hora duplicada
WITH duplicados_a_eliminar AS (
    SELECT unnest(ids[2:]) as id
    FROM duplicados
)
DELETE FROM citas
WHERE id IN (SELECT id FROM duplicados_a_eliminar);

-- Agregar columna unique_key si no existe
ALTER TABLE citas ADD COLUMN IF NOT EXISTS unique_key TEXT;

-- Actualizar registros existentes con un unique_key
UPDATE citas SET unique_key = fecha || '_' || hora WHERE unique_key IS NULL;

-- Ahora podemos agregar las restricciones únicas de manera segura
ALTER TABLE citas ADD CONSTRAINT unique_fecha_hora UNIQUE (fecha, hora);
ALTER TABLE citas ADD CONSTRAINT unique_key_constraint UNIQUE (unique_key);

-- Crear índice para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_citas_fecha_hora ON citas(fecha, hora);

-- Limpiar la tabla temporal
DROP TABLE duplicados; 