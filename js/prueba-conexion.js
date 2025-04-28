// Configuración de Supabase
const supabaseUrl = 'https://ivneinajrywdljevjgjx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'

// Inicializar el cliente de Supabase
const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Función para probar la conexión
async function probarConexion() {
    const divPrueba = document.getElementById('prueba-conexion')
    divPrueba.innerHTML = `
        <div style="margin: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: white;">
            <h2 style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px;">Estado de la conexión</h2>
            <p id="estado-conexion" style="color: #666;">Verificando conexión...</p>
        </div>
    `
    
    const elementoEstado = document.getElementById('estado-conexion')
    
    try {
        console.log('Intentando conectar a Supabase...')
        
        // Primero verificamos que el cliente se haya inicializado correctamente
        if (!clienteSupabase) {
            throw new Error('El cliente de Supabase no se ha inicializado correctamente')
        }

        // Intentamos una consulta simple
        const { data, error } = await clienteSupabase
            .from('pacientes')
            .select('*')
            .limit(1)
        
        console.log('Respuesta:', { data, error })
        
        if (error) throw error
        
        elementoEstado.textContent = '¡Conexión exitosa! 🎉'
        elementoEstado.style.color = '#22c55e' // verde
    } catch (error) {
        console.error('Error detallado:', error)
        elementoEstado.textContent = `Error de conexión: ${error.message || 'Error desconocido'} ❌`
        elementoEstado.style.color = '#ef4444' // rojo
    }
}

// Esperamos a que el documento y Supabase estén cargados
window.addEventListener('load', probarConexion) 