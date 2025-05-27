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
    const emailInput = document.getElementById('email-paciente')
    const errorEmail = document.getElementById('error-email')
    const emailContainer = emailInput.closest('.email-input-container')

    console.log('Formulario encontrado:', formulario);

    // Constantes
    const API_KEY = "5368b77e0f574445979a9cf742ff983a"
    const DEBOUNCE_DELAY = 1500
    const RATE_LIMIT_COOLDOWN = 30000 // 30 segundos
    let isValidationEnabled = true
    let validationTimeout = null

    // Función para aplicar debounce
    function debounce(func, wait) {
        let timeout
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout)
                func(...args)
            }
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)
        }
    }

    // Función para manejar el rate limiting
    function handleRateLimit() {
        isValidationEnabled = false
        emailInput.classList.add('input-error')
        errorEmail.textContent = 'Demasiadas validaciones. Inténtalo más tarde.'
        botonEnviar.disabled = true

        setTimeout(() => {
            isValidationEnabled = true
            emailInput.classList.remove('input-error')
            errorEmail.textContent = ''
            actualizarBotonEnviar()
        }, RATE_LIMIT_COOLDOWN)
    }

    // Función para validar email en tiempo real
    async function validarEmailTiempoReal(email) {
        if (!isValidationEnabled) return false

        try {
            const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`)
            
            if (response.status === 429) {
                handleRateLimit()
                return false
            }

            const data = await response.json()
            
            if (data.deliverability === "UNDELIVERABLE") {
                emailInput.classList.add('input-error')
                emailContainer.classList.remove('valid')
                errorEmail.textContent = 'El correo ingresado no es válido o no existe.'
                botonEnviar.disabled = true
                return false
            }

            // Email válido
            emailInput.classList.remove('input-error')
            emailContainer.classList.add('valid')
            errorEmail.textContent = ''
            actualizarBotonEnviar()
            return true
        } catch (error) {
            console.error('Error al validar email:', error)
            return false
        }
    }

    // Aplicar debounce a la validación
    const validarEmailDebounced = debounce(async (email) => {
        if (!email) {
            emailInput.classList.remove('input-error')
            emailContainer.classList.remove('valid')
            errorEmail.textContent = ''
            actualizarBotonEnviar()
            return
        }
        await validarEmailTiempoReal(email)
    }, DEBOUNCE_DELAY)

    // Agregar eventos al campo de email
    emailInput.addEventListener('input', (e) => {
        if (validationTimeout) clearTimeout(validationTimeout)
        validationTimeout = setTimeout(() => {
            validarEmailDebounced(e.target.value)
        }, 1000)
    })

    emailInput.addEventListener('blur', (e) => {
        if (validationTimeout) clearTimeout(validationTimeout)
        validarEmailDebounced(e.target.value)
    })

    // Función para validar email con AbstractAPI (para el submit)
    async function validarEmailAbstractAPI(email) {
        try {
            const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${API_KEY}&email=${encodeURIComponent(email)}`)
            
            if (response.status === 429) {
                throw new Error('Demasiadas validaciones. Inténtalo más tarde.')
            }

            const data = await response.json()
            
            if (data.deliverability === "UNDELIVERABLE") {
                throw new Error('El correo electrónico no es válido o no existe.')
            }
            
            return true
        } catch (error) {
            console.error('Error al validar email:', error)
            throw error
        }
    }

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
        const esFormularioValido = formulario.checkValidity() && 
                                 slotSeleccionado.style.display !== 'none' && 
                                 !emailInput.classList.contains('input-error')
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

        try {
            // Deshabilitar el botón mientras se procesa
            botonEnviar.disabled = true
            botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...'

            // Validar email con AbstractAPI
            await validarEmailAbstractAPI(datosFormulario.email)

            // Si la validación es exitosa, continuar con el proceso normal
            console.log('Enviando datos a Supabase:', datosFormulario)

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

        } catch (error) {
            console.error('Error:', error)
            mostrarToast(error.message || 'Hubo un error al agendar la cita. Por favor, inténtelo nuevamente.', true)
        } finally {
            // Restaurar el botón
            botonEnviar.disabled = false
            botonEnviar.innerHTML = 'Agendar Cita'
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