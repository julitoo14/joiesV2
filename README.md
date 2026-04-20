<div align="center">
  <h1>📈 Crypto Trading Engine & Dashboard</h1>
  <p>
    <strong>Desarrollado por: Julián García Suárez</strong><br>
    <em>Full Stack Web Developer | Node.js, Vue.js & MongoDB</em><br>
    <em>Estudiante de Tecnicatura Universitaria en Programación (UTN)</em>
  </p>
</div>

---

## 🚀 Sobre el Proyecto

Este proyecto consiste en un **motor de ejecución de bots de trading automatizados** para criptomonedas, integrado de forma nativa con la API de Binance. El objetivo principal es migrar y escalar lógicas de trading (originalmente prototipadas en Python) a una arquitectura robusta, segura y altamente escalable utilizando **NestJS** y **Vue.js 3**.

**Estado del Proyecto:** En desarrollo activo (WIP). Actualmente enfocado en la integración core del motor de grillas (Grid Bot) y el diseño del dashboard de monitoreo en tiempo real.

---

## 🛠️ Stack Tecnológico

*   **Backend:** NestJS (Node.js framework) con TypeScript estricto.
*   **Frontend:** Vue.js 3 (Composition API) + Tailwind CSS.
*   **Base de Datos:** MongoDB (Atlas).
*   **Seguridad:** Passport.js (JWT) y Crypto (algoritmo AES-256).
*   **Integración:** Binance API (REST & WebSockets).

---

## 🏗️ Arquitectura y Patrones de Diseño

El backend ha sido diseñado bajo los principios de **Clean Architecture** para garantizar el fácil mantenimiento, testing y la escalabilidad del sistema:

*   **Strategy Pattern:** Implementado para la ejecución de bots. Cada estrategia (Grid, RSI, MACD, etc.) hereda de una clase base abstracta, permitiendo añadir nuevas lógicas de trading modulares sin modificar el núcleo del motor.
*   **Singleton Pattern:** Utilizado en el `BotManager` para gestionar el ciclo de vida de los procesos concurrentes en memoria y evitar colisiones de ejecución.
*   **Repository Pattern:** Desacoplamiento total entre la lógica de negocio y la persistencia de datos en MongoDB, facilitando futuros cambios de base de datos si fuera necesario.
*   **Seguridad de Grado Bancario:** Implementación de encriptación simétrica AES-256 para el resguardo de API Secrets de los usuarios, asegurando que las credenciales críticas solo sean legibles por el motor de ejecución en tiempo real y jamás queden expuestas.

---

## 📋 Funcionalidades Principales

*   ⚙️ **Gestión del Ciclo de Vida:** Inicio, pausa y detención de bots de forma totalmente dinámica e instantánea desde el dashboard.
*   🔒 **Autenticación Robusta:** Gestión segura de usuarios y sesiones mediante JWT (JSON Web Tokens).
*   📊 **Monitoreo en Tiempo Real:** Visualización detallada de balances, holdings (cartera) e historial de órdenes ejecutadas.
*   💾 **Persistencia y Recuperación de Estados:** El sistema es capaz de recuperar y reanudar bots y procesos de compra/venta activos automáticamente tras un reinicio imprevisto del servidor.

---

## 🔧 Instalación (Entorno de Desarrollo)

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/julitoo14/trading-bots.git
   cd trading-bots
   ```

2. **Configurar variables de entorno:**
   Crear un archivo `.env` en la raíz del proyecto siguiendo un formato similar a este:
   ```env
   MONGO_URI=tu_mongodb_uri
   JWT_SECRET=tu_secreto
   ENCRYPTION_KEY=tu_llave_maestra_aes
   ```

3. **Instalar dependencias del backend:**
   ```bash
   npm install
   ```

4. **Instalar dependencias del frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Ejecutar la aplicación (Backend y Frontend concurrentemente):**
   ```bash
   npm run dev
   ```

---

## 📈 Próximos Pasos (Roadmap)

- [ ] Implementación de WebSockets para actualización de precios en milisegundos sin necesidad de refresco.
- [ ] Desarrollo de módulos de analítica avanzada para cálculo de PnL neto (Profit and Loss).
- [ ] Contenerización del entorno completo (Base de Datos, Backend, Frontend) mediante Docker y Docker Compose.
