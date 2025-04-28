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
    
    try {
        // Primero verificamos disponibilidad
        const { data: disponibilidad, error: errorDisponibilidad } = await supabase
            .rpc('verificar_disponibilidad', {
                fecha_cita: fecha,
                hora_cita: hora
            });

        if (errorDisponibilidad) throw new Error('Error al verificar disponibilidad');
        
        if (!disponibilidad) {
            return res.status(400).json({
                error: 'El horario seleccionado ya no está disponible'
            });
        }

        // Si está disponible, guardamos la cita
        const { data, error } = await supabase
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
            .select();

        if (error) throw error;

        res.json({
            id: data[0].id,
            message: 'Cita agendada exitosamente'
        });
    } catch (error) {
        console.error('Error al guardar la cita:', error);
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
    
    try {
        const { data, error } = await supabase
            .rpc('verificar_disponibilidad', {
                fecha_cita: fecha,
                hora_cita: hora
            });

        if (error) throw error;

        res.json({ disponible: data });
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