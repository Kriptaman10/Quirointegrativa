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