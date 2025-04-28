// Configuración de Supabase
const supabaseUrl = 'https://ivneinajrywdljevjgjx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form')
    const toastContainer = document.getElementById('toast-container')

    // Función para mostrar mensajes
    function mostrarMensaje(mensaje, tipo = 'error') {
        const toast = document.createElement('div')
        toast.className = `toast toast-${tipo}`
        toast.innerHTML = `
            <i class="fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${mensaje}</span>
        `
        toastContainer.appendChild(toast)
        
        setTimeout(() => {
            toast.classList.add('mostrar')
            setTimeout(() => {
                toast.classList.remove('mostrar')
                setTimeout(() => toastContainer.removeChild(toast), 300)
            }, 3000)
        }, 100)
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const usuario = document.getElementById('medic_id').value
        const password = document.getElementById('medic_pass').value

        // Verificar credenciales hardcodeadas por ahora
        if (usuario === 'sergio henriquez' && password === 'quirointegrativa2025') {
            // Guardar estado de login
            localStorage.setItem('medicoLogueado', 'true')
            localStorage.setItem('nombreMedico', 'Sergio Henríquez')
            
            // Redirigir al panel de administración
            window.location.href = 'panel-medico.html'
        } else {
            mostrarMensaje('Usuario o contraseña incorrectos')
        }
    })
}) 