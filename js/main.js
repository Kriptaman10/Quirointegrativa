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
        selectable: true,
        selectMirror: true,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
            startTime: '17:30',
            endTime: '20:00'
        },
        selectConstraint: 'businessHours',
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

            // Guardar la selección
            selectedDate = info.start.toISOString().split('T')[0];
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