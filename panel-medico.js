// Funciones para el Modal de Modificación de Cita
function abrirModalModificar(citaId) {
    const modal = document.getElementById('modal-modificar-cita');
    
    // Prevenir scroll del body
    document.body.classList.add('modal-open');
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Cargar datos de la cita si es necesario
    cargarDatosCita(citaId);
}

function cerrarModalModificar() {
    const modal = document.getElementById('modal-modificar-cita');
    
    // Quitar clase show para animación de cierre
    modal.classList.remove('show');
    
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');
    
    // Ocultar modal después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Funciones para el Modal de Registro de Paciente
function abrirModalRegistrarPaciente(horarioData) {
    const modal = document.getElementById('modalRegistrarPaciente');
    
    // Prevenir scroll del body
    document.body.classList.add('modal-open');
    
    // Mostrar información del horario
    const infoHorario = document.getElementById('infoHorarioExtra');
    if (infoHorario && horarioData) {
        const fechaFormateada = new Date(horarioData.fecha + 'T00:00:00').toLocaleDateString('es-CL');
        infoHorario.textContent = `Fecha: ${fechaFormateada} - Hora: ${horarioData.hora.substring(0, 5)}`;
    }
    
    // Mostrar modal con animación
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function cerrarModalRegistrar() {
    const modal = document.getElementById('modalRegistrarPaciente');
    
    // Quitar clase show para animación de cierre
    modal.classList.remove('show');
    
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');
    
    // Ocultar modal después de la animación
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Limpiar formulario
    document.getElementById('formRegistrarPaciente').reset();
}

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

                // Filtrar citas para mostrar solo las del día o futuras
                const hoy = moment().startOf('day');
                const eventos = citas.filter(cita => moment(`${cita.fecha} ${cita.hora}`).isSameOrAfter(hoy)).map(cita => ({
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar horarios al iniciar
    cargarHorariosExtra(); // Si esta función es necesaria, asegúrate de que esté definida en este archivo

    // Agregar listener al formulario
    document.getElementById('formulario-horario-extra')
        .addEventListener('submit', agregarHorarioExtra); // Asegúrate de que esta función esté definida
});


// Event Listeners para modales
document.addEventListener('DOMContentLoaded', function() {
    // Modal de Modificación - Botón cerrar
    const btnCerrarModificar = document.querySelector('#modal-modificar-cita .btn-cerrar');
    if (btnCerrarModificar) {
        btnCerrarModificar.addEventListener('click', cerrarModalModificar);
    }
    
    // Modal de Modificación - Botón cancelar
    const btnCancelarModificar = document.querySelector('#modal-modificar-cita .btn-cancelar');
    if (btnCancelarModificar) {
        btnCancelarModificar.addEventListener('click', cerrarModalModificar);
    }
    
    // Modal de Modificación - Clic fuera del modal
    const modalModificar = document.getElementById('modal-modificar-cita');
    if (modalModificar) {
        modalModificar.addEventListener('click', function(e) {
            if (e.target === modalModificar) {
                cerrarModalModificar();
            }
        });
    }
    
    // Modal de Registro - Clic fuera del modal
    const modalRegistrar = document.getElementById('modalRegistrarPaciente');
    if (modalRegistrar) {
        modalRegistrar.addEventListener('click', function(e) {
            if (e.target === modalRegistrar) {
                cerrarModalRegistrar();
            }
        });
    }
    
    // Cerrar modales con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modalModificar && modalModificar.classList.contains('show')) {
                cerrarModalModificar();
            }
            if (modalRegistrar && modalRegistrar.classList.contains('show')) {
                cerrarModalRegistrar();
            }
        }
    });
}); 

// Función para cargar la lista de pacientes
async function cargarPacientes() {
    try {
        const { data: citas, error } = await supabase
            .from('citas')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

        // Agrupar citas por paciente
        const pacientes = {};
        citas?.forEach(cita => {
            if (!pacientes[cita.email]) {
                pacientes[cita.email] = {
                    nombre: cita.nombre,
                    email: cita.email,
                    telefono: cita.telefono,
                    citas: []
                };
            }
            pacientes[cita.email].citas.push(cita);
        });

        // Renderizar la lista de pacientes
        renderizarPacientes(Object.values(pacientes));

        // Agregar evento de búsqueda
        document.getElementById('searchPaciente').addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const filteredPacientes = Object.values(pacientes).filter(paciente => 
                paciente.nombre.toLowerCase().includes(query) || 
                paciente.email.toLowerCase().includes(query)
            );
            renderizarPacientes(filteredPacientes);
        });

    } catch (error) {
        console.error('Error al cargar los pacientes:', error);
    }
}

// Función para renderizar la lista de pacientes
function renderizarPacientes(pacientes) {
    const patientsList = document.querySelector('.patients-list');
    patientsList.innerHTML = pacientes.length
        ? `<div class="patients-grid">
            ${pacientes.map(paciente => {
                const iniciales = paciente.nombre
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                const citasConfirmadas = paciente.citas.filter(c => c.estado === 'confirmada').length;
                const citasPendientes = paciente.citas.filter(c => c.estado === 'pendiente').length;
                const citasCanceladas = paciente.citas.filter(c => c.estado === 'cancelada').length;

                return `
                <div class="patient-card">
                    <div class="patient-header">
                        <div class="patient-avatar">
                            ${iniciales}
                        </div>
                        <div class="patient-info">
                            <h3>${paciente.nombre}</h3>
                            <small>Paciente #${Math.floor(Math.random() * 10000)}</small>
                        </div>
                    </div>

                    <div class="patient-contact">
                        <p>
                            <i class="fas fa-envelope"></i>
                            ${paciente.email}
                        </p>
                        <p>
                            <i class="fas fa-phone"></i>
                            ${paciente.telefono}
                        </p>
                    </div>

                    <div class="patient-stats">
                        <div class="stat-item">
                            <div class="stat-value">${citasConfirmadas}</div>
                            <div class="stat-label">Confirmadas</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${citasPendientes}</div>
                            <div class="stat-label">Pendientes</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${citasCanceladas}</div>
                            <div class="stat-label">Canceladas</div>
                        </div>
                    </div>

                    <div class="patient-appointments">
                        <h4>Últimas citas:</h4>
                        <ul class="appointment-history">
                            ${paciente.citas.slice(-3).map(cita => `
                                <li>
                                    <span class="appointment-date">${cita.fecha} - ${cita.hora}</span>
                                    <span class="appointment-status status-${cita.estado}">${cita.estado}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `}).join('')}
        </div>`
        : '<p>No hay pacientes registrados</p>';
}
