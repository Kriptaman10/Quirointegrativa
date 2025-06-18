# Quirointegrativa - Sistema de Agendamiento de Citas Médicas

## 📋 Descripción del Proyecto

Quirointegrativa es un sistema completo de agendamiento de citas médicas desarrollado para una clínica de medicina integrativa. El sistema permite a los pacientes reservar citas de manera fácil e intuitiva, mientras que los administradores y médicos pueden gestionar el calendario, las citas y los horarios disponibles.

### 🎯 Características Principales

- **Agendamiento de Citas**: Interfaz intuitiva para que los pacientes reserven citas
- **Panel de Administración**: Gestión completa de citas, horarios y pacientes
- **Panel Médico**: Vista especializada para médicos con funcionalidades específicas
- **Calendario Interactivo**: Visualización de horarios disponibles y citas programadas
- **Validaciones Robustas**: Prevención de citas duplicadas y validación de horarios
- **Notificaciones por Email**: Confirmaciones y cancelaciones automáticas
- **Sistema de Valoraciones**: Recopilación de feedback de pacientes
- **Responsive Design**: Interfaz adaptada para dispositivos móviles y desktop

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Estilos modernos con diseño responsive
- **JavaScript (ES6+)**: Funcionalidad interactiva y dinámica
- **FullCalendar**: Biblioteca para calendarios interactivos
- **Font Awesome**: Iconografía y elementos visuales

### Backend
- **Node.js**: Runtime de JavaScript para el servidor
- **Express.js**: Framework web para APIs REST
- **Supabase**: Base de datos PostgreSQL en la nube con autenticación
- **PostgreSQL**: Base de datos relacional robusta

### Servicios Externos
- **EmailJS**: Servicio para envío de emails automáticos
- **Supabase Auth**: Sistema de autenticación y autorización
- **Row Level Security (RLS)**: Seguridad a nivel de fila en la base de datos

### Herramientas de Desarrollo
- **Nodemon**: Reinicio automático del servidor durante desarrollo
- **Git**: Control de versiones
- **VS Code**: Editor de código con extensiones para desarrollo web

## 🏗️ Arquitectura del Sistema

### Estructura de Base de Datos
```
├── pacientes          # Información de pacientes
├── administradores    # Usuarios administradores
├── citas             # Citas programadas
├── horarios_disponibles # Horarios disponibles
├── notificaciones    # Sistema de notificaciones
└── valoraciones      # Feedback de pacientes
```

### Componentes del Sistema
- **Frontend Público**: Interfaz para agendamiento de citas
- **Panel de Admin**: Gestión administrativa completa
- **Panel Médico**: Vista especializada para médicos
- **API REST**: Endpoints para operaciones CRUD
- **Sistema de Notificaciones**: Emails automáticos

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta en Supabase
- Cuenta en EmailJS (opcional, para notificaciones)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd Quirointegrativa
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   SUPABASE_KEY=tu_clave_anonima_de_supabase
   EMAILJS_PUBLIC_KEY=tu_clave_publica_de_emailjs
   EMAILJS_SERVICE_ID=tu_service_id
   EMAILJS_TEMPLATE_ID=tu_template_id
   ```

4. **Configurar la base de datos**
   - Ejecutar `db_setup.sql` en tu instancia de Supabase
   - Configurar las políticas de Row Level Security (RLS)

5. **Iniciar el servidor**
   ```bash
   npm start
   # Para desarrollo con reinicio automático:
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
Quirointegrativa/
├── assets/              # Imágenes y recursos estáticos
├── css/                 # Hojas de estilo
│   ├── styles.css      # Estilos principales
│   ├── calendario.css  # Estilos del calendario
│   ├── panel-admin.css # Estilos del panel admin
│   └── panel-medico.css # Estilos del panel médico
├── js/                  # Scripts JavaScript
│   ├── main.js         # Funcionalidad principal
│   ├── formulario-citas.js # Lógica del formulario
│   ├── panel-admin.js  # Panel de administración
│   ├── panel-medico.js # Panel médico
│   ├── calendario.js   # Funcionalidad del calendario
│   ├── supabase.js     # Configuración de Supabase
│   └── validacion-formulario.js # Validaciones
├── db/                  # Scripts de base de datos
│   └── schema.sql      # Esquema de la base de datos
├── migrations/          # Migraciones de base de datos
├── server.js           # Servidor Express
├── package.json        # Dependencias del proyecto
└── README.md           # Este archivo
```

## 🔧 Configuración de Supabase

### Tablas Principales
- **citas**: Almacena información de las citas programadas
- **horarios_disponibles**: Define los horarios disponibles
- **pacientes**: Información de los pacientes
- **administradores**: Usuarios con permisos administrativos
- **valoraciones**: Sistema de feedback de pacientes

### Políticas de Seguridad (RLS)
- Lectura pública de horarios disponibles
- Inserción de citas solo para usuarios autenticados
- Modificación de citas solo para administradores
- Acceso completo a valoraciones solo para administradores

## 📧 Configuración de EmailJS

El sistema utiliza EmailJS para enviar notificaciones automáticas:
- Confirmaciones de citas
- Cancelaciones de citas
- Recordatorios de citas
- Modificaciones de horarios

### Templates Requeridos
- Template de confirmación de cita
- Template de cancelación de cita
- Template de recordatorio

## 🎨 Características de la Interfaz

### Diseño Responsive
- Adaptado para dispositivos móviles, tablets y desktop
- Navegación intuitiva y accesible
- Interfaz moderna con animaciones suaves

### Calendario Interactivo
- Visualización de horarios disponibles
- Selección de fechas y horas
- Indicadores visuales de disponibilidad
- Prevención de selección de horarios ocupados

### Validaciones
- Validación en tiempo real de formularios
- Prevención de citas duplicadas
- Validación de horarios de atención
- Verificación de disponibilidad antes de confirmar

## 🔒 Seguridad

- **Autenticación**: Sistema de login seguro
- **Autorización**: Control de acceso basado en roles
- **Validación**: Verificación de datos en frontend y backend
- **RLS**: Seguridad a nivel de fila en la base de datos
- **HTTPS**: Comunicación segura (en producción)

## 🚀 Despliegue

### Opciones de Despliegue
- **Vercel**: Para el frontend
- **Railway**: Para el backend Node.js
- **Supabase**: Base de datos y autenticación
- **Netlify**: Alternativa para hosting estático

### Variables de Entorno de Producción
```env
NODE_ENV=production
SUPABASE_KEY=tu_clave_anonima_produccion
EMAILJS_PUBLIC_KEY=tu_clave_publica_produccion
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: info@quirointegrativa.cl
- **Teléfono**: +(56) 961590395
- **Dirección**: Av. Providencia 1939, oficina 61-B

## 🙏 Agradecimientos

- Supabase por proporcionar una excelente plataforma de base de datos
- FullCalendar por la biblioteca de calendarios
- EmailJS por el servicio de emails
- La comunidad de desarrolladores de código abierto

---

**Desarrollado con ❤️ para Quirointegrativa**
 
