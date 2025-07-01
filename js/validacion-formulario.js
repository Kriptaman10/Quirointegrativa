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
    rutInput.addEventListener('blur', validarRut);
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
        let rut = rutInput.value.toUpperCase();
        const errorRut = document.getElementById('error-rut');
        errorRut.textContent = '';

        // Permitir solo números, un guion y un dígito verificador (número o K)
        rut = rut.replace(/[^0-9K\-]/g, '');

        // Limitar a un solo guion
        const partes = rut.split('-');
        if (partes.length > 2) {
            rut = partes[0] + '-' + partes[1];
        }

        // Limitar la parte numérica a 8 dígitos
        if (partes[0].length > 8) {
            partes[0] = partes[0].slice(0, 8);
        }

        // Limitar el dígito verificador a 1 carácter (si hay guion)
        if (partes.length === 2) {
            partes[1] = partes[1].slice(0, 1);
            rut = partes[0] + '-' + partes[1];
        } else {
            rut = partes[0];
        }

        // Actualizar el valor del input (sin mover el cursor)
        const selectionStart = rutInput.selectionStart;
        rutInput.value = rut;
        rutInput.setSelectionRange(selectionStart, selectionStart);

        // Validar formato básico
        const formatoRut = /^[0-9]{7,8}-[0-9K]$/;
        if (!formatoRut.test(rut)) {
            errorRut.textContent = 'Formato: 12345678-9 o 12345678-K';
            return false;
        }

        // Separar número y dígito verificador
        const [numeroRut, digitoVerificador] = rut.split('-');
        if (!numeroRut || !digitoVerificador) {
            errorRut.textContent = 'Debe ingresar el dígito verificador';
            return false;
        }

        // Calcular dígito verificador
        const digitoCalculado = calcularDigitoVerificador(numeroRut);
        if (digitoVerificador !== digitoCalculado) {
            errorRut.textContent = 'El dígito verificador no es válido';
            return false;
        }

        return true;
    }

    // Función auxiliar para calcular el dígito verificador chileno
    function calcularDigitoVerificador(numero) {
        let suma = 0;
        let multiplicador = 2;
        
        // Recorrer el número de derecha a izquierda
        for (let i = numero.length - 1; i >= 0; i--) {
            suma += parseInt(numero.charAt(i)) * multiplicador;
            multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
        }
        
        const resto = suma % 11;
        const dv = 11 - resto;
        
        if (dv === 11) return '0';
        if (dv === 10) return 'K';
        return dv.toString();
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