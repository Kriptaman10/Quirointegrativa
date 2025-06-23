document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.getElementById('formulario-citas');
    const nombreInput = document.getElementById('nombre-paciente');
    const telefonoInput = document.getElementById('telefono-paciente');
    const emailInput = document.getElementById('email-paciente');
    const rutInput = document.getElementById('rut-paciente');
    const fechaNacimientoInput = document.getElementById('fecha-nacimiento');

    // Validación en tiempo real y al salir del campo
    nombreInput.addEventListener('input', validarNombre);
    nombreInput.addEventListener('blur', validarNombre);
    telefonoInput.addEventListener('input', validarTelefono);
    telefonoInput.addEventListener('blur', validarTelefono);
    emailInput.addEventListener('input', validarEmail);
    emailInput.addEventListener('blur', validarEmail);
    rutInput.addEventListener('input', validarRut);
    rutInput.addEventListener('blur', validarFechaNacimiento);
    fechaNacimientoInput.addEventListener('input', validarFechaNacimiento);
    fechaNacimientoInput.addEventListener('blur', validarFechaNacimiento);

    formulario.addEventListener('submit', function(event) {
        event.preventDefault();
        limpiarMensajesError();
        const nombreValido = validarNombre();
        const telefonoValido = validarTelefono();
        const emailValido = validarEmail();
        const rutValido = validarRut();
        const fechaNacimientoValido = validarFechaNacimiento();

        if (nombreValido && telefonoValido && emailValido && rutValido && fechaNacimientoValido) {
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

    function validarRut() {
        const rutInput = document.getElementById('rut-paciente');
        const rut = rutInput.value.trim();
        const errorRut = document.getElementById('error-rut');
        errorRut.textContent = '';

        if (rut === '') {
            errorRut.textContent = 'Este campo es obligatorio';
            return false;
        }

        const regex = /^[0-9]{1,8}-[0-9Kk]{1}$/;
        if (!regex.test(rut)) {
            errorRut.textContent = 'Ingrese un RUT válido, con formato: 12345678-9';
            return false;
        }

        const rutLength = rut.replace('-', '').length;
        if (rutLength < 8 || rutLength > 10) {
            errorRut.textContent = 'El RUT debe contener entre 8 y 10 dígitos';
            return false;
        }

        return true;
    }

    function validarFechaNacimiento() {
        const fechaNacimientoInput = document.getElementById('fecha-nacimiento');
        const fechaNacimiento = fechaNacimientoInput.value.trim();
        const errorFechaNacimiento = document.getElementById('error-fecha-nacimiento');
        errorFechaNacimiento.textContent = '';

        if (fechaNacimiento === '') {
            errorFechaNacimiento.textContent = 'Este campo es obligatorio';
            return false;
        }

        const hoy = new Date();
        const fechaSeleccionada = new Date(fechaNacimiento);

        if (fechaSeleccionada > hoy) {
            errorFechaNacimiento.textContent = 'La fecha seleccionada no es válida';
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