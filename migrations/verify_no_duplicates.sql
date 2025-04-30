-- Verificar si aún quedan duplicados
SELECT 
    fecha, 
    hora, 
    COUNT(*) as cantidad
FROM citas
GROUP BY fecha, hora
HAVING COUNT(*) > 1; 