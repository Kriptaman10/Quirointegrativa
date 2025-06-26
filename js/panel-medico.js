let horarioExtraSeleccionado = null; // Para almacenar el horario extra seleccionado
let calendar = null; // Instancia global del calendario
// Configuración de Supabase
const supabaseConfig = {
    url: 'https://ivneinajrywdljevjgjx.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'
}
const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);

// Configuración de EmailJS
const EMAILJS_CONFIG = {
    serviceId: 'service_b0m35xv',
    templateId: 'template_1mjm41s',
    publicKey: 'fBdM064XPXrY_vm_n'
};

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar EmailJS
    emailjs.init(EMAILJS_CONFIG.publicKey);

    // Verificar si el usuario está logueado
    const medicoLogueado = localStorage.getItem('medicoLogueado')
    if (!medicoLogueado) {
        window.location.href = 'login-medico.html'
        return
    }

    // Función para capitalizar la primera letra de cada palabra
    function capitalizarNombre(nombre) {
        return nombre
            .split(' ')
            .map(palabra =>
                palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
            )
            .join(' ');
    }

    // Presionar el logo para volver al dashboard
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            // Activar tab dashboard
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const dashboardNav = document.querySelector('.nav-item[data-tab="dashboard"]');
            if (dashboardNav) dashboardNav.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const dashboardTab = document.getElementById('dashboard');
            if (dashboardTab) dashboardTab.classList.add('active');
            // Opcional: recargar dashboard
            if (typeof cargarDashboard === 'function') cargarDashboard();
        });
    }

    // Configurar nombre del médico
    const nombreMedico = localStorage.getItem('nombreMedico')
    const nombreCapitalizado = capitalizarNombre(nombreMedico)
    document.getElementById('nombre-medico').innerHTML = `<i class="fas fa-user" style="margin-right:7px; color:#05213c;"></i> ${nombreCapitalizado}`;
    document.getElementById('welcome-name').textContent = nombreCapitalizado.split(' ')[0]

    // Modal de confirmación de logout
    function mostrarModalLogout() {
        // Si ya existe, solo mostrarlo
        let modal = document.getElementById('modalLogout');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalLogout';
            modal.innerHTML = `
                <div class="modal-logout-content">
                    <h3><i class="fas fa-sign-out-alt"></i> ¿Cerrar sesión?</h3>
                    <p>¿Seguro que deseas cerrar sesión?</p>
                    <div class="modal-logout-actions">
                        <button id="btnLogoutCancelar" class="btn-cancelar">Cancelar</button>
                        <button id="btnLogoutConfirmar" class="btn-confirmar">Cerrar sesión</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Elimina la parte de creación de <style>
        }
        modal.style.display = 'flex';

        // Eventos
        document.getElementById('btnLogoutCancelar').onclick = () => {
            modal.style.display = 'none';
        };
        document.getElementById('btnLogoutConfirmar').onclick = () => {
            localStorage.removeItem('medicoLogueado');
            localStorage.removeItem('nombreMedico');
            window.location.href = 'login-medico.html';
        };
        // Cerrar con ESC
        document.addEventListener('keydown', function escListener(e) {
            if (e.key === 'Escape') {
                modal.style.display = 'none';
                document.removeEventListener('keydown', escListener);
            }
        });
        // Cerrar al hacer click fuera del modal
        modal.onclick = function(e) {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // Reemplaza el listener de logout por el modal bonito
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarModalLogout();
    });

    // Manejar navegación por tabs
    const navItems = document.querySelectorAll('.nav-item')
    const tabContents = document.querySelectorAll('.tab-content')

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab

            // Actualizar navegación
            navItems.forEach(nav => nav.classList.remove('active'))
            item.classList.add('active')

            // Actualizar contenido
            tabContents.forEach(content => content.classList.remove('active'))
            document.getElementById(tabId).classList.add('active')

            // Cargar datos específicos del tab
            switch(tabId) {
                case 'dashboard':
                    cargarDashboard()
                    break
                case 'appointments':
                    cargarCitas()
                    break
                case 'schedule':
                    inicializarCalendario()
                    break
                case 'patients':
                    cargarPacientes()
                    break
                case 'reviews':
                    cargarValoraciones()
                    break
            }
            // --- Agrega esta línea para hacer scroll al top ---
            window.scrollTo({ top: 0, behavior: 'auto' });
        })
    })

    // Función para cargar el dashboard
    async function cargarDashboard() {
        try {
            // Obtener estadísticas
            const today = new Date().toISOString().split('T')[0]
            
            // Citas pendientes
            const { data: citasPendientes } = await supabase
                .from('citas')
                .select('*')
                .eq('estado', 'pendiente')
            
            // Citas de hoy
            const { data: citasHoy } = await supabase
                .from('citas')
                .select('*')
                .eq('fecha', today)
            
            // Total de pacientes únicos
            const { data: citas } = await supabase
                .from('citas')
                .select('email')
            const pacientesUnicos = new Set(citas?.map(cita => cita.email))

            // Actualizar contadores
            document.getElementById('pending-count').textContent = citasPendientes?.length || 0
            document.getElementById('today-count').textContent = citasHoy?.length || 0
            document.getElementById('patients-count').textContent = pacientesUnicos.size

            // Cargar próximas citas
            const { data: proximasCitas } = await supabase
                .from('citas')
                .select('*')
                .gte('fecha', today)
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true })
                .limit(5)

            const upcomingAppointments = document.getElementById('upcoming-appointments')
            upcomingAppointments.innerHTML = proximasCitas?.length
                ? `<ul class="appointment-list">
                    ${proximasCitas.map(cita => `
                        <li class="appointment-item">
                            <div>
                                <strong>${cita.nombre}</strong><br>
                                ${cita.fecha} - ${cita.hora}
                            </div>
                            <span class="status-badge status-${cita.estado}">${cita.estado}</span>
                        </li>
                    `).join('')}
                </ul>`
                : '<p>No hay citas próximas</p>'

        } catch (error) {
            console.error('Error al cargar el dashboard:', error)
        }
    }

    // Función para cargar la lista de citas
    async function cargarCitas() {
        try {
            const { data: citas, error } = await supabase
                .from('citas')
                .select('*')
                .order('fecha', { ascending: true })
                .order('hora', { ascending: true })

            if (error) throw error

            const appointmentsList = document.querySelector('.appointments-list')
            appointmentsList.innerHTML = citas?.length
                ? `<div class="appointment-list">
                    ${citas.map(cita => `
                        <div class="cita" data-id="${cita.id}" data-nombre="${cita.nombre}" data-email="${cita.email}" data-fecha="${cita.fecha}" data-hora="${cita.hora}" data-telefono="${cita.telefono}">
                            <div>
                                <strong>${cita.nombre}</strong><br>
                                ${cita.fecha} - ${cita.hora}<br>
                                <small>${cita.email} | ${cita.telefono}</small>
                            </div>
                            <div class="appointment-actions">
                                <span class="status-badge status-${cita.estado}">${cita.estado}</span>
                                <button class="btn-action btn-modificar">
                                    <i class="fas fa-edit"></i> Modificar
                                </button>
                                ${cita.estado === 'pendiente' ? `
                                    <button class="btn-action btn-confirmar">
                                        <i class="fas fa-check"></i> Confirmar
                                    </button>
                                    <button class="btn-action btn-cancelar">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>`
                : '<p>No hay citas registradas</p>'

        } catch (error) {
            console.error('Error al cargar las citas:', error)
        }
    }

    // Función para inicializar el calendario
    function inicializarCalendario() {
        const calendarEl = document.getElementById('calendar');

        // Si ya existe una instancia previa, destrúyela para evitar duplicados
        if (calendar) {
            calendar.destroy();
        }
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            slotMinTime: '08:00:00',
            slotMaxTime: '20:00:00',
            slotDuration: '00:30:00',
            selectable: true,
            selectMirror: true,
            eventMaxStack: 1,
            eventOrder: 'tipo,-start',
            eventOverlap: false,
            events: async function(fetchInfo, successCallback, failureCallback) {
                try {
                    // Cargar citas existentes
                    const { data: citas, error: errorCitas } = await supabase
                        .from('citas')
                        .select('*')
                        .gte('fecha', fetchInfo.startStr.split('T')[0])
                        .lte('fecha', fetchInfo.endStr.split('T')[0]);

                    if (errorCitas) throw errorCitas;

                    // Cargar horarios extra
                    const { data: horariosExtra, error: errorHorarios } = await supabase
                        .from('horarios_disponibles')
                        .select('*')
                        .eq('tipo', 'extra')
                        .gte('fecha', fetchInfo.startStr.split('T')[0])
                        .lte('fecha', fetchInfo.endStr.split('T')[0]);

                    if (errorHorarios) throw errorHorarios;

                    let eventos = [];

                    // Agregar citas como eventos
                    if (citas) {
                        eventos = citas.map(cita => ({
                            id: `cita-${cita.id}`,
                            title: `${cita.nombre} - ${cita.estado}`,
                            start: `${cita.fecha}T${cita.hora}`,
                            backgroundColor: cita.estado === 'confirmada' ? '#27ae60' : '#f39c12',
                            borderColor: cita.estado === 'confirmada' ? '#229954' : '#e67e22',
                            extendedProps: {
                                tipo: 'cita',
                                citaData: cita
                            }
                        }));
                    }

                    // Agregar horarios extra como eventos
                    if (horariosExtra) {
                        const eventosHorariosExtra = horariosExtra.map(horario => ({
                            id: `extra-${horario.id}`,
                            title: 'Horario Extra Disponible',
                            start: `${horario.fecha}T${horario.hora}`,
                            className: 'horario-extra fc-event',
                            backgroundColor: '#f39c12',
                            borderColor: '#e67e22',
                            extendedProps: {
                                tipo: 'horario_extra',
                                horarioData: horario
                            }
                        }));
                        // console.log('Eventos de Horarios Extra generados (con fc-event):', eventosHorariosExtra);
                        eventos = eventos.concat(eventosHorariosExtra);
                    }

                    successCallback(eventos);
                } catch (error) {
                    console.error('Error cargando eventos:', error);
                    failureCallback(error);
                }
            },
            eventDidMount: function(info) {
                const tipoEvento = info.event.extendedProps.tipo;
                // console.log('eventDidMount disparado para tipo:', tipoEvento);
                if (tipoEvento === 'horario_extra') {
                    // console.log('eventDidMount detecta horario extra.');
                    if (info.el) {
                         // console.log('Elemento de evento encontrado en eventDidMount.', info.el);

                        // Asegurar que el elemento del evento esté por encima y sea clicable
                        info.el.style.position = 'relative'; // Necesario para z-index
                        info.el.style.zIndex = '100'; // Asegurar que esté por encima de los slots
                        info.el.style.pointerEvents = 'auto'; // Asegurar que capture eventos del mouse

                        info.el.style.cursor = 'pointer'; // Cambiar cursor

                        // Adjuntar listener de clic (no mousedown)
                        info.el.addEventListener('click', function(event) {
                            console.log('Listener de clic personalizado en eventDidMount disparado.');
                            // Prevenir propagación para evitar que llegue a elementos subyacentes como los slots
                            event.stopPropagation();

                            const horarioData = info.event.extendedProps.horarioData;
                            if (horarioData) {
                                console.log('Datos de horario extra disponibles en listener:', horarioData);
                                abrirModalRegistrarPaciente(horarioData);
                        } else {
                                console.error('HorarioData no encontrado en listener de clic personalizado.');
                                mostrarNotificacion('Error al cargar los datos del horario extra', 'error');
                            }
                        });
                    } else {
                        console.error('Elemento de evento (info.el) no encontrado en eventDidMount para horario extra.');
                    }
                }
            },
            select: async function(info) {
                const fecha = info.start.toISOString().split('T')[0];
                const hora = info.start.toTimeString().slice(0, 8);
                
                try {
                    // Verificar horarios existentes (citas o extra) con dos consultas separadas
                    const { data: citasExistentes, error: errorCitas } = await supabase
                        .from('citas')
                        .select('id')
                        .eq('fecha', fecha)
                        .eq('hora', hora)
                        .in('estado', ['pendiente', 'confirmada']);

                    if (errorCitas) throw errorCitas;

                    const { data: extrasExistentes, error: errorExtras } = await supabase
                        .from('horarios_disponibles')
                        .select('id')
                        .eq('fecha', fecha)
                        .eq('hora', hora)
                        .eq('tipo', 'extra');

                    if (errorExtras) throw errorExtras;

                    if ((citasExistentes && citasExistentes.length > 0) || (extrasExistentes && extrasExistentes.length > 0)) {
                        mostrarNotificacion('Ya existe un horario extra o cita en este horario.', 'error');
                        calendar.unselect();
                            return;
                        }

                    const confirmacion = confirm(`¿Desea marcar este horario como disponible?\nFecha: ${fecha}\nHora: ${hora}`);
                    if (confirmacion) {
                        const horarioNuevo = {
                            fecha: fecha,
                            hora: hora,
                            estado: 'disponible',
                            tipo: 'extra'
                        };
                        
                        const { error: insertError } = await supabase
                            .from('horarios_disponibles')
                            .insert([horarioNuevo]);

                        if (insertError) throw insertError;
                        
                        mostrarNotificacion('Horario extra guardado exitosamente.', 'success');
                        calendar.refetchEvents();
                    }
                    } catch (error) {
                    console.error('Error al verificar/guardar horario:', error);
                    mostrarNotificacion('Error al procesar el horario: ' + (error.message || 'Error desconocido.'), 'error');
                    }
                
                calendar.unselect();
            },
        });
        calendar.render();
    }

    // Función para cargar la lista de pacientes
    async function cargarPacientes() {
        try {
            const { data: citas, error } = await supabase
                .from('citas')
                .select('*')
                .order('nombre', { ascending: true })

            if (error) throw error

            // Agrupar citas por paciente
            const pacientes = {}
            citas?.forEach(cita => {
                if (!pacientes[cita.email]) {
                    pacientes[cita.email] = {
                        nombre: cita.nombre,
                        email: cita.email,
                        telefono: cita.telefono,
                        citas: []
                    }
                }
                pacientes[cita.email].citas.push(cita)
            })

            const patientsList = document.querySelector('.patients-list')
            patientsList.innerHTML = Object.values(pacientes).length
                ? `<div class="patients-grid">
                    ${Object.values(pacientes).map(paciente => {
                        // Obtener iniciales para el avatar
                        const iniciales = paciente.nombre
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                        // Calcular estadísticas
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
                                    <h3>${capitalizarNombre(paciente.nombre)}</h3>
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
                : '<p>No hay pacientes registrados</p>'

        } catch (error) {
            console.error('Error al cargar los pacientes:', error)
        }
    }

    // Función para cargar las valoraciones
    async function cargarValoraciones() {
        try {
            // Obtener todas las valoraciones
            const { data: valoraciones, error } = await supabase
                .from('valoraciones')
                .select('*')
                .order('fecha_creacion', { ascending: false })

            if (error) throw error

            // Calcular estadísticas
            const totalValoraciones = valoraciones.length
            const valoracionesPendientes = valoraciones.filter(v => v.estado === 'pendiente').length
            const promedio = valoraciones.reduce((acc, v) => acc + v.estrellas, 0) / totalValoraciones || 0

            // Actualizar estadísticas
            document.getElementById('total-reviews').textContent = totalValoraciones
            document.getElementById('pending-reviews').textContent = valoracionesPendientes
            document.getElementById('average-rating').textContent = promedio.toFixed(1)

            // Renderizar lista de valoraciones
            const reviewsList = document.querySelector('.reviews-list')
            reviewsList.innerHTML = valoraciones.length
                ? valoraciones.map(valoracion => {
                    // Obtener iniciales para el avatar
                    const iniciales = valoracion.nombre
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)

                    // Crear estrellas
                    const estrellas = '★'.repeat(valoracion.estrellas) + '☆'.repeat(5 - valoracion.estrellas)

                    return `
                        <div class="review-item" data-id="${valoracion.id}">
                            <div class="review-header">
                                <div class="review-user">
                                    <div class="review-avatar">${iniciales}</div>
                                    <div class="review-info">
                                        <h3>${capitalizarNombre(valoracion.nombre)}</h3>
                                        <small>${valoracion.email}</small>
                                    </div>
                                </div>
                                <div class="review-stars">${estrellas}</div>
                            </div>
                            <div class="review-content">
                                ${valoracion.comentario}
                            </div>
                            <div class="review-actions">
                                <span class="review-status status-${valoracion.estado}">
                                    ${valoracion.estado}
                                </span>
                                ${valoracion.estado === 'pendiente' ? `
                                    <button class="btn-review btn-approve" onclick="aprobarValoracion('${valoracion.id}')">
                                        <i class="fas fa-check"></i> Aprobar
                                    </button>
                                    <button class="btn-review btn-reject" onclick="rechazarValoracion('${valoracion.id}')">
                                        <i class="fas fa-times"></i> Rechazar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `
                }).join('')
                : '<p>No hay valoraciones registradas</p>'

        } catch (error) {
            console.error('Error al cargar las valoraciones:', error)
        }
    }

    // Función para aprobar una valoración
    async function aprobarValoracion(id) {
        try {
            const { error } = await supabase
                .from('valoraciones')
                .update({ estado: 'aprobado' })
                .eq('id', id)

            if (error) throw error

            // Encontrar el elemento de la valoración en la UI y actualizar su estado
            const valoracionElement = document.querySelector(`.review-item[data-id='${id}']`);
            if (valoracionElement) {
                const statusBadge = valoracionElement.querySelector('.review-status');
                if (statusBadge) {
                    statusBadge.textContent = 'aprobado';
                    statusBadge.className = 'review-status status-aprobado';
                }
                // Ocultar o eliminar los botones de acción (Aprobar/Rechazar)
                const reviewActions = valoracionElement.querySelector('.review-actions');
                 if (reviewActions) {
                     reviewActions.style.display = 'none';
                 }
            }
            mostrarNotificacion('Valoración aprobada exitosamente', 'success');

        } catch (error) {
            console.error('Error al aprobar la valoración:', error);
             mostrarNotificacion('Error al aprobar la valoración', 'error');
        }
    }

    // Función para rechazar una valoración
    async function rechazarValoracion(id) {
        console.log('Intentando rechazar valoración con ID:', id);
        try {
            const { error } = await supabase
                .from('valoraciones')
                .delete()
                .eq('id', id)

            if (error) {
                console.error('Error de Supabase al eliminar valoración:', error);
                throw new Error(`Error de Supabase: ${error.message}`);
            }

            console.log('Valoración eliminada de Supabase con ID:', id);

            // Eliminar el elemento de la valoración de la UI
            const valoracionElement = document.querySelector(`.review-item[data-id='${id}']`);
            if (valoracionElement) {
                valoracionElement.remove();
                console.log('Elemento de valoración eliminado de la UI con ID:', id);
            }
            mostrarNotificacion('Valoración rechazada y eliminada exitosamente', 'success');

        } catch (error) {
            console.error('Error general al rechazar la valoración:', error);
             mostrarNotificacion('Error al rechazar la valoración: ' + error.message, 'error');
        }
    }

    // Hacer las funciones disponibles globalmente
    window.aprobarValoracion = aprobarValoracion
    window.rechazarValoracion = rechazarValoracion

    // Event delegation for appointment actions
    const appointmentsListContainer = document.querySelector('.appointments-list'); 

    if (appointmentsListContainer) {
        appointmentsListContainer.addEventListener('click', function(event) {
            const clickedButton = event.target.closest('button');
            if (!clickedButton) return; 

            const citaElement = clickedButton.closest('.cita');
            if (!citaElement) return; 

            const citaId = citaElement.dataset.id;
            const nombrePaciente = citaElement.dataset.nombre;
            const emailPaciente = citaElement.dataset.email;
            const fechaCita = citaElement.dataset.fecha;
            const horaCita = citaElement.dataset.hora;
            const telefonoPaciente = citaElement.dataset.telefono;

            // Basic validation for data attributes
            if (!citaId || !nombrePaciente || !emailPaciente || !fechaCita || !horaCita) {
                console.error('Missing data attributes on .cita element:', citaElement.dataset);
                alert('Error: No se pudieron obtener todos los datos de la cita. Intente recargar.');
                return;
            }

            if (clickedButton.classList.contains('btn-modificar')) {
                mostrarModalModificacion({
                    id: citaId,
                    nombre: nombrePaciente,
                    email: emailPaciente,
                    fecha: fechaCita,
                    hora: horaCita,
                    telefono: telefonoPaciente
                });
            } else if (clickedButton.classList.contains('btn-confirmar')) {
                if (window.confirmarCita) {
                    window.confirmarCita(citaId, nombrePaciente, emailPaciente, fechaCita, horaCita, clickedButton);
                } else {
                    console.error('confirmarCita function not found on window object.');
                }
            } else if (clickedButton.classList.contains('btn-cancelar')) {
                if (window.cancelarCita) {
                    window.cancelarCita(citaId, citaElement);
                } else {
                    console.error('cancelarCita function not found on window object.');
                }
            }
        });
    } else {
        console.error("Appointment list container '.appointments-list' not found at DOMContentLoaded. This might be an issue if it's dynamically added later without re-attaching listeners or if the selector is incorrect.");
    }

    // Cargar el dashboard inicialmente
    cargarDashboard()

    // Verificar si el modal existe, si no, agregarlo dinámicamente
    if (!document.getElementById('modalRegistrarPaciente')) {
        const modalHTML = `
        <div id="modalRegistrarPaciente" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.4); z-index:2000; align-items:center; justify-content:center;">
          <div style="background:#fff; border-radius:16px; max-width:400px; width:90%; padding:2rem; position:relative; box-shadow:0 8px 32px rgba(0,0,0,0.18);">
            <button id="cerrarModalRegistrar" style="position:absolute; top:12px; right:12px; background:none; border:none; font-size:1.7rem; color:#888; cursor:pointer;">&times;</button>
            <h2 style="color:#2196F3; margin-bottom:1.2rem; font-size:1.3rem;">Registrar paciente en horario extra</h2>
            <div id="infoHorarioExtra" style="margin-bottom:1rem; color:#1976D2; font-weight:500;"></div>
            <form id="formRegistrarPaciente" autocomplete="off">
              <div class="form-group">
                <label>Nombre del paciente</label>
                <input type="text" id="nombrePaciente" required style="width:100%;padding:10px;border-radius:6px;border:1.5px solid #e0e0e0;margin-bottom:1rem;">
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="telefonoPaciente" required style="width:100%;padding:10px;border-radius:6px;border:1.5px solid #e0e0e0;margin-bottom:1rem;">
              </div>
              <div class="form-group">
                <label>Correo</label>
                <input type="email" id="emailPaciente" required style="width:100%;padding:10px;border-radius:6px;border:1.5px solid #e0e0e0;margin-bottom:1.5rem;">
              </div>
              <button type="submit" style="width:100%;background:#2196F3;color:#fff;padding:12px 0;border:none;border-radius:8px;font-weight:600;font-size:1.1rem;cursor:pointer;transition:background 0.2s;">Registrar</button>
            </form>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
})

// Funciones globales para manejar citas
async function confirmarCita(citaId, nombrePaciente, emailPaciente, fechaCita, horaCita, confirmarButtonElement) {
    const originalButtonText = confirmarButtonElement.innerHTML;
    const citaElement = confirmarButtonElement.closest('.cita');
    const cancelarButtonElement = citaElement.querySelector('.btn-cancelar');
    const statusBadge = citaElement.querySelector('.status-badge');

    confirmarButtonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirmando...';
    confirmarButtonElement.disabled = true;
    if (cancelarButtonElement) {
        cancelarButtonElement.disabled = true;
    }

    try {
        // 1. Update Supabase
        const { error: supabaseError } = await supabase
            .from('citas')
            .update({ estado: 'confirmada' })
            .eq('id', citaId);

        if (supabaseError) {
            // Construct a more informative error message for Supabase errors
            throw new Error(`Error de Supabase al actualizar la cita: ${supabaseError.message} (Código: ${supabaseError.code})`);
        }

        // 2. Send Email
        try {
            const templateParams = {
                email: emailPaciente,
                nombre: nombrePaciente,
                fecha: fechaCita,
                hora: horaCita
            };
            
            console.log('Enviando correo con parámetros:', templateParams);
            
            await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams);
        } catch (emailError) {
            console.error('Error al enviar el correo de confirmación:', emailError);
            alert('Cita confirmada en la base de datos, pero falló el envío del correo de confirmación. Por favor, notifique al paciente manualmente.');
            // Continue to update UI as confirmed, as DB was successful
        }

        // 3. Update UI to 'Confirmada'
        if (statusBadge) {
            statusBadge.textContent = 'confirmada';
            statusBadge.className = 'status-badge status-confirmada';
        }
        confirmarButtonElement.innerHTML = '<i class="fas fa-check"></i> Confirmada';
        // confirmarButtonElement is already disabled.
        if (cancelarButtonElement) {
            cancelarButtonElement.style.display = 'none'; // Hide cancel button
        }

    } catch (error) {
        console.error('Error al confirmar la cita:', error.message);
        // More specific alert based on where the error originated
        if (error.message.includes('Supabase')) {
            alert(`Error al actualizar la cita en la base de datos: ${error.message}`);
        } else {
            alert(`Error inesperado al confirmar la cita: ${error.message}`);
        }
        

        // Revert button state only if it wasn't changed to "Confirmada"
        // This check ensures that if email sending fails *after* DB success, buttons remain in "Confirmada" state.
        if (confirmarButtonElement.innerHTML.includes('Confirmando...')) {
             confirmarButtonElement.innerHTML = originalButtonText;
             confirmarButtonElement.disabled = false;
             if (cancelarButtonElement) {
                 cancelarButtonElement.disabled = false;
             }
        }
    }
}
window.confirmarCita = confirmarCita; // Ensure it's globally accessible

// Función para enviar correo de cancelación
async function enviarCorreoCancelacion(cita) {
    try {
        const templateParams = {
            nombre: cita.nombre,
            fecha: cita.fecha,
            hora: cita.hora,
            email: cita.email
        };

        await emailjs.send('default_service', 'template_36ity4i', templateParams);
        console.log('Correo de cancelación enviado exitosamente');
    } catch (error) {
        console.warn('Error al enviar correo de cancelación:', error);
    }
}

async function cancelarCita(citaId, citaElement) {
    try {
        // Obtener los datos de la cita antes de eliminarla
        const { data: cita, error: errorConsulta } = await supabase
            .from('citas')
            .select('*')
            .eq('id', citaId)
            .single();

        if (errorConsulta) throw errorConsulta;

        // Eliminar la cita
        const { error: errorEliminacion } = await supabase
            .from('citas')
            .delete()
            .eq('id', citaId);

        if (errorEliminacion) throw errorEliminacion;

        // Si la eliminación fue exitosa, enviar el correo
        await enviarCorreoCancelacion(cita);

        // Actualizar la UI
        citaElement.remove();
        mostrarNotificacion('Cita cancelada exitosamente', 'success');
        
        // Actualizar el dashboard si está visible
        if (document.getElementById('dashboard').classList.contains('active')) {
            cargarDashboard();
        }
    } catch (error) {
        console.error('Error al cancelar la cita:', error);
        mostrarNotificacion('Error al cancelar la cita', 'error');
    }
}

// Helper para convertir a formato 24 horas si fuera necesario
function convertirAFormato24Horas(hora12) {
    const date = new Date('1970-01-01T' + hora12);
    return date.toTimeString().slice(0, 8); // HH:MM:SS
}

// Función para mostrar el modal de modificación
function mostrarModalModificacion(cita) {
    // Eliminar el modal anterior si existe
    let modal = document.getElementById('modal-modificar-cita');
    if (modal) {
        modal.remove();
    }

    // Crear el modal
    modal = document.createElement('div');
    modal.id = 'modal-modificar-cita';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-edit"></i> Modificar Cita</h3>
                <button class="btn-cerrar" type="button">&times;</button>
            </div>
            <div class="modal-body">
                <form id="form-modificar-cita">
                    <div class="form-group">
                        <label for="nueva-fecha">
                            <i class="fas fa-calendar"></i> Fecha:
                        </label>
                        <input type="date" id="nueva-fecha" required>
                    </div>
                    <div class="form-group">
                        <label for="nueva-hora">
                            <i class="fas fa-clock"></i> Hora:
                        </label>
                        <select id="nueva-hora" required>
                            <option value="17:30">17:30</option>
                            <option value="18:00">18:00</option>
                            <option value="18:30">18:30</option>
                            <option value="19:00">19:00</option>
                            <option value="19:30">19:30</option>
                            <option value="20:00">20:00</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-guardar">
                            <i class="fas fa-save"></i> Guardar cambios
                        </button>
                        <button type="button" class="btn-cancelar">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Prellenar el formulario con los datos actuales
    document.getElementById('nueva-fecha').value = cita.fecha;
    const selectHora = document.getElementById('nueva-hora');
    const horaActual = cita.hora.slice(0,5); // Asegura formato HH:MM
    const horasValidas = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
    if (horasValidas.includes(horaActual)) {
        selectHora.value = horaActual;
    } else {
        const horaIndex = horasValidas.findIndex(h => h > horaActual);
        selectHora.value = horaIndex >= 0 ? horasValidas[horaIndex] : horasValidas[0];
    }

    // Mostrar el modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Cerrar modal
    function cerrar() {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
        }, 300);
    }
    modal.querySelector('.btn-cerrar').onclick = cerrar;
    modal.querySelector('.btn-cancelar').onclick = cerrar;
    modal.onclick = function(e) {
        if (e.target === modal) cerrar();
    };
    document.addEventListener('keydown', function escListener(e) {
        if (e.key === 'Escape') {
            cerrar();
            document.removeEventListener('keydown', escListener);
        }
    });

    // Submit
    modal.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevaFecha = document.getElementById('nueva-fecha').value;
        const nuevaHora = document.getElementById('nueva-hora').value;
        try {
            // Verificar disponibilidad
            const { data: citasExistentes, error: errorConsulta } = await supabase
                .from('citas')
                .select('id')
                .eq('fecha', nuevaFecha)
                .eq('hora', nuevaHora)
                .neq('id', cita.id)
                .in('estado', ['pendiente', 'confirmada']);
            if (errorConsulta) throw errorConsulta;
            if (citasExistentes && citasExistentes.length > 0) {
                mostrarNotificacion('Este horario ya está ocupado. Por favor, seleccione otro.', 'error');
                return;
            }
            // Actualizar la cita
            const { error: errorActualizacion } = await supabase
                .from('citas')
                .update({
                    fecha: nuevaFecha,
                    hora: nuevaHora
                })
                .eq('id', cita.id);
            if (errorActualizacion) throw errorActualizacion;
            // Actualizar la UI
            const citaElement = document.querySelector(`.cita[data-id="${cita.id}"]`);
            if (citaElement) {
                citaElement.dataset.fecha = nuevaFecha;
                citaElement.dataset.hora = nuevaHora;
                citaElement.querySelector('div:first-child').innerHTML = `
                    <strong>${cita.nombre}</strong><br>
                    ${nuevaFecha} - ${nuevaHora}<br>
                    <small>${cita.email} | ${cita.telefono}</small>
                `;
            }
            cerrar();
            mostrarNotificacion('Cita modificada exitosamente', 'success');
            if (document.getElementById('dashboard').classList.contains('active')) {
                cargarDashboard();
            }
        } catch (error) {
            console.error('Error al modificar la cita:', error);
            mostrarNotificacion('Error al modificar la cita', 'error');
        }
    });
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notificacion);

    // Agregar estilos a la notificación si no existen
    if (!document.getElementById('estilos-notificacion')) {
        const style = document.createElement('style');
        style.id = 'estilos-notificacion';
        style.textContent = `
            .notificacion {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 4px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            .notificacion.success {
                background-color: #4CAF50;
            }
            .notificacion.error {
                background-color: #f44336;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// =================== MODAL Y REGISTRO DE PACIENTE EN HORARIO EXTRA ===================

// Mostrar el modal y rellenar info
function abrirModalRegistrarPaciente(horarioData) {
    const modal = document.getElementById('modalRegistrarPaciente');
    if (!modal) {
        console.error('Error: Modal #modalRegistrarPaciente no encontrado en el DOM');
        mostrarNotificacion('Error interno: Modal no encontrado', 'error');
        return;
    }

    horarioExtraSeleccionado = horarioData;
    const infoElement = document.getElementById('infoHorarioExtra');
    if (infoElement) {
      const fechaFormateada = new Date(horarioData.fecha + 'T00:00:00').toLocaleDateString('es-CL');
      infoElement.textContent = `Fecha: ${fechaFormateada} - Hora: ${horarioData.hora.substring(0, 5)}`;
    } else {
      console.error('Elemento #infoHorarioExtra no encontrado.');
    }

    const form = document.getElementById('formRegistrarPaciente');
    if (form) {
      form.reset();
    } else {
      console.error('Elemento #formRegistrarPaciente no encontrado.');
    }

    // Forzar estilos críticos con inline styles
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '10001'; // Usar un z-index muy alto

    // Mostrar el modal con display flex
    modal.style.display = 'flex';

    // Verificar estilos computados inmediatamente
    const computedStyle = window.getComputedStyle(modal);
    console.log('Estilos computados del modal (después de inline):', {
        display: computedStyle.display,
        justifyContent: computedStyle.justifyContent,
        alignItems: computedStyle.alignItems,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
        width: computedStyle.width,
        height: computedStyle.height
    });
    const modalContent = modal.querySelector('.modal-content');
    if(modalContent) {
        const contentComputedStyle = window.getComputedStyle(modalContent);
         console.log('Estilos computados del modal-content (después de inline):', {
            maxHeight: contentComputedStyle.maxHeight,
            overflowY: contentComputedStyle.overflowY,
            marginTop: contentComputedStyle.marginTop,
            marginBottom: contentComputedStyle.marginBottom,
            position: contentComputedStyle.position
         });
    }

    // La animación de aparición se maneja con la clase show
    setTimeout(() => {
        modal.classList.add('show');

        // Verificar estilos computados después de añadir la clase show
        const computedStyleAfterShow = window.getComputedStyle(modal);
         console.log('Estilos computados del modal (después de añadir show):', {
            opacity: computedStyleAfterShow.opacity,
            display: computedStyleAfterShow.display, // Re-verificar display
             zIndex: computedStyleAfterShow.zIndex // Re-verificar z-index
         });
         const modalContentAfterShow = modal.querySelector('.modal-content');
         if(modalContentAfterShow) {
             const contentComputedStyleAfterShow = window.getComputedStyle(modalContentAfterShow);
              console.log('Estilos computados del modal-content (después de añadir show):', {
                 transform: contentComputedStyleAfterShow.transform
              });
         }

    }, 10);
}

// Cerrar modal
function cerrarModalRegistrar() {
    document.getElementById('modalRegistrarPaciente').style.display = 'none';
    horarioExtraSeleccionado = null;
}

// Asegura que los elementos existen antes de agregar listeners
document.addEventListener('DOMContentLoaded', function() {
    const cerrarBtn = document.getElementById('cerrarModalRegistrar');
    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', cerrarModalRegistrar);
    }
    const modal = document.getElementById('modalRegistrarPaciente');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalRegistrar();
            }
        });
    }
    const form = document.getElementById('formRegistrarPaciente');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!horarioExtraSeleccionado) {
                mostrarNotificacion('Error: No hay horario seleccionado', 'error');
                return;
            }
            const nombre = document.getElementById('nombrePaciente').value.trim();
            const email = document.getElementById('emailPaciente').value.trim();
            const telefono = document.getElementById('telefonoPaciente').value.trim();
            if (!nombre || !email || !telefono) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }
            if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
                mostrarNotificacion('Por favor ingrese un email válido', 'error');
                return;
            }
            try {
                // Verificar que no exista una cita en la misma fecha y hora
                const { data: citasExistentes, error: errorVerificacion } = await supabase
                    .from('citas')
                    .select('id')
                    .eq('fecha', horarioExtraSeleccionado.fecha)
                    .eq('hora', horarioExtraSeleccionado.hora)
                    .in('estado', ['pendiente', 'confirmada']);
                if (errorVerificacion) throw errorVerificacion;
                if (citasExistentes && citasExistentes.length > 0) {
                    mostrarNotificacion('Ya existe una cita registrada en este horario', 'error');
                    return;
                }
                // Insertar nueva cita
                const { error } = await supabase
                    .from('citas')
                    .insert([{
                        nombre: nombre,
                        email: email,
                        telefono: telefono,
                        fecha: horarioExtraSeleccionado.fecha,
                        hora: horarioExtraSeleccionado.hora,
                        estado: 'confirmada'
                    }]);
                if (error) throw error;
                // Eliminar el horario extra
                await supabase
                    .from('horarios_disponibles')
                    .delete()
                    .eq('id', horarioExtraSeleccionado.id);
                mostrarNotificacion('Paciente registrado exitosamente', 'success');
                cerrarModalRegistrar();
                // Actualizar el calendario
                if (typeof calendar !== 'undefined' && calendar.refetchEvents) {
                    calendar.refetchEvents();
                }
            } catch (error) {
                console.error('Error registrando paciente:', error);
                mostrarNotificacion('Error al registrar el paciente: ' + error.message, 'error');
            }
        });
    }
});

// =================== FIN MODAL Y REGISTRO DE PACIENTE EN HORARIO EXTRA ===================

// Función de notificación simple (ajusta si ya tienes una)
function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 6px;
        color: white; font-weight: 500; z-index: 10000; max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        ${tipo === 'success' ? 'background-color: #27ae60;' : 'background-color: #e74c3c;'}
    `;
    document.body.appendChild(notificacion);
    setTimeout(() => { if (notificacion.parentNode) notificacion.parentNode.removeChild(notificacion); }, 4000);
}

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarModalRegistrar();
    }
});

// Cerrar modal al hacer click fuera
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modalRegistrarPaciente');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalRegistrar();
            }
        });
    }
});