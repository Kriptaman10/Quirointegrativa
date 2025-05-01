-- Consulta para identificar citas duplicadas
SELECT 
    fecha, 
    hora, 
    COUNT(*) as cantidad_duplicados,
    array_agg(id) as ids,
    array_agg(nombre) as nombres,
    array_agg(created_at) as fechas_creacion
FROM citas
GROUP BY fecha, hora
HAVING COUNT(*) > 1
ORDER BY fecha, hora; 