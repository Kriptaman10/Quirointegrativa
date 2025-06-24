// Funciones de utilidad
function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toast-notificacion');
    const mensajeToast = document.getElementById('mensaje-toast');
    const icono = toast.querySelector('i');
    
    // Configurar el estilo según el tipo
    toast.style.background = tipo === 'error' ? '#ff5252' : '#4fc3f7';
    icono.className = tipo === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    
    mensajeToast.textContent = mensaje;
    toast.style.display = 'flex';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Función para formatear fecha y hora
function formatearFechaHora(fecha, hora) {
    const fechaObj = new Date(fecha);
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', opcionesFecha);
    return `${fechaFormateada} a las ${hora}`;
}

// Función para cargar los horarios extra
async function cargarHorariosExtra() {
    try {
        const { data: horarios, error } = await supabaseClient
            .from('horarios_disponibles')
            .select('*')
            .eq('tipo', 'extra')
            .order('fecha', { ascending: true });

        if (error) throw error;

        const tabla = document.getElementById('tabla-horarios-extra');
        tabla.innerHTML = `
            <table class="tabla-horarios">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${horarios.map(horario => `
                        <tr>
                            <td>${formatearFechaHora(horario.fecha, horario.hora)}</td>
                            <td>${horario.hora}</td>
                            <td>
                                <button class="boton-eliminar" onclick="eliminarHorarioExtra('${horario.id}')">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        mostrarToast('Error al cargar los horarios extra', 'error');
    }
}

// Función para agregar un horario extra
async function agregarHorarioExtra(evento) {
    evento.preventDefault();
    
    const fecha = document.getElementById('fecha-extra').value;
    const hora = document.getElementById('hora-extra').value;
    
    if (!fecha || !hora) {
        mostrarToast('Por favor, complete todos los campos', 'error');
        return;
    }
    
    try {
        // Verificar si ya existe un horario en esa fecha y hora
        const { data: horarioExistente, error: errorVerificacion } = await supabaseClient
            .from('horarios_disponibles')
            .select('*')
            .eq('fecha', fecha)
            .eq('hora', hora)
            .single();

        if (horarioExistente) {
            mostrarToast('Ya existe un horario programado para esta fecha y hora', 'error');
            return;
        }

        // Insertar el nuevo horario
        const { error } = await supabaseClient
            .from('horarios_disponibles')
            .insert([
                {
                    fecha: fecha,
                    hora: hora,
                    tipo: 'extra'
                }
            ]);

        if (error) throw error;

        // Limpiar el formulario y actualizar la tabla
        document.getElementById('formulario-horario-extra').reset();
        await cargarHorariosExtra();
        mostrarToast('Horario extra agregado exitosamente');
        
    } catch (error) {
        console.error('Error al agregar horario:', error);
        mostrarToast('Error al agregar el horario extra', 'error');
    }
}

// Función para eliminar un horario extra
async function eliminarHorarioExtra(id) {
    if (!confirm('¿Está seguro de que desea eliminar este horario extra?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('horarios_disponibles')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await cargarHorariosExtra();
        mostrarToast('Horario extra eliminado exitosamente');
        
    } catch (error) {
        console.error('Error al eliminar horario:', error);
        mostrarToast('Error al eliminar el horario extra', 'error');
    }
}

/*
// Funciones para gestionar citas
$(document).ready(function() {
    // Inicializar el calendario
    $('#calendario').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        events: async function(start, end, timezone, callback) {
            try {
                const { data: citas, error } = await supabaseClient
                    .from('citas')
                    .select('*')
                    .order('fecha', { ascending: true });

                if (error) throw error;

                const eventos = citas.map(cita => ({
                    title: cita.nombre,
                    start: moment(`${cita.fecha} ${cita.hora}`),
                    allDay: false
                }));

                callback(eventos);
            } catch (error) {
                console.error('Error al cargar citas:', error);
                mostrarToast('Error al cargar las citas', 'error');
            }
        },
        editable: true,
        eventLimit: true,
        selectable: true,
        select: function(start, end) {
            // Lógica para seleccionar una fecha en el calendario
            $('#fecha-cita').val(moment(start).format('YYYY-MM-DD'));
            $('#hora-cita').val(moment(start).format('HH:mm'));
        }
    });

    // Mostrar el formulario al hacer clic en el botón
    $('#btn-agregar-cita').on('click', function() {
        $('#formulario-cita').toggle(); // Alternar la visibilidad del formulario
    });

    // Manejar el envío del formulario
    $('#form-agendar-cita').on('submit', async function(event) {
        event.preventDefault(); // Prevenir el envío normal del formulario

        const nombre = $('#nombre-paciente').val();
        const telefono = $('#telefono-paciente').val();
        const email = $('#email-paciente').val();
        const rut = $('#rut-paciente').val();
        const fechaNacimiento = $('#fecha-nacimiento').val();
        const fechaCita = $('#fecha-cita').val();
        const horaCita = $('#hora-cita').val();

        // Enviar la cita a la base de datos
        const response = await fetch('/api/agendar-cita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                telefono,
                email,
                rut,
                fechaNacimiento,
                fecha: fechaCita,
                hora: horaCita
            })
        });

        if (response.ok) {
            const cita = await response.json();
            // Agregar la nueva cita al calendario
            $('#calendario').fullCalendar('renderEvent', {
                title: nombre,
                start: moment(`${fechaCita} ${horaCita}`),
                allDay: false
            });
            mostrarToast('Cita agendada correctamente');
            $('#formulario-cita').hide(); // Ocultar el formulario después de agendar
        } else {
            mostrarToast('Error al agendar la cita', 'error');
        }
    });
});
*/

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {

    // CALENDARIO
    const calendarEl = document.getElementById('calendario');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'es',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:30:00',
        slotDuration: '00:30:00',

        allDaySlot: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes
            startTime: '08:00',
            endTime: '20:00'
        },

        unselectAuto: false,        
        selectable: true,
        selectMirror: true,
        eventMaxStack: 1,
        eventOrder: 'tipo,-start',
        eventOverlap: false,
        events: async function(fetchInfo, successCallback, failureCallback) {
            try {
                // Cargar citas desde Supabase
                const { data: citas, error } = await supabaseClient
                    .from('citas')
                    .select('*')
                    .gte('fecha', fetchInfo.startStr.split('T')[0])
                    .lte('fecha', fetchInfo.endStr.split('T')[0]);
                if (error) throw error;

                // Puedes agregar aquí horarios extra si lo deseas, como en panel-medico.js

                const eventos = citas.map(cita => ({
                    id: `cita-${cita.id}`,
                    title: cita.nombre,
                    start: `${cita.fecha}T${cita.hora}`,
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
                    extendedProps: {
                        citaData: cita
                    }
                }));

                successCallback(eventos);
            } catch (error) {
                console.error('Error cargando eventos:', error);
                failureCallback(error);
            }
        },
        select: function(info) {
            // Al seleccionar un slot, rellenar el formulario
            document.getElementById('fecha-cita').value = info.startStr.split('T')[0];
            document.getElementById('hora-cita').value = info.startStr.split('T')[1]?.substring(0,5) || '';
        }
    });
    calendar.render();

    //BOTÓN PARA AGENDAR CITA EN PANEL ADMIN
    const btnAgregarCita = document.getElementById('btn-agregar-cita');
    const formularioCita = document.getElementById('formulario-cita');
    if (btnAgregarCita && formularioCita) {
        btnAgregarCita.addEventListener('click', () => {
            formularioCita.style.display = formularioCita.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    // Cargar horarios al iniciar
    cargarHorariosExtra();
    
    // Agregar listener al formulario
    document.getElementById('formulario-horario-extra')
        .addEventListener('submit', agregarHorarioExtra);
});
