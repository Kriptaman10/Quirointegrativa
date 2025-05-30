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

    // Configurar nombre del médico
    const nombreMedico = localStorage.getItem('nombreMedico')
    document.getElementById('nombre-medico').textContent = nombreMedico
    document.getElementById('welcome-name').textContent = nombreMedico.split(' ')[0]

    // Manejar cierre de sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('medicoLogueado')
        localStorage.removeItem('nombreMedico')
        window.location.href = 'login-medico.html'
    })

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
                        <div class="cita" data-id="${cita.id}" data-nombre="${cita.nombre}" data-email="${cita.email}" data-fecha="${cita.fecha}" data-hora="${cita.hora}">
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
        const calendarEl = document.getElementById('calendar')
        const calendar = new FullCalendar.Calendar(calendarEl, {
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
            select: async function(info) {
                const confirmacion = confirm(`¿Desea marcar este horario como disponible?\nFecha: ${info.startStr}\nHora: ${info.start.toLocaleTimeString()}`)
                if (confirmacion) {
                    try {
                        // Obtener hora en formato 24 horas HH:MM:SS
                        let hora = '';
                        if (info.start instanceof Date) {
                            hora = info.start.toTimeString().slice(0, 8);
                        } else {
                            hora = convertirAFormato24Horas(info.start.toLocaleTimeString());
                        }
                        if (!/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
                            alert('Formato de hora inválido. Intente nuevamente.');
                            return;
                        }
                        const horarioNuevo = {
                            fecha: info.start.toISOString().split('T')[0],
                            hora: hora,
                            estado: 'disponible',
                            tipo: 'extra'
                        };
                        const { data, error } = await supabase
                            .from('horarios_disponibles')
                            .insert([horarioNuevo])
                            .select();

                        if (error) throw error;

                        calendar.addEvent({
                            title: 'Horario Extra',
                            start: info.start,
                            end: info.end,
                            backgroundColor: '#4fc3f7'
                        });
                        alert('Horario extra guardado exitosamente.');
                    } catch (error) {
                        console.error('Error al guardar horario:', error);
                        alert('Error al guardar el horario: ' + (error.message || 'Error desconocido.'));
                    }
                }
                calendar.unselect();
            },
            eventClick: function(info) {
                if (confirm('¿Desea eliminar este horario disponible?')) {
                    info.event.remove()
                }
            }
        })

        calendar.render()
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
                        <div class="review-item">
                            <div class="review-header">
                                <div class="review-user">
                                    <div class="review-avatar">${iniciales}</div>
                                    <div class="review-info">
                                        <h3>${valoracion.nombre}</h3>
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

            // Recargar las valoraciones
            cargarValoraciones()
        } catch (error) {
            console.error('Error al aprobar la valoración:', error)
        }
    }

    // Función para rechazar una valoración
    async function rechazarValoracion(id) {
        try {
            const { error } = await supabase
                .from('valoraciones')
                .update({ estado: 'rechazado' })
                .eq('id', id)

            if (error) throw error

            // Recargar las valoraciones
            cargarValoraciones()
        } catch (error) {
            console.error('Error al rechazar la valoración:', error)
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
                    hora: horaCita
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
    // Crear el modal si no existe
    let modal = document.getElementById('modal-modificar-cita');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-modificar-cita';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-edit"></i> Modificar Cita</h3>
                    <button class="btn-cerrar">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="form-modificar-cita">
                        <div class="form-group">
                            <label for="nueva-fecha">
                                <i class="fas fa-calendar"></i> Fecha:
                            </label>
                            <input type="date" id="nueva-fecha" required>
                        </div>
                        <div class="form-group" style="position:relative;">
                            <label for="nueva-hora">
                                <i class="fas fa-clock"></i> Hora:
                            </label>
                            <span class="icon-select"><i class="fas fa-clock"></i></span>
                            <select id="nueva-hora" required>
                                <option value="17:30">17:30</option>
                                <option value="18:00">18:00</option>
                                <option value="18:30">18:30</option>
                                <option value="19:00">19:00</option>
                                <option value="19:30">19:30</option>
                                <option value="20:00">20:00</option>
                            </select>
                            <span class="arrow-select"><i class="fas fa-chevron-down"></i></span>
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

        // Agregar estilos al modal
        const style = document.createElement('style');
        style.textContent = `
            .btn-modificar {
                background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
            }
            .btn-modificar:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
                background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
            }
            .btn-modificar:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
            }
            .btn-modificar i {
                font-size: 0.9em;
            }

            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal.show {
                opacity: 1;
            }
            .modal-content {
                position: relative;
                background-color: #fff;
                margin: 10% auto;
                padding: 25px;
                width: 90%;
                max-width: 500px;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                transform: translateY(-20px);
                transition: transform 0.3s ease;
            }
            .modal.show .modal-content {
                transform: translateY(0);
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #f0f0f0;
            }
            .modal-header h3 {
                color: #2196F3;
                font-size: 1.4rem;
                display: flex;
                align-items: center;
                gap: 10px;
                margin: 0;
            }
            .modal-header h3 i {
                color: #2196F3;
            }
            .btn-cerrar {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #666;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            .btn-cerrar:hover {
                background-color: #f0f0f0;
                color: #333;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }
            .form-group label i {
                color: #2196F3;
            }
            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            .form-group input:focus {
                border-color: #2196F3;
                box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
                outline: none;
            }
            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 25px;
            }
            .btn-guardar, .btn-cancelar {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                font-size: 1rem;
            }
            .btn-guardar {
                background-color: #2196F3;
                color: white;
                box-shadow: 0 2px 4px rgba(33, 150, 243, 0.2);
            }
            .btn-guardar:hover {
                background-color: #1976D2;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
            }
            .btn-cancelar {
                background-color: #f5f5f5;
                color: #666;
            }
            .btn-cancelar:hover {
                background-color: #e0e0e0;
                color: #333;
            }
            @media (max-width: 600px) {
                .modal-content {
                    margin: 5% auto;
                    padding: 20px;
                }
                .form-actions {
                    flex-direction: column;
                }
                .btn-guardar, .btn-cancelar {
                    width: 100%;
                    justify-content: center;
                }
            }
            .form-group select {
                width: 100%;
                padding: 14px 44px 14px 44px;
                border: 2px solid #2196F3;
                border-radius: 10px;
                font-size: 1.15rem;
                background: #f7fbff;
                color: #1976D2;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(33,150,243,0.08);
                transition: border 0.2s, box-shadow 0.2s, background 0.2s;
                appearance: none;
                outline: none;
                cursor: pointer;
                position: relative;
            }
            .form-group select:focus, .form-group select:hover {
                border-color: #1565c0;
                background: #e3f2fd;
                box-shadow: 0 4px 16px rgba(33,150,243,0.13);
            }
            .form-group select option {
                padding: 16px 0;
                font-size: 1.1rem;
                color: #1976D2;
                background: #fff;
                border-bottom: 1px solid #e3f2fd;
            }
            .form-group .icon-select {
                position: absolute;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                color: #2196F3;
                font-size: 1.3em;
                pointer-events: none;
            }
            .form-group .arrow-select {
                position: absolute;
                right: 18px;
                top: 50%;
                transform: translateY(-50%);
                color: #2196F3;
                font-size: 1.2em;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        // Agregar eventos al modal
        modal.querySelector('.btn-cerrar').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });

        modal.querySelector('.btn-cancelar').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });

        // Prellenar el formulario con los datos actuales
        document.getElementById('nueva-fecha').value = cita.fecha;
        const selectHora = document.getElementById('nueva-hora');
        
        // Validar que la hora actual esté en el rango permitido
        const horaActual = cita.hora;
        const horasValidas = ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];
        
        if (horasValidas.includes(horaActual)) {
            selectHora.value = horaActual;
        } else {
            // Si la hora actual no es válida, seleccionar la más cercana
            const horaIndex = horasValidas.findIndex(h => h > horaActual);
            selectHora.value = horaIndex >= 0 ? horasValidas[horaIndex] : horasValidas[0];
        }

        // Mostrar el modal con animación
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

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

                // Cerrar el modal y mostrar notificación
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
                mostrarNotificacion('Cita modificada exitosamente', 'success');

                // Actualizar el dashboard si está visible
                if (document.getElementById('dashboard').classList.contains('active')) {
                    cargarDashboard();
                }
            } catch (error) {
                console.error('Error al modificar la cita:', error);
                mostrarNotificacion('Error al modificar la cita', 'error');
            }
        });
    }
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