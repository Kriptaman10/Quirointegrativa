const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Servir archivos estáticos

// Ruta para guardar una nueva cita
app.post('/api/citas', async (req, res) => {
    const { nombre, telefono, email, fecha, hora } = req.body;
    
    try {
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 