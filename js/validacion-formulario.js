document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-citas');
    const nombreInput = document.getElementById('nombre-paciente');
    const telefonoInput = document.getElementById('telefono-paciente');
    const emailInput = document.getElementById('email-paciente');

    // Validación en tiempo real y al salir del campo
    nombreInput.addEventListener('input', validarNombre);
    nombreInput.addEventListener('blur', validarNombre);
    telefonoInput.addEventListener('input', validarTelefono);
    telefonoInput.addEventListener('blur', validarTelefono);
    emailInput.addEventListener('input', validarEmail);
    emailInput.addEventListener('blur', validarEmail);

    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        limpiarMensajesError();
        const nombreValido = validarNombre();
        const telefonoValido = validarTelefono();
        const emailValido = validarEmail();
        if (nombreValido && telefonoValido && emailValido) {
            enviarFormulario();
        }
    });

    function validarNombre() {
        const nombre = nombreInput.value.trim();
        const errorNombre = document.getElementById('error-nombre');
        errorNombre.textContent = '';
        if (nombre === '') {
            errorNombre.textContent = 'Este campo es obligatorio';
            return false;
        }
        const palabras = nombre.split(/\s+/);
        if (palabras.length < 2) {
            errorNombre.textContent = 'Debe ingresar nombre y apellido';
            return false;
        }
        const regex = /^[A-Za-zÁ-Úá-ú\s\-]+$/;
        if (!regex.test(nombre)) {
            errorNombre.textContent = 'Solo se permiten letras, espacios y guiones';
            return false;
        }
        return true;
    }

    function validarTelefono() {
        const telefono = telefonoInput.value.trim();
        const errorTelefono = document.getElementById('error-telefono');
        errorTelefono.textContent = '';
        if (telefono === '') {
            errorTelefono.textContent = 'Este campo es obligatorio';
            return false;
        }
        if (/[^0-9]/.test(telefono)) {
            errorTelefono.textContent = 'Solo se permiten números';
            return false;
        }
        if (telefono.length < 8 || telefono.length > 12) {
            errorTelefono.textContent = 'El teléfono debe contener entre 8 y 12 dígitos';
            return false;
        }
        return true;
    }

    function validarEmail() {
        const email = emailInput.value.trim();
        const errorEmail = document.getElementById('error-email');
        errorEmail.textContent = '';
        if (email === '') {
            errorEmail.textContent = 'Este campo es obligatorio';
            return false;
        }
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(email)) {
            errorEmail.textContent = 'Ingrese un correo electrónico válido';
            return false;
        }
        return true;
    }

    function limpiarMensajesError() {
        const mensajesError = document.querySelectorAll('.mensaje-error');
        mensajesError.forEach(mensaje => {
            mensaje.textContent = '';
        });
    }

    function enviarFormulario() {
        console.log('Formulario válido, enviando datos...');
        mostrarToastExito();
    }

    function mostrarToastExito() {
        const toast = document.getElementById('toast-exito');
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}); 