-- Eliminar tablas existentes en orden inverso de dependencias
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS horarios_disponibles;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS administradores;

-- Habilitar la extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Administradores
CREATE TABLE IF NOT EXISTS administradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Horarios Disponibles
CREATE TABLE IF NOT EXISTS horarios_disponibles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('disponible', 'reservado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fecha, hora)
);

-- Tabla de Citas
CREATE TABLE IF NOT EXISTS citas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cita_id UUID REFERENCES citas(id) ON DELETE CASCADE,
    destinatario_id UUID NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('confirmacion', 'recordatorio', 'cancelacion', 'modificacion')),
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_horario ON citas(horario_id);
CREATE INDEX IF NOT EXISTS idx_horarios_fecha ON horarios_disponibles(fecha);
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones(destinatario_id);

-- Habilitar RLS
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON citas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserción a usuarios anónimos"
ON citas FOR INSERT
TO anon
WITH CHECK (true);

-- Función para verificar disponibilidad de horario
CREATE OR REPLACE FUNCTION verificar_disponibilidad(
    fecha_cita DATE,
    hora_cita TIME
) RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si ya existe una cita en ese horario
    RETURN NOT EXISTS (
        SELECT 1 
        FROM citas c
        JOIN horarios_disponibles h ON c.horario_id = h.id
        WHERE h.fecha = fecha_cita
        AND h.hora = hora_cita
        AND c.estado != 'cancelada'
    );
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_pacientes_updated_at
    BEFORE UPDATE ON pacientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administradores_updated_at
    BEFORE UPDATE ON administradores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_horarios_updated_at
    BEFORE UPDATE ON horarios_disponibles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_updated_at
    BEFORE UPDATE ON citas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notificaciones_updated_at
    BEFORE UPDATE ON notificaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 