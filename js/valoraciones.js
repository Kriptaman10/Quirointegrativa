let valoracionSeleccionada = 0;

function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    // Agregar ícono según el tipo de mensaje
    const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `
        <i class="fas ${icono}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('mostrar');
        setTimeout(() => {
            toast.classList.remove('mostrar');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }, 100);
}

function actualizarEstrellas(valor, esHover = false) {
    const estrellas = document.querySelectorAll('.estrella');
    estrellas.forEach(estrella => {
        const valorEstrella = parseInt(estrella.dataset.valor);
        if (valorEstrella <= valor) {
            estrella.style.color = '#ffd700';
        } else {
            estrella.style.color = '#ccc';
        }
    });
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const formulario = event.target;
    const submitBtn = formulario.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    const nombre = formulario.querySelector('#nombre').value.trim();
    const email = formulario.querySelector('#email').value.trim();
    const comentario = formulario.querySelector('#comentario').value.trim();
    
    if (!nombre || !email || !comentario || valoracionSeleccionada === 0) {
        mostrarToast('Por favor complete todos los campos y seleccione una valoración', 'error');
        submitBtn.disabled = false;
        return;
    }
    
    try {
        // Verificar que Supabase está disponible
        if (!window.supabase) {
            throw new Error('Error de conexión con el servidor');
        }

        const { data, error } = await window.supabase
            .from('valoraciones')
            .insert([{
                nombre,
                email,
                comentario,
                estrellas: valoracionSeleccionada,
                fecha_creacion: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error de Supabase:', error);
            throw new Error('Error al guardar la valoración');
        }
        
        mostrarToast('¡Gracias por tu valoración!', 'success');
        formulario.reset();
        valoracionSeleccionada = 0;
        actualizarEstrellas(0);
    } catch (error) {
        console.error('Error al guardar la valoración:', error);
        mostrarToast(error.message || 'Error al guardar la valoración. Por favor, intente nuevamente.', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.querySelector('#form-valoracion');
    if (!formulario) {
        console.error('No se encontró el formulario de valoración');
        return;
    }

    formulario.addEventListener('submit', handleSubmit);
    
    const estrellas = document.querySelectorAll('.estrella');
    if (estrellas.length === 0) {
        console.error('No se encontraron elementos de estrellas');
        return;
    }
    
    // Eventos para cada estrella individual
    estrellas.forEach(estrella => {
        estrella.addEventListener('mouseover', function() {
            const valor = parseInt(this.dataset.valor);
            actualizarEstrellas(valor, true);
        });
        
        estrella.addEventListener('click', function() {
            valoracionSeleccionada = parseInt(this.dataset.valor);
            actualizarEstrellas(valoracionSeleccionada);
        });
    });
    
    // Evento mouseout para el contenedor de estrellas
    const contenedorEstrellas = document.querySelector('.estrellas-container');
    if (contenedorEstrellas) {
        contenedorEstrellas.addEventListener('mouseout', () => {
            actualizarEstrellas(valoracionSeleccionada);
        });
    }
}); 