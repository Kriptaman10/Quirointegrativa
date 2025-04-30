const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuración de Supabase
const supabaseUrl = 'https://ivneinajrywdljevjgjx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY; // Necesitaremos la anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir archivos estáticos

// Ruta para guardar una nueva cita
app.post('/api/citas', async (req, res) => {
    const { nombre, telefono, email, fecha, hora } = req.body;
    
    console.log('Intentando crear cita:', { nombre, telefono, email, fecha, hora });

    if (!nombre || !telefono || !email || !fecha || !hora) {
        console.error('Faltan campos requeridos');
        return res.status(400).json({
            error: 'Todos los campos son requeridos'
        });
    }

    try {
        // Primero verificamos la disponibilidad dentro de la misma transacción
        const { data: citasExistentes, error: errorVerificacion } = await supabase
            .from('citas')
            .select('id')
            .eq('fecha', fecha)
            .eq('hora', hora)
            .in('estado', ['confirmada', 'pendiente']);

        if (errorVerificacion) {
            console.error('Error al verificar disponibilidad:', errorVerificacion);
            throw new Error('Error al verificar disponibilidad');
        }

        // Si ya existe una cita, rechazamos inmediatamente
        if (citasExistentes && citasExistentes.length > 0) {
            console.log('Horario ocupado, rechazando cita:', { fecha, hora });
            return res.status(409).json({
                error: 'El horario seleccionado ya no está disponible'
            });
        }

        // Si no hay citas existentes, intentamos insertar usando RLS
        console.log('Horario disponible, intentando insertar cita');
        const { data: nuevaCita, error: errorInsercion } = await supabase
            .from('citas')
            .insert([
                {
                    nombre,
                    telefono,
                    email,
                    fecha,
                    hora,
                    estado: 'pendiente'
                }
            ])
            .select()
            .single();

        if (errorInsercion) {
            console.error('Error al insertar cita:', errorInsercion);
            // Si el error es por duplicado (otra cita se creó al mismo tiempo)
            if (errorInsercion.code === '23505') {
                return res.status(409).json({
                    error: 'El horario seleccionado ya no está disponible'
                });
            }
            throw errorInsercion;
        }

        console.log('Cita creada exitosamente:', nuevaCita.id);
        res.json({
            id: nuevaCita.id,
            message: 'Cita agendada exitosamente'
        });
    } catch (error) {
        console.error('Error al procesar la cita:', error);
        res.status(500).json({ 
            error: error.message || 'Error al agendar la cita'
        });
    }
});

// Ruta para obtener todas las citas
app.get('/api/citas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error al obtener las citas:', error);
        res.status(500).json({ 
            error: error.message || 'Error al obtener las citas'
        });
    }
});

// Ruta para verificar disponibilidad
app.get('/api/disponibilidad', async (req, res) => {
    const { fecha, hora } = req.query;
    
    console.log('Verificando disponibilidad para:', { fecha, hora });
    
    if (!fecha || !hora) {
        console.error('Faltan parámetros requeridos');
        return res.status(400).json({ 
            error: 'Se requieren fecha y hora para verificar disponibilidad'
        });
    }

    try {
        const { data: citasExistentes, error } = await supabase
            .from('citas')
            .select('id')
            .eq('fecha', fecha)
            .eq('hora', hora)
            .in('estado', ['confirmada', 'pendiente']);

        if (error) {
            console.error('Error al consultar disponibilidad:', error);
            throw error;
        }

        const disponible = !citasExistentes || citasExistentes.length === 0;
        console.log('Resultado de verificación:', { fecha, hora, disponible, citasCount: citasExistentes?.length });
        
        res.json({ disponible });
    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({ 
            error: error.message || 'Error al verificar disponibilidad'
        });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 