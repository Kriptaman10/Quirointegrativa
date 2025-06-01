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
    let horariosExtra = new Set();
    let ultimaActualizacion = null;
    const INTERVALO_ACTUALIZACION = 5 * 60 * 1000; // 5 minutos

    // Función para cargar las citas existentes y horarios extra
    async function cargarCitasExistentes() {
        try {
            console.log('Iniciando carga de citas existentes...');
            
            // Cargar citas
            const { data: citas, error: errorCitas } = await supabase
                .from('citas')
                .select('fecha, hora, estado')
                .in('estado', ['confirmada', 'pendiente'])
                .gte('fecha', new Date().toISOString().split('T')[0]);

            if (errorCitas) throw errorCitas;

            // Cargar horarios extra
            const { data: horariosExtra, error: errorHorarios } = await supabase
                .from('horarios_disponibles')
                .select('*')
                .eq('tipo', 'extra')
                .gte('fecha', new Date().toISOString().split('T')[0]);

            if (errorHorarios) throw errorHorarios;

            console.log('Citas obtenidas:', citas);
            console.log('Horarios extra obtenidos:', horariosExtra);

            // Limpiar los sets
            horariosOcupados.clear();
            horariosExtra.clear();

            // Procesar citas (solo aquí se usa 'estado')
            const eventosCitas = citas.map(cita => {
                const horarioKey = `${cita.fecha}T${cita.hora}`;
                horariosOcupados.add(horarioKey);
                // 'estado' solo se usa para citas
                return {
                    start: `${cita.fecha}T${cita.hora}:00`,
                    end: `${cita.fecha}T${agregarMinutos(cita.hora, 30)}:00`,
                    classNames: ['ocupado', cita.estado],
                    extendedProps: {
                        estado: cita.estado, // solo para citas
                        ocupado: true
                    }
                };
            });

            // Procesar horarios extra (NO usar 'estado')
            const eventosHorariosExtra = horariosExtra.map(horario => {
                const horarioKey = `${horario.fecha}T${horario.hora}`;
                horariosExtra.add(horarioKey);
                return {
                    start: `${horario.fecha}T${horario.hora}:00`,
                    end: `${horario.fecha}T${agregarMinutos(horario.hora, 30)}:00`,
                    classNames: ['disponible', 'horario-extra'],
                    extendedProps: {
                        esExtra: true
                    }
                };
            });

            const todosLosEventos = [...eventosCitas, ...eventosHorariosExtra];
            console.log('Eventos totales:', todosLosEventos);

            ultimaActualizacion = new Date();
            return todosLosEventos;
        } catch (error) {
            console.error('Error en cargarCitasExistentes:', error);
            mostrarError('Error al cargar los horarios disponibles. Por favor, recargue la página.');
            return [];
        }
    }

    // Función para actualizar periódicamente los horarios
    async function actualizarHorariosPeriodicamente() {
        if (!ultimaActualizacion || (new Date() - ultimaActualizacion) > INTERVALO_ACTUALIZACION) {
            try {
                const nuevasCitas = await cargarCitasExistentes();
                calendario.removeAllEvents();
                calendario.addEventSource(nuevasCitas);
                console.log('Horarios actualizados exitosamente');
            } catch (error) {
                console.error('Error al actualizar horarios:', error);
            }
        }
    }

    // Función para mostrar errores
    function mostrarError(mensaje) {
        const toastError = document.getElementById('toast-error');
        if (toastError) {
            toastError.textContent = mensaje;
            toastError.style.display = 'flex';
            setTimeout(() => {
                toastError.style.display = 'none';
            }, 3000);
        } else {
            alert(mensaje);
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

    // Agregar leyenda al calendario
    const leyenda = document.createElement('div');
    leyenda.className = 'calendario-leyenda';
    leyenda.innerHTML = `
        <div class="leyenda-item">
            <span class="leyenda-color" style="background-color: #5cb85c;"></span>
            <span>Disponible</span>
        </div>
        <div class="leyenda-item">
            <span class="leyenda-color" style="background-color: #dddddd;"></span>
            <span>Pendiente</span>
        </div>
        <div class="leyenda-item">
            <span class="leyenda-color" style="background-color: #ff4d4d;"></span>
            <span>Confirmado</span>
        </div>
    `;
    elementoCalendario.parentNode.insertBefore(leyenda, elementoCalendario);

    // Configuración del calendario
    const calendario = new FullCalendar.Calendar(elementoCalendario, {
        initialView: 'timeGridWeek',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        slotMinTime: '09:00:00', // Modificado para permitir horarios extra
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
        unselectAuto: true,
        selectConstraint: 'businessHours',
        selectOverlap: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Incluir sábados
            startTime: '09:00',
            endTime: '20:00'
        },
        eventDidMount: function(info) {
            const fecha = info.event.start.toISOString().split('T')[0];
            const hora = info.event.start.toTimeString().slice(0, 5);
            const horarioKey = `${fecha}T${hora}`;
            
            if (horariosOcupados.has(horarioKey)) {
                info.el.classList.add('ocupado');
                info.el.classList.add(info.event.extendedProps.estado);
                info.el.style.pointerEvents = 'none';
                
                const icono = info.event.extendedProps.estado === 'confirmada' ? 'fa-check-circle' : 'fa-clock';
                const texto = info.event.extendedProps.estado === 'confirmada' ? 'Confirmada' : 'Pendiente';
                
                info.el.innerHTML = `
                    <div class="evento-ocupado">
                        <i class="fas ${icono}"></i>
                        <span>${texto}</span>
                    </div>
                `;
            } else if (horariosExtra.has(horarioKey)) {
                info.el.classList.add('disponible', 'horario-extra');
                info.el.innerHTML = `
                    <div class="evento-disponible">
                        <i class="fas fa-star"></i>
                        <span>Horario Extra</span>
                    </div>
                `;
            } else {
                info.el.classList.add('disponible');
            }
        },
        eventClick: function(info) {
            if (info.event.extendedProps.ocupado) {
                info.jsEvent.preventDefault();
                return false;
            }
        },
        selectAllow: function(selectInfo) {
            const fecha = selectInfo.startStr.split('T')[0];
            const hora = selectInfo.startStr.split('T')[1].slice(0, 5);
            const horarioKey = `${fecha}T${hora}`;
            
            if (horariosOcupados.has(horarioKey)) {
                mostrarError('Este horario ya está ocupado. Por favor seleccione otro.');
                return false;
            }
            
            const fechaSeleccionada = new Date(selectInfo.start);
            if (fechaSeleccionada < new Date()) {
                mostrarError('No se pueden seleccionar fechas pasadas.');
                return false;
            }
            
            return true;
        },
        select: function(info) {
            const fecha = info.start.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const hora = info.start.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            slotSeleccionado.style.display = 'block';
            slotSeleccionado.querySelector('span').textContent = `${fecha} a las ${hora}`;

            inputFecha.value = info.start.toISOString().split('T')[0];
            inputHora.value = hora;
            botonEnviar.disabled = false;
        },
        unselect: function() {
            slotSeleccionado.style.display = 'none';
            slotSeleccionado.querySelector('span').textContent = '';
            inputFecha.value = '';
            inputHora.value = '';
            botonEnviar.disabled = true;
        },
        dayCellDidMount: function(arg) {
            // Agregar indicador visual para días fuera del rango válido
            if (arg.date < new Date()) {
                arg.el.classList.add('fc-day-disabled');
            }
        },
        datesSet: function() {
            // Actualizar horarios cuando cambia la vista
            actualizarHorariosPeriodicamente();
        }
    });

    calendario.render();
    calendario.addEventSource(citasExistentes);

    // Escuchar el evento de cita guardada
    window.addEventListener('citaGuardada', async (e) => {
        console.log('Evento citaGuardada recibido:', e.detail);
        try {
                    const nuevasCitas = await cargarCitasExistentes();
                    calendario.removeAllEvents();
                    calendario.addEventSource(nuevasCitas);
            console.log('Calendario actualizado exitosamente');
                } catch (error) {
            console.error('Error al actualizar calendario:', error);
        }
    });

    // Configurar actualización periódica
    setInterval(actualizarHorariosPeriodicamente, INTERVALO_ACTUALIZACION);
}); 