document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const calendarEl = document.getElementById('calendar');
    const selectedSlotEl = document.getElementById('selected-slot');
    const submitButton = document.querySelector('.btn-agendar');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');

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

            selectedSlotEl.style.display = 'block';
            selectedSlotEl.querySelector('span').textContent = `${fecha} a las ${hora}`;

            dateInput.value = info.start.toISOString().split('T')[0];
            timeInput.value = hora;
            submitButton.disabled = false;
        },
        unselect: function() {
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
    const appointmentForm = document.querySelector('.appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                nombre: document.getElementById('patient-name').value,
                telefono: document.getElementById('patient-phone').value,
                email: document.getElementById('patient-email').value,
                fecha: dateInput.value,
                hora: timeInput.value
            };

            try {
                const response = await fetch('http://localhost:3000/api/citas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    alert('¡Cita agendada exitosamente!');
                    appointmentForm.reset();
                    calendar.unselect();
                } else {
                    throw new Error(data.error || 'Error al agendar la cita');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Hubo un error al agendar la cita. Por favor, intente nuevamente.');
            }
        });
    }
}); 