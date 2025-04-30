-- Tabla para valoraciones y comentarios
CREATE TABLE valoraciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    comentario TEXT NOT NULL,
    estrellas INTEGER NOT NULL CHECK (estrellas >= 1 AND estrellas <= 5),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, NOW()),
    estado VARCHAR(50) DEFAULT 'pendiente'::character varying,
    CONSTRAINT estrellas_rango CHECK (estrellas >= 1 AND estrellas <= 5)
);

-- Políticas de seguridad para la tabla valoraciones
ALTER TABLE valoraciones ENABLE ROW LEVEL SECURITY;

-- Política para insertar valoraciones (público)
CREATE POLICY "Permitir inserción de valoraciones" ON valoraciones
    FOR INSERT WITH CHECK (true);

-- Política para ver valoraciones (solo admin)
CREATE POLICY "Ver valoraciones solo admin" ON valoraciones
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para actualizar valoraciones (solo admin)
CREATE POLICY "Actualizar valoraciones solo admin" ON valoraciones
    FOR UPDATE USING (auth.role() = 'authenticated'); 