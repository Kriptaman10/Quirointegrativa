document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const elementoCalendario = document.getElementById('calendario');
    const slotSeleccionado = document.getElementById('slot-seleccionado');
    const botonEnviar = document.querySelector('.boton-agendar');
    const inputFecha = document.getElementById('fecha');
    const inputHora = document.getElementById('hora');

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
        selectable: true,
        selectMirror: true,
        unselectAuto: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
            startTime: '17:30',
            endTime: '20:00'
        },
        selectConstraint: 'businessHours',
        select: function(info) {
            const fecha = info.startStr.split('T')[0]
            const hora = info.startStr.split('T')[1].substring(0, 5)
            
            // Emitir evento personalizado
            const evento = new CustomEvent('slotSeleccionado', {
                detail: {
                    fecha: fecha,
                    hora: hora
                }
            })
            window.dispatchEvent(evento)

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
                const respuesta = await fetch('http://localhost:3000/api/citas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosFormulario)
                });

                const datos = await respuesta.json();

                if (respuesta.ok) {
                    alert('¡Cita agendada exitosamente!');
                    formularioCitas.reset();
                    calendario.unselect();
                } else {
                    throw new Error(datos.error || 'Error al agendar la cita');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Hubo un error al agendar la cita. Por favor, intente nuevamente.');
            }
        });
    }
}); 