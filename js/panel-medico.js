// Configuración de Supabase
const supabaseUrl = 'https://ivneinajrywdljevjgjx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmVpbmFqcnl3ZGxqZXZqZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0ODA5NDIsImV4cCI6MjA2MTA1Njk0Mn0.ySUivP0cdQ8_c1y7BE7uxEH_F3fKawxtuyi0IiMfLwQ'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
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
                ? `<ul class="appointment-list">
                    ${citas.map(cita => `
                        <li class="appointment-item" data-id="${cita.id}">
                            <div>
                                <strong>${cita.nombre}</strong><br>
                                ${cita.fecha} - ${cita.hora}<br>
                                <small>${cita.email} | ${cita.telefono}</small>
                            </div>
                            <div class="appointment-actions">
                                <span class="status-badge status-${cita.estado}">${cita.estado}</span>
                                ${cita.estado === 'pendiente' ? `
                                    <button class="btn-action btn-confirm" onclick="confirmarCita('${cita.id}')">
                                        <i class="fas fa-check"></i> Confirmar
                                    </button>
                                    <button class="btn-action btn-cancel" onclick="cancelarCita('${cita.id}')">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                ` : ''}
                            </div>
                        </li>
                    `).join('')}
                </ul>`
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
                        const { data, error } = await supabase
                            .from('horarios_disponibles')
                            .insert([{
                                fecha: info.start.toISOString().split('T')[0],
                                hora: info.start.toLocaleTimeString(),
                                estado: 'disponible'
                            }])
                            .select()

                        if (error) throw error

                        calendar.addEvent({
                            title: 'Disponible',
                            start: info.start,
                            end: info.end,
                            backgroundColor: '#4CAF50'
                        })
                    } catch (error) {
                        console.error('Error al guardar horario:', error)
                        alert('Error al guardar el horario')
                    }
                }
                calendar.unselect()
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

    // Cargar el dashboard inicialmente
    cargarDashboard()
})

// Funciones globales para manejar citas
async function confirmarCita(citaId) {
    try {
        const { data, error } = await supabase
            .from('citas')
            .update({ estado: 'confirmada' })
            .eq('id', citaId)
            .select()

        if (error) throw error

        // Recargar la lista de citas
        cargarCitas()
    } catch (error) {
        console.error('Error al confirmar la cita:', error)
        alert('Error al confirmar la cita')
    }
}

async function cancelarCita(citaId) {
    try {
        const { data, error } = await supabase
            .from('citas')
            .update({ estado: 'cancelada' })
            .eq('id', citaId)
            .select()

        if (error) throw error

        // Recargar la lista de citas
        cargarCitas()
    } catch (error) {
        console.error('Error al cancelar la cita:', error)
        alert('Error al cancelar la cita')
    }
} 