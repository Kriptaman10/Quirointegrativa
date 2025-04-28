console.log('JS de formulario-citas cargado');

// Configuración de Supabase
const supabaseUrl = 'https://ivneinajrywdljevjgjx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('.formulario-citas')
    const botonEnviar = formulario.querySelector('.boton-agendar')
    const slotSeleccionado = document.getElementById('slot-seleccionado')
    const textoSlotSeleccionado = slotSeleccionado.querySelector('span')

    console.log('Formulario encontrado:', formulario);

    // Función para habilitar/deshabilitar el botón de envío
    function actualizarBotonEnviar() {
        const esFormularioValido = formulario.checkValidity() && slotSeleccionado.style.display !== 'none'
        botonEnviar.disabled = !esFormularioValido
    }

    // Manejar el envío del formulario
    formulario.addEventListener('submit', async (e) => {
        console.log('¡Evento submit disparado!');
        e.preventDefault()

        const datosFormulario = {
            nombre: document.getElementById('nombre-paciente').value,
            telefono: document.getElementById('telefono-paciente').value,
            email: document.getElementById('email-paciente').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value
        }

        console.log('Enviando datos a Supabase:', datosFormulario)

        try {
            // Guardar la cita
            const { data, error } = await supabase
                .from('citas')
                .insert([{
                    nombre: datosFormulario.nombre,
                    telefono: datosFormulario.telefono,
                    email: datosFormulario.email,
                    fecha: datosFormulario.fecha,
                    hora: datosFormulario.hora,
                    estado: 'pendiente'
                }])
                .select()

            console.log('Respuesta de Supabase:', data, error)

            if (error) throw error

            // Mostrar mensaje de éxito
            const toast = document.getElementById('toast-exito');
            if (toast) {
                toast.classList.add('mostrar');
                toast.style.display = 'flex';
                setTimeout(() => {
                    toast.classList.remove('mostrar');
                    toast.style.display = 'none';
                }, 2500);
            }
            
            // Limpiar el formulario
            formulario.reset()
            slotSeleccionado.style.display = 'none'
            actualizarBotonEnviar()

        } catch (error) {
            console.error('Error:', error)
            alert('Hubo un error al agendar la cita. Por favor, inténtelo nuevamente.')
        }
    })

    // Actualizar el botón cuando cambian los campos
    formulario.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', actualizarBotonEnviar)
    })

    // Manejar la selección de fecha y hora del calendario
    window.addEventListener('slotSeleccionado', (e) => {
        const { fecha, hora } = e.detail
        document.getElementById('fecha').value = fecha
        document.getElementById('hora').value = hora
        textoSlotSeleccionado.textContent = `${fecha} ${hora}`
        slotSeleccionado.style.display = 'block'
        actualizarBotonEnviar()
    })
}) 