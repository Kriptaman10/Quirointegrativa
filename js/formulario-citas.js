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
    const toastExito = document.getElementById('toast-exito')

    console.log('Formulario encontrado:', formulario);

    // Función para mostrar el toast
    function mostrarToast(mensaje, esError = false) {
        if (toastExito) {
            // Agregar el ícono correspondiente
            const icono = esError ? '<i class="fas fa-exclamation-circle"></i>' : '<i class="fas fa-check-circle"></i>'
            toastExito.innerHTML = `${icono} ${mensaje}`
            toastExito.style.backgroundColor = esError ? '#ff4444' : '#4CAF50'
            toastExito.classList.add('mostrar')
            toastExito.style.display = 'flex'
            setTimeout(() => {
                toastExito.classList.remove('mostrar')
                toastExito.style.display = 'none'
            }, 3000)
        }
    }

    // Función para habilitar/deshabilitar el botón de envío
    function actualizarBotonEnviar() {
        const esFormularioValido = formulario.checkValidity() && slotSeleccionado.style.display !== 'none'
        botonEnviar.disabled = !esFormularioValido
    }

    // Manejar el envío del formulario
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault()
        e.stopPropagation() // Detener la propagación del evento

        const datosFormulario = {
            nombre: document.getElementById('nombre-paciente').value,
            telefono: document.getElementById('telefono-paciente').value,
            email: document.getElementById('email-paciente').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value
        }

        console.log('Enviando datos a Supabase:', datosFormulario)

        try {
            // Deshabilitar el botón mientras se procesa
            botonEnviar.disabled = true

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

            if (error) {
                throw error
            }

            // Mostrar mensaje de éxito
            mostrarToast('¡Cita agendada exitosamente!')
            
            // Limpiar el formulario
            formulario.reset()
            slotSeleccionado.style.display = 'none'
            actualizarBotonEnviar()

            // Prevenir cualquier comportamiento adicional del navegador
            return false

        } catch (error) {
            console.error('Error:', error)
            mostrarToast('Hubo un error al agendar la cita. Por favor, inténtelo nuevamente.', true)
            // Habilitar el botón nuevamente
            botonEnviar.disabled = false
            // Prevenir cualquier comportamiento adicional del navegador
            return false
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