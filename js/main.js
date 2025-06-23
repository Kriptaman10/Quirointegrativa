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

    // Manejar el envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // Aquí va la lógica de envío del formulario
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