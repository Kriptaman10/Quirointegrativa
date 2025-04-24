document.addEventListener('DOMContentLoaded', () => {
    const appointmentForm = document.querySelector('.appointment-form');
    
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Obtener los valores del formulario
            const formData = {
                nombre: document.getElementById('patient-name').value,
                telefono: document.getElementById('patient-phone').value,
                email: document.getElementById('patient-email').value,
                fecha: document.getElementById('date').value,
                hora: document.getElementById('time').value
            };

            try {
                const response = await fetch('http://localhost:3000/api/citas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Mostrar mensaje de éxito
                    alert('¡Cita agendada exitosamente!');
                    // Limpiar el formulario
                    appointmentForm.reset();
                } else {
                    throw new Error(data.error || 'Error al agendar la cita');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Hubo un error al agendar la cita. Por favor, intente nuevamente.');
            }
        });
    }
}); 