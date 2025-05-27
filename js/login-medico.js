// Configuración de credenciales fijas
const usuarioFijo = 'sergio henriquez';
const passwordFijo = 'quirointegrativa2025';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const toastContainer = document.getElementById('toast-container');

    if (!loginForm) {
        console.warn('No se encontró el formulario de login (.login-form) en esta página.');
        return;
    }
    if (!toastContainer) {
        console.warn('No se encontró el contenedor de toast (#toast-container) en esta página.');
    }

    // Función para mostrar mensajes
    function mostrarMensaje(mensaje, tipo = 'error') {
        if (!toastContainer) {
            alert(mensaje);
            return;
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.innerHTML = `
            <i class=\"fas ${tipo === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}\"></i>
            <span>${mensaje}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('mostrar');
            setTimeout(() => {
                toast.classList.remove('mostrar');
                setTimeout(() => toastContainer.removeChild(toast), 300);
            }, 3000);
        }, 100);
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Tomar los valores escritos por el usuario
        const usuario = document.getElementById('medic_id').value.trim();
        const password = document.getElementById('medic_pass').value;

        if (usuario === usuarioFijo && password === passwordFijo) {
            localStorage.setItem('medicoLogueado', 'true');
            localStorage.setItem('nombreMedico', usuario);
            window.location.href = 'panel-medico.html';
        } else {
            mostrarMensaje('Usuario o contraseña incorrectos');
        }
    });
}); 