# OSS Kaffe

Aplicacion web para grilla del equipo y Finanzas, con sincronizacion de Bistrosoft.

## Uso local

1. Ejecutar `ABRIR APLICACION.cmd`.
2. Ingresar el usuario y la contrasena de Bistrosoft.
3. Mantener abierta la ventana de PowerShell mientras se usa la aplicacion.

No abrir `index.html` directamente: la interfaz abre, pero no puede sincronizar.

## Publicar en la web

El proyecto incluye un backend Node sin dependencias externas:

- Protege las credenciales de Bistrosoft en variables secretas del hosting.
- Valida el PIN administrativo en el servidor.
- Comparte el estado entre dispositivos.
- Actualiza el estado compartido cada 15 segundos mientras la app esta abierta.
- Sirve el frontend y la API desde el mismo dominio.

### Variables obligatorias

Configurar en el hosting:

```text
NODE_ENV=production
ADMIN_PIN=un PIN administrativo de 4 digitos
BISTROSOFT_USERNAME=usuario de Bistrosoft
BISTROSOFT_PASSWORD=contrasena de Bistrosoft
DATA_FILE=/ruta/persistente/state.json
```

No subir un archivo `.env` con valores reales.

### Render

1. Subir esta carpeta a un repositorio privado de GitHub.
2. En Render, crear un Blueprint desde el repositorio.
3. Render detectara `render.yaml`.
4. Completar `ADMIN_PIN`, `BISTROSOFT_USERNAME` y `BISTROSOFT_PASSWORD`.
5. Finalizado el despliegue, abrir la URL `onrender.com` asignada.

El archivo `render.yaml` usa una instancia Starter y un disco persistente de 1 GB.
Debe mantenerse una sola instancia, porque el estado compartido se guarda en ese disco.

### Netlify

Netlify esta configurado mediante `netlify.toml` y `netlify/functions/`.

1. Subir el proyecto a un repositorio privado y conectarlo a Netlify.
2. Netlify ejecutara `npm run build:netlify` y publicara solamente la carpeta `dist`.
3. En **Project configuration > Environment variables**, crear:

```text
ADMIN_PIN=un PIN administrativo de 4 digitos
SESSION_SECRET=una cadena aleatoria de al menos 32 caracteres
BISTROSOFT_USERNAME=usuario de Bistrosoft
BISTROSOFT_PASSWORD=contrasena de Bistrosoft
```

4. Hacer un nuevo deploy de produccion despues de guardar las variables.

`ADMIN_PIN` puede configurarse como `0000`. Si no se define, el backend usa `0000`
como valor inicial. `SESSION_SECRET` es recomendado; si falta, se deriva internamente
de los otros secretos configurados.

En el formulario de Netlify, el campo **Key** debe ser `ADMIN_PIN` y el campo
**Value** debe ser solamente `0000`, sin comillas. El backend tambien tolera comillas
o el formato `ADMIN_PIN=0000`, pero se recomienda guardar solo el valor.

No usar el despliegue manual por arrastrar una carpeta o solamente `index.html`: ese
metodo publica el frontend pero no construye ni activa las Functions.

Netlify Functions atiende `/api/*`, Netlify Blobs guarda el estado compartido y la
funcion programada `sync-bistro` actualiza los ultimos 14 dias cada 30 minutos aunque
nadie tenga la web abierta. Cuando un administrador abre Finanzas, la lectura visible
continua actualizandose cada 30 segundos.

Al abrir Finanzas como administrador, la aplicacion consulta todos los meses disponibles
en Bistrosoft e importa automaticamente los meses historicos que todavia falten. El boton
**Sincronizar historial** vuelve a leer todos los meses disponibles, incluso si ya estaban
importados. El historial queda guardado en Netlify Blobs; la copia local del navegador
omite los tickets de Bistrosoft para evitar superar su limite de almacenamiento.

### Accesos y perfiles

- Cada empleado configura sus datos obligatorios y una contrasena propia en el primer acceso.
- Las contrasenas se guardan protegidas mediante hash de forma separada en Netlify Blobs y no forman parte
  del estado compartido que recibe el navegador.
- El perfil **Visita** usa la clave `ossbcn` y solamente consulta Grilla y Finanzas.
- La vista del empleado incluye **Mis horas**, cierre automatico de fichajes olvidados y
  avisos del navegador cinco minutos antes del turno mientras la aplicacion permanece abierta.
- El administrador puede agregar, dar de baja y reactivar personal desde **Fichas > Personal**.
- Al fichar una salida, el empleado debe confirmar las mermas del dia. Finanzas incluye una
  pestaña mensual para consultar esas cantidades.
- La sincronizacion de Bistrosoft incorpora tambien los movimientos de caja tipo Retiro como
  gastos en categoria **Otros**, conservando la leyenda original como descripcion.

### Otros hostings

Se puede desplegar con `npm start` o mediante el `Dockerfile`. El hosting debe:

- Ejecutar Node 20 o superior.
- Proporcionar HTTPS.
- Mantener una sola instancia.
- Montar almacenamiento persistente y configurar `DATA_FILE`.

## Seguridad

Finanzas solo se consulta después de iniciar como administrador. Las credenciales de
Bistrosoft nunca se envian al navegador. Los empleados conservan el modelo actual de
acceso por nombre; antes de una apertura publica amplia conviene agregar PIN individual
para cada empleado.
