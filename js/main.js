//añadido supabase dentro del main.js para los eventos del calendario

const supabaseConfig = {
    url: 'https://ivneinajrywdljevjgjx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'
}
const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const calendarEl = document.getElementById('calendario');
    const selectedSlotEl = document.getElementById('slot-seleccionado');
    const submitButton = document.querySelector('.boton-agendar');
    const dateInput = document.getElementById('fecha');
    const timeInput = document.getElementById('hora');
    const form = document.querySelector('.formulario-citas');

    let selectedDate = null;
    let selectedTime = null;

    // Configuración del calendario
    const calendar = new FullCalendar.Calendar(calendarEl, {
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
        unselectAuto: false,
        selectable: true,
        selectMirror: true,

        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
            startTime: '17:30',
            endTime: '20:00'
        },
        
        //Permite que no se pueda seleccionar un slot que ya tenga un evento
        selectOverlap: false,

        selectConstraint: 'businessHours',

        //Solo elige slots de 30 minutos y no se arrastra
        selectAllow: function(selectInfo) {
            // Verifica si hay un evento en ese slot
            const diff = (selectInfo.end - selectInfo.start) / (1000 * 60); // minutos
            const events = calendar.getEvents();
            const slotStart = selectInfo.start.toISOString();
            return !events.some(ev => ev.start.toISOString() === slotStart) && diff === 30;

        },     

        select: function(info) {

            const end = new Date(info.end.getTime());
            const start = new Date(end.getTime() - 30 * 60 * 1000);

            const fecha = start.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const hora = start.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });

            // Guardar la selección
            selectedDate = start.toISOString().split('T')[0];
            selectedTime = hora;

            // Mostrar la selección
            selectedSlotEl.style.display = 'block';
            selectedSlotEl.querySelector('span').textContent = `${fecha} a las ${hora}`;

            // Actualizar campos ocultos
            dateInput.value = selectedDate;
            timeInput.value = selectedTime;
            submitButton.disabled = false;
        },

        unselect: function() {
            // No limpiar la selección al hacer clic en otros elementos
            if (selectedDate && selectedTime) {
                return;
            }
            selectedSlotEl.style.display = 'none';
            selectedSlotEl.querySelector('span').textContent = '';
            dateInput.value = '';
            timeInput.value = '';
            submitButton.disabled = true;
        },

        validRange: function(nowDate) {
            return {
                start: nowDate
            };
        },

        // Cargar eventos desde Supabase
        // Trae citas confirmadas o pendientes y horarios extra
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                // Trae solo citas confirmadas o pendientes en el rango visible
                const { data: citas, error: errorCitas } = await supabase
                    .from('citas')
                    .select('*')
                    .in('estado', ['pendiente', 'confirmada'])
                    .gte('fecha', fetchInfo.startStr.split('T')[0])
                    .lte('fecha', fetchInfo.endStr.split('T')[0]);

                if (errorCitas) throw errorCitas;

                // Trae horarios extra en el rango visible
                const { data: horariosExtra, error: errorHorarios } = await supabase
                    .from('horarios_disponibles')
                    .select('*')
                    .eq('tipo', 'extra')
                    .gte('fecha', fetchInfo.startStr.split('T')[0])
                    .lte('fecha', fetchInfo.endStr.split('T')[0]);

                if (errorHorarios) throw errorHorarios;

                let eventos = [];

                // Agrega las citas ocupadas
                if (citas) {
                    eventos = citas.map(cita => ({
                        id: `cita-${cita.id}`,
                        title: 'Ocupado',
                        start: `${cita.fecha}T${cita.hora}`,
                        color: '#e74c3c', // Rojo para ocupado
                        editable: false,
                        overlap: false
                    }));
                }

                // Agrega los horarios extra como ocupados
                if (horariosExtra) {
                    const eventosHorariosExtra = horariosExtra.map(horario => ({
                        id: `extra-${horario.id}`,
                        title: 'Reservado',
                        start: `${horario.fecha}T${horario.hora}`,
                        color: '#f39c12', // Naranja para horario extra
                        editable: false,
                        overlap: false
                    }));
                    eventos = eventos.concat(eventosHorariosExtra);
                }

                successCallback(eventos);
            } catch (error) {
                console.error('Error cargando eventos:', error);
                failureCallback(error);
            }
        },  

        buttonText: {
            today: 'Hoy',
            week: 'Semana',
            day: 'Día'
        },

        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        },

        nowIndicator: true,
        height: 'auto',
        expandRows: true
    });

    calendar.render();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Deshabilitar botón para evitar doble envío
        submitButton.disabled = true;

        // Obtén todos los valores del formulario
        const nombre = form.querySelector('[name="nombre"]').value;
        const email = form.querySelector('[name="email"]').value;
        const telefono = form.querySelector('[name="telefono"]').value;
        const rut = form.querySelector('[name="rut"]').value;
        const fecha_nacimiento = form.querySelector('[name="fecha_nacimiento"]').value;
        const fecha_cita = dateInput.value;
        const hora_cita = timeInput.value;

        // Aquí puedes integrar las validaciones de validacion-formulario.js si es necesario

        try {
            // 1. Buscar o crear el paciente (Upsert)
            // .upsert() intenta actualizar si encuentra una coincidencia (basado en el 'rut'), 
            // o inserta un nuevo registro si no la encuentra.
            const { data: pacienteData, error: pacienteError } = await supabase
                .from('pacientes')
                .upsert({
                    rut: rut,
                    nombre: nombre,
                    email: email,
                    telefono: telefono,
                    fecha_nacimiento: fecha_nacimiento
                }, {
                    onConflict: 'rut' // Usa la columna 'rut' para detectar conflictos
                })
                .select() // Devuelve el registro insertado o actualizado
                .single(); // Esperamos un solo resultado

            if (pacienteError) {
                throw pacienteError;
            }

            // 2. Crear la cita vinculada al paciente
            const { error: citaError } = await supabase
                .from('citas')
                .insert([
                    {
                        paciente_id: pacienteData.id, // Asumiendo que tienes una columna 'paciente_id'
                        nombre: nombre, // Aún guardamos el nombre para mostrarlo fácil en el calendario
                        email: email,
                        telefono: telefono,
                        fecha: fecha_cita,
                        hora: hora_cita,
                        estado: 'pendiente'
                    }
                ]);

            if (citaError) {
                throw citaError;
            }

            alert('¡Cita agendada con éxito!');
            calendar.refetchEvents();
            form.reset();
            selectedSlotEl.style.display = 'none';
            dateInput.value = '';
            timeInput.value = '';

        } catch (error) {
            console.error('Error al agendar la cita:', error);
            alert('Error al agendar la cita: ' + error.message);
        } finally {
            // Reactivar el botón al final
            submitButton.disabled = false;
        }
    });

    // Mantener la selección cuando el formulario recibe el foco
    form.addEventListener('focusin', function(e) {
        if (selectedDate && selectedTime) {
            dateInput.value = selectedDate;
            timeInput.value = selectedTime;
            selectedSlotEl.style.display = 'block';
        }
    });
}); 