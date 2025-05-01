document.addEventListener('DOMContentLoaded', async function() {
    // Elementos del DOM
    const elementoCalendario = document.getElementById('calendario');
    const slotSeleccionado = document.getElementById('slot-seleccionado');
    const botonEnviar = document.querySelector('.boton-agendar');
    const inputFecha = document.getElementById('fecha');
    const inputHora = document.getElementById('hora');

    // Configuración de Supabase
    const SUPABASE_URL = 'https://ivneinajrywdljevjgjx.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let horariosOcupados = new Set();

    // Función para cargar las citas existentes
    async function cargarCitasExistentes() {
        try {
            console.log('Iniciando carga de citas existentes...');
            const { data: citas, error } = await supabase
                .from('citas')
                .select('fecha, hora, estado')
                .in('estado', ['confirmada', 'pendiente']);

            if (error) {
                console.error('Error al cargar citas desde Supabase:', error);
                throw error;
            }

            console.log('Citas obtenidas de Supabase:', citas);

            // Limpiar el set de horarios ocupados
            horariosOcupados.clear();
            console.log('Set de horarios ocupados limpiado');

            // Convertir las citas a eventos del calendario
            const eventos = citas.map(cita => {
                // Agregar al set de horarios ocupados
                const horarioKey = `${cita.fecha}T${cita.hora}`;
                horariosOcupados.add(horarioKey);
                console.log('Agregado horario ocupado:', horarioKey);
                
                return {
                    start: `${cita.fecha}T${cita.hora}:00`,
                    end: `${cita.fecha}T${agregarMinutos(cita.hora, 30)}:00`,
                    display: 'background',
                    backgroundColor: cita.estado === 'confirmada' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 165, 0, 0.3)',
                    overlap: false,
                    selectable: false
                };
            });

            console.log('Eventos del calendario creados:', eventos);
            console.log('Horarios ocupados actuales:', Array.from(horariosOcupados));

            return eventos;
        } catch (error) {
            console.error('Error en cargarCitasExistentes:', error);
            return [];
        }
    }

    // Función auxiliar para agregar minutos a una hora
    function agregarMinutos(hora, minutos) {
        const [horas, mins] = hora.split(':').map(Number);
        const fecha = new Date();
        fecha.setHours(horas, mins + minutos);
        return fecha.toTimeString().slice(0, 5);
    }

    // Cargar citas existentes y configurar el calendario
    const citasExistentes = await cargarCitasExistentes();

    // Configuración del calendario
    const calendario = new FullCalendar.Calendar(elementoCalendario, {
        initialView: 'timeGridWeek',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        slotMinTime: '17:30:00',
        slotMaxTime: '20:00:00',
        slotDuration: '00:30:00',
        allDaySlot: false,
        height: 'auto',
        expandRows: true,
        slotEventOverlap: false,
        nowIndicator: true,
        dayMaxEvents: true,
        eventMaxStack: 3,
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            meridiem: 'short'
        },
        views: {
            timeGridWeek: {
                titleFormat: { year: 'numeric', month: 'long', day: '2-digit' }
            },
            timeGridDay: {
                titleFormat: { year: 'numeric', month: 'long', day: '2-digit', weekday: 'long' }
            }
        },
        buttonText: {
            today: 'Hoy',
            week: 'Semana',
            day: 'Día'
        },
        selectable: true,
        selectMirror: true,
        unselectAuto: false,
        selectConstraint: 'businessHours',
        selectOverlap: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '17:30',
            endTime: '20:00'
        },
        eventClassNames: function(arg) {
            return ['calendario-evento', arg.event.extendedProps.estado];
        },
        eventContent: function(arg) {
            if (arg.event.display === 'background') {
                return {
                    html: `<div class="evento-ocupado ${arg.event.extendedProps.estado || ''}">
                        <i class="fas fa-clock"></i> Ocupado
                    </div>`
                };
            }
        },
        selectAllow: function(selectInfo) {
            const fecha = selectInfo.startStr.split('T')[0];
            const hora = selectInfo.startStr.split('T')[1].slice(0, 5);
            const horarioKey = `${fecha}T${hora}`;
            return !horariosOcupados.has(horarioKey);
        },
        dayCellDidMount: function(arg) {
            // Agregar indicador visual para días fuera del rango válido
            if (arg.date < new Date()) {
                arg.el.classList.add('fc-day-disabled');
            }
        }
    });

    calendario.render();

    // Manejar el envío del formulario
    const formularioCitas = document.querySelector('.formulario-citas');
    if (formularioCitas) {
        formularioCitas.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datosFormulario = {
                nombre: document.getElementById('nombre-paciente').value,
                telefono: document.getElementById('telefono-paciente').value,
                email: document.getElementById('email-paciente').value,
                fecha: inputFecha.value,
                hora: inputHora.value
            };

            try {
                // Verificar nuevamente si el horario está ocupado
                const horarioKey = `${datosFormulario.fecha}T${datosFormulario.hora}`;
                console.log('Intentando verificar disponibilidad para:', horarioKey);

                if (horariosOcupados.has(horarioKey)) {
                    console.log('Horario encontrado como ocupado en caché local');
                    calendario.unselect();
                    throw new Error('Este horario ya no está disponible. Por favor seleccione otro.');
                }

                let verificacionRes;
                try {
                    const url = `http://localhost:3000/api/disponibilidad?fecha=${datosFormulario.fecha}&hora=${datosFormulario.hora}`;
                    console.log('Consultando disponibilidad en:', url);
                    verificacionRes = await fetch(url);
                    console.log('Respuesta del servidor:', verificacionRes.status);
                } catch (error) {
                    console.error('Error de conexión al verificar disponibilidad:', error);
                    throw new Error('No se pudo conectar con el servidor. Por favor, verifique su conexión e intente nuevamente.');
                }
                
                if (!verificacionRes.ok) {
                    console.error('Error en respuesta del servidor:', verificacionRes.status, verificacionRes.statusText);
                    throw new Error('Error al verificar disponibilidad. Por favor, intente nuevamente.');
                }
                
                const verificacionData = await verificacionRes.json();
                console.log('Respuesta de verificación:', verificacionData);

                if (!verificacionData.disponible) {
                    calendario.unselect();
                    throw new Error('Este horario ya no está disponible. Por favor seleccione otro.');
                }

                // Si llegamos aquí, el horario está disponible
                console.log('Horario disponible, procediendo a guardar la cita');

                let respuesta;
                try {
                    console.log('Intentando guardar cita:', datosFormulario);
                    respuesta = await fetch('http://localhost:3000/api/citas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datosFormulario)
                    });
                    console.log('Respuesta del servidor al guardar:', respuesta.status);
                } catch (error) {
                    console.error('Error de conexión al guardar cita:', error);
                    throw new Error('No se pudo conectar con el servidor. Por favor, verifique su conexión e intente nuevamente.');
                }

                if (!respuesta.ok) {
                    const datos = await respuesta.json();
                    console.error('Error en respuesta del servidor al guardar:', respuesta.status, respuesta.statusText, datos);
                    throw new Error(datos.error || 'Error al agendar la cita');
                }

                const datos = await respuesta.json();
                console.log('Respuesta exitosa al guardar:', datos);

                // Solo si llegamos aquí sin errores, procedemos con el éxito
                horariosOcupados.add(horarioKey);
                console.log('Horario agregado a caché local:', horarioKey);

                // Recargar las citas antes de mostrar el mensaje de éxito
                try {
                    console.log('Recargando lista de citas...');
                    const nuevasCitas = await cargarCitasExistentes();
                    calendario.removeAllEvents();
                    calendario.addEventSource(nuevasCitas);
                    console.log('Citas recargadas exitosamente');
                } catch (error) {
                    console.error('Error al recargar citas:', error);
                }

                // Mostrar notificación de éxito
                const toastExito = document.getElementById('toast-exito');
                toastExito.style.display = 'flex';
                setTimeout(() => {
                    toastExito.style.display = 'none';
                }, 3000);
                
                formularioCitas.reset();
                calendario.unselect();
            } catch (error) {
                console.error('Error en el proceso de agenda:', error);
                const mensajeError = error.message || 'Hubo un error al agendar la cita. Por favor, intente nuevamente.';
                const toastError = document.getElementById('toast-error');
                if (toastError) {
                    toastError.textContent = mensajeError;
                    toastError.style.display = 'flex';
                    setTimeout(() => {
                        toastError.style.display = 'none';
                    }, 3000);
                } else {
                    alert(mensajeError);
                }
                calendario.unselect();
            }
        });
    }
}); 