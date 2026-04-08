# GalgoBet Backend
API de simulación de carreras de galgos con sistema de apuestas.

## Tecnologías
- **Node.js** + **Express** - Servidor HTTP y API REST
- **MongoDB** + **Mongoose** - Base de datos y ODM
- **JWT** - Autenticación por token
- **bcrypt** - Hash de contraseñas

## Requisitos
- Node.js 18+
- MongoDB 7+ (local o Docker)

## Instalación
```bash
# Instalar dependencias
npm install
# Editar .env con tus valores
# Poblar base de datos con datos iniciales
npm run seed
# Iniciar servidor
npm start
```

## Variables de Entorno
| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/galgobet` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `24h` |
| `CREDITOS_INICIALES` | Créditos al registrarse | `500` |

## Problemas conocidos al arrancar

### Docker en máquinas virtuales o CPUs sin AVX
Si al usar Docker aparece este warning y la API no conecta a MongoDB:
```
WARNING: MongoDB 5.0+ requires a CPU with AVX support
Error al conectar a MongoDB: getaddrinfo EAI_AGAIN mongo
```
**Causa:** MongoDB 7 requiere soporte AVX en la CPU, que no está disponible en máquinas virtuales (VirtualBox, VMware) con CPUs antiguas.

**Solución:** Cambiar la versión de MongoDB en `docker-compose.yml` de `mongo:7` a `mongo:4.4`:
```yaml
  mongo:
    image: mongo:4.4
```
Luego reiniciar los contenedores:
```bash
docker-compose down
docker-compose up --build
```

## Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/perfil` - Perfil del usuario (auth)

### Galgos
- `GET /api/galgos` - Listar galgos
- `GET /api/galgos/:id` - Detalle de galgo
- `POST /api/galgos` - Crear galgo
- `PUT /api/galgos/:id` - Actualizar galgo
- `DELETE /api/galgos/:id` - Eliminar galgo

### Pistas
- `GET /api/pistas` - Listar pistas (con galgos asignados)
- `GET /api/pistas/:id` - Detalle de pista
- `POST /api/pistas` - Crear pista

### Carreras
- `GET /api/carreras` - Historial de carreras
- `GET /api/carreras/:id` - Detalle de carrera
- `GET /api/carreras/:id/vueltas` - Vueltas de una carrera
- `POST /api/carreras/simular` - Simular carrera libre
- `POST /api/carreras/programar` - Programar carrera
- `POST /api/carreras/preparar-jornada` - Preparar jornada de carreras
- `POST /api/carreras/correr` - Correr carrera programada

### Apuestas
- `POST /api/apuestas` - Realizar apuesta (auth)
- `GET /api/apuestas/mis-apuestas` - Mis apuestas (auth)
- `GET /api/apuestas/:id` - Detalle de apuesta (auth)

### Rankings
- `GET /api/rankings` - Ranking de galgos por puntos
- `GET /api/rankings/vuelta-rapida` - Ranking de vuelta rápida
- `GET /api/rankings/apostadores` - Top apostadores

### Incidentes
- `GET /api/incidentes` - Listar incidentes
- `GET /api/incidentes/estadisticas` - Estadísticas de incidentes
- `GET /api/incidentes/galgo/:id` - Incidentes de un galgo

### Transacciones
- `GET /api/transacciones/mis-movimientos` - Mis movimientos (auth)

## Usuarios de prueba (después de seed)
| Email | Password | Rol |
|---|---|---|
| admin@galgobet.com | admin123 | admin |
| juan@test.com | 123456 | usuario |
| maria@test.com | 123456 | usuario |
| pedro@test.com | 123456 | usuario |
| ana@test.com | 123456 | usuario |

Todos los usuarios empiezan con 500 créditos.
