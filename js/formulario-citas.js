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

    // Función para mostrar mensaje de error
    function mostrarError(mensaje) {
        const toastExito = document.getElementById('toast-exito');
        toastExito.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        toastExito.style.backgroundColor = '#ff4444';
        toastExito.classList.add('mostrar');
        toastExito.style.display = 'flex';
        setTimeout(() => {
            toastExito.classList.remove('mostrar');
            toastExito.style.display = 'none';
        }, 3000);
    }

    // Función para mostrar mensaje de éxito
    function mostrarExito() {
        const toastExito = document.getElementById('toast-exito');
        toastExito.innerHTML = '<i class="fas fa-check-circle"></i> ¡Cita agendada exitosamente!';
        toastExito.style.backgroundColor = '#4CAF50';
        toastExito.classList.add('mostrar');
        toastExito.style.display = 'flex';
        setTimeout(() => {
            toastExito.classList.remove('mostrar');
            toastExito.style.display = 'none';
        }, 3000);
    }

    // Manejar el envío del formulario
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Iniciando proceso de agendamiento desde formulario-citas.js');

        // Deshabilitar el botón inmediatamente
        botonEnviar.disabled = true;
        botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validando...';

        try {
        const datosFormulario = {
            nombre: document.getElementById('nombre-paciente').value,
            telefono: document.getElementById('telefono-paciente').value,
            email: document.getElementById('email-paciente').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            rut: document.getElementById('rut-paciente').value,
            fechaNacimiento: document.getElementById('fecha-nacimiento').value
            };

            console.log('Datos del formulario:', datosFormulario);

            // Paso 1: Validar email
            try {
                console.log('Validando email...');
                await validarEmailAbstractAPI(datosFormulario.email);
            } catch (error) {
                console.log('Error en validación de email:', error.message);
                mostrarError(error.message);
                return;
            }

            // Paso 2: Verificar disponibilidad en Supabase
            console.log('Verificando disponibilidad en Supabase...');
            const { data: citasExistentes, error: errorConsulta } = await supabase
                .from('citas')
                .select('id')
                .eq('fecha', datosFormulario.fecha)
                .eq('hora', datosFormulario.hora)
                .in('estado', ['pendiente', 'confirmada']);

            if (errorConsulta) {
                console.log('Error al consultar disponibilidad:', errorConsulta);
                mostrarError('No se pudo verificar la disponibilidad del horario.');
                return;
            }

            if (citasExistentes && citasExistentes.length > 0) {
                console.log('Horario ocupado encontrado');
                mostrarError('Lo sentimos, este horario ya está ocupado. Por favor, seleccione otro horario disponible.');
                return;
            }

            // Paso 3: Guardar la cita (solo si llegamos aquí, significa que el horario está disponible)
            console.log('Intentando guardar la cita...');
            const { data: nuevaCita, error: errorGuardado } = await supabase
                .from('citas')
                .insert([{
                    nombre: datosFormulario.nombre,
                    telefono: datosFormulario.telefono,
                    email: datosFormulario.email,
                    fecha: datosFormulario.fecha,
                    hora: datosFormulario.hora,
                    estado: 'pendiente'
                }])
                .select();

            if (errorGuardado) {
                console.log('Error al guardar la cita:', errorGuardado);
                mostrarError('Error al guardar la cita. Por favor, inténtelo nuevamente.');
                return;
            }

            if (!nuevaCita || nuevaCita.length === 0) {
                console.log('No se recibió confirmación de la cita guardada');
                mostrarError('No se pudo guardar la cita. Por favor, inténtelo nuevamente.');
                return;
            }

            console.log('Cita guardada exitosamente:', nuevaCita);

            // Si llegamos aquí, la cita se guardó correctamente
            // Primero limpiar el formulario y actualizar la UI
            formulario.reset();
            slotSeleccionado.style.display = 'none';
            actualizarBotonEnviar();

            // Disparar evento para actualizar el calendario
            const eventoActualizacion = new CustomEvent('citaGuardada', {
                detail: { fecha: datosFormulario.fecha, hora: datosFormulario.hora }
            });
            window.dispatchEvent(eventoActualizacion);

            // Solo después de limpiar todo y confirmar que se guardó, mostrar el mensaje de éxito
            mostrarExito();

        } catch (error) {
            console.error('Error inesperado en el proceso de agendamiento:', error);
            mostrarError('Ha ocurrido un error inesperado. Por favor, inténtelo nuevamente.');
        } finally {
            // Restaurar el botón
            botonEnviar.disabled = false;
            botonEnviar.innerHTML = '<i class="fas fa-calendar-check"></i> Agendar Cita';
        }
    });

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