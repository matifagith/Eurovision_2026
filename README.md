# 🗳️ Eurovision Vote App

**Eurovision Vote App** es una plataforma web interactiva diseñada exclusivamente para la gestión, auditoría y escrutinio oficial de votos en festivales musicales. 

El sistema centraliza todo el desarrollo del certamen, permitiendo a los administradores controlar las fases de la competencia en vivo y ofreciendo al jurado una interfaz simplificada para calificar las canciones de forma rápida y sin fricciones.

---

## 🎭 ¿Qué hace la aplicación? (Funcionalidades Clave)

El sistema divide sus responsabilidades en tres grandes pilares para garantizar que la noche del festival sea un éxito rotundo:

### 👑 1. Control Total del Festival (Panel de Administrador)
El administrador del evento cuenta con una cabina de control digital para dirigir el festival en tiempo real:
* **Habilitador de Votaciones:** Permite abrir y cerrar las urnas digitales para galas específicas (ej: *Primera Semifinal, Segunda Semifinal o la Gran Final*) con un solo clic, asegurando que nadie vote fuera de hora.
* **Interruptor de Visibilidad:** Controla qué ediciones están listas para ser vistas por el público o cuáles se mantienen en modo **Borrador** mientras se cargan los artistas.
* **Escrutinio en Vivo:** Acceso instantáneo a las planillas consolidadas para auditar qué está votando cada miembro del jurado.
* **Gestión de Contenidos:** Centrales independientes para dar de alta, editar o remover Artistas, Canciones, Países participantes y Categorías de evaluación.

### ⚖️ 2. Sistema de Calificación para Jurados (Jueces)
Los miembros del jurado disponen de un entorno optimizado para dispositivos móviles y computadoras:
* **Puntuación Intuitiva:** Una interfaz limpia para evaluar las presentaciones musicales en las distintas categorías del festival a medida que ocurren en el escenario.
* **Resultados Blindados:** Los votos se envían de forma directa y segura, evitando planillas de papel o recuentos manuales lentos.

### 🔑 3. Centro de Soporte y Blanqueo Automatizado
Para evitar contratiempos o usuarios varados la noche del evento, la app cuenta con un sistema inteligente de recuperación de accesos:
* **Solicitud de Auxilio:** Si un juez olvida su clave, la solicita desde la pantalla de inicio ingresando su usuario y su correo.
* **Escudo Anti-Spam:** El sistema bloquea de forma inteligente solicitudes duplicadas si el usuario ya tiene un trámite en curso, protegiendo el orden del panel.
* **Cola de Atención en Cero:** El administrador visualiza las solicitudes pendientes en un panel limpio. Con un solo botón, el sistema genera una contraseña segura, actualiza la cuenta del juez y le despacha un correo electrónico automático con los nuevos datos de acceso.
* **Botonera de Rechazo:** Si la solicitud es un error o una prueba, el administrador puede denegarla para archivarla de forma segura.
* **Historial de Auditoría:** Un registro completo en la parte inferior detalla qué solicitudes fueron aprobadas o denegadas en el pasado para mantener un control estricto de la seguridad.

---

## 📋 Flujo de Trabajo del Evento

1. **Preparación:** El administrador carga las canciones, países y activa el modo **Publicada** en la gala correspondiente.
2. **Acceso:** Los jueces inician sesión. Si alguno no recuerda su clave, genera una solicitud que el administrador aprueba en segundos enviando un mail automático.
3. **Gala en Vivo:** El administrador presiona **Habilitar Votación**. Los jueces califican a los artistas en tiempo real.
4. **Cierre y Cómputo:** Se presiona **Cerrar Votación** y el sistema genera el escrutinio oficial del festival de manera inmediata y sin errores humanos.

---

## 🚀 Filosofía del Proyecto

Este desarrollo nace para profesionalizar la experiencia de votación en certámenes musicales, eliminando la burocracia de los cálculos manuales y garantizando transparencia, velocidad y soporte inmediato para todos los participantes.