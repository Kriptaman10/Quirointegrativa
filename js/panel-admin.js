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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar horarios al iniciar
    cargarHorariosExtra();
    
    // Agregar listener al formulario
    document.getElementById('formulario-horario-extra')
        .addEventListener('submit', agregarHorarioExtra);
}); 