# OSS Kaffe

Aplicacion web para grilla del equipo, Pasteleria y Finanzas, con sincronizacion de Bistrosoft.

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
BISTROSOFT_USERNAME_MADRID=usuario de Bistrosoft Madrid
BISTROSOFT_PASSWORD_MADRID=contrasena de Bistrosoft Madrid
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
BISTROSOFT_USERNAME_MADRID=usuario de Bistrosoft Madrid
BISTROSOFT_PASSWORD_MADRID=contrasena de Bistrosoft Madrid
```

4. Hacer un nuevo deploy de produccion despues de guardar las variables.

`ADMIN_PIN` puede configurarse como `0000`. Si no se define, el backend usa `0000`
como valor inicial. `SESSION_SECRET` es recomendado; si falta, se deriva internamente
de los otros secretos configurados.

En el formulario de Netlify, el campo **Key** debe ser `ADMIN_PIN` y el campo
**Value** debe ser solamente `0000`, sin comillas. El backend tambien tolera comillas
o el formato `ADMIN_PIN=0000`, pero se recomienda guardar solo el valor.

Para Barcelona se pueden seguir usando `BISTROSOFT_USERNAME` y
`BISTROSOFT_PASSWORD`. Si se prefiere dejar todo nombrado por sucursal, tambien
se aceptan `BISTROSOFT_USERNAME_BARCELONA` y `BISTROSOFT_PASSWORD_BARCELONA`.
Madrid queda inactivo hasta cargar `BISTROSOFT_USERNAME_MADRID` y
`BISTROSOFT_PASSWORD_MADRID`.

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

### Sucursales

La app trabaja con dos sucursales: Barcelona y Madrid. Administrador y Visita
eligen sucursal despues de iniciar sesion; cada empleado entra directo a la
sucursal definida en su ficha. Finanzas, gastos, mermas, presupuestos, afluencia
y fichajes se guardan separados por `locationId`.

Una vez dentro como administrador, el boton compacto `BCN` / `MAD` situado junto
a **Salir** permite cambiar de tienda sin cerrar la sesion. La grilla, Finanzas,
Personal, Ajustes y la sincronizacion de Bistrosoft se actualizan para la sucursal
seleccionada.

La pestana **Finanzas > Auditoria** compara ventas diarias de Barcelona y Madrid
mes a mes. Sirve como control rapido para ver cada dia, tickets, totales y
diferencia entre locales.

La seccion **Carga por hora** usa directamente las ventas sincronizadas desde
Bistrosoft para cruzar tickets/ventas por hora contra las personas planificadas
en la grilla. Permite detectar horas criticas y sugerir refuerzos por sucursal
sin bajar ni subir reportes manuales.
Tambien muestra un mapa de calor por dia/hora y rankings de articulos: productos
vendidos en horas pico, venta mensual por cantidad y top 5 anualizado. Estos
rankings aparecen cuando la venta sincronizada/importada incluye detalle de
articulos.

En la cabecera de **Grilla**, **Horas planificadas** representa las horas totales
de apertura configuradas para el mes y **H. Libres** muestra las horas de apertura
sin ningun empleado asignado. El calculo respeta cierres, festivos, horarios
personalizados y los turnos aprobados.

El editor mensual de apertura permite completar la hora sin validar mientras se
esta escribiendo. Cada dia modificado se confirma con **Guardar**; la pantalla
indica cuando hay cambios pendientes y cuando Netlify confirmo el guardado. El
mismo flujo se aplica de forma independiente a Barcelona y Madrid. Cada dia se
guarda mediante una escritura puntual que no reenvia el historial de Bistrosoft,
para evitar demoras y errores por el tamano de la base.

En **Cambios**, los motivos **Vacaciones** y **Licencia** habilitan fecha desde
y fecha hasta. Al aprobarse se consideran ausencias de jornada completa y se
eliminan de la grilla todos los turnos del empleado dentro del intervalo,
incluidos los turnos de tarde. La solicitud y su aprobacion se guardan en el
estado compartido de Netlify.

La pestana **Finanzas > IA** permite consultar con lenguaje natural ventas,
productos, comparaciones, rankings y cobertura de la grilla. Procesa localmente
los datos ya sincronizados y no requiere una clave de IA externa. Las cantidades
de productos solo se informan cuando Bistrosoft entrego el detalle de articulos;
la pantalla muestra la cobertura disponible y no completa datos faltantes.

La grilla base de Madrid se cargo con la direccion `Calle de Manuel Cortina, 1,
Chamberi, 28010 Madrid` y coordenadas `40.43073, -3.69918`. Los festivos 2026
incluyen nacionales, Comunidad de Madrid y municipio de Madrid, todos con
apertura normal.

Para integrar datos reales de "Horas punta" de Google no alcanza una API key
simple de Maps. Hace falta acceso al perfil del negocio en Google Business
Profile y OAuth para consultar metricas propias cuando Google lo permita. La
app conserva la importacion CSV de afluencia por sucursal, por lo que se puede
empezar a registrar desde ahora con datos importados y mantener historial.

### Accesos y perfiles

- Cada empleado configura sus datos obligatorios y una contrasena propia en el primer acceso.
- Al entrar en **Soy del Team**, el boton **Volver** queda visible en el lateral superior para
  regresar al menu inicial si se eligio un acceso equivocado.
- Las contrasenas se guardan protegidas mediante hash de forma separada en Netlify Blobs y no forman parte
  del estado compartido que recibe el navegador.
- El perfil **Visita** usa la clave `ossbcn` y solamente consulta Grilla y Finanzas.
- La vista del empleado incluye **Mis horas**, cierre automatico de fichajes olvidados y
  avisos del navegador cinco minutos antes del turno mientras la aplicacion permanece abierta.
- La seccion **Pasteleria** esta disponible para administradores, encargados y empleados cuya
  area o rol sea Pasteleria/Pastelera. Incluye Banana Bread, Chipa, Datiles, Budin de limon y
  amapola, Carrot Cake y Cookies de chocolate, con ingredientes y procedimiento. Al indicar
  cuantas recetas se prepararan, la columna **Necesario ahora** multiplica en el momento toda
  la materia prima. Las cantidades base se incorporaron desde la planilla de recetas entregada;
  la operacion diaria no depende de una conexion con Google Sheets.
- El administrador puede agregar, dar de baja y reactivar personal desde **Fichas > Personal**.
- Las altas, ediciones, cambios de tienda, bajas programadas y reactivaciones de Personal se
  confirman mediante una escritura pequena e independiente en Netlify Blobs. Por eso quedan
  disponibles al borrar el cache, cambiar de ordenador o abrir una ventana de incognito. Si
  Netlify no confirma una modificacion, la app la informa y no la presenta como guardada.
- Al primer ingreso administrativo despues de actualizar, la app intenta recuperar en Netlify
  los empleados antiguos que todavia existan solamente en la copia local de ese navegador.
- Al fichar una salida, el empleado debe confirmar las mermas del dia. Finanzas incluye una
  pestaña mensual para consultar esas cantidades.
- La sincronizacion de Bistrosoft incorpora tambien los movimientos de caja tipo Retiro como
  gastos en categoria **Otros**, conservando la leyenda original como descripcion.
- En Finanzas > Gastos, el administrador puede reclasificar esos movimientos. La app guarda
  la categoria local asociada a las claves equivalentes del movimiento de Bistrosoft, por lo
  que las siguientes sincronizaciones no duplican el gasto ni pierden la clasificacion elegida.
- En Finanzas > Importar ventas, el administrador puede cargar ventas sueltas que no llegaron
  desde Bistrosoft indicando fecha, cantidad de tickets y total. Esas ventas se suman al P&L
  de la sucursal activa y no se eliminan con la sincronizacion automatica.
- En Ajustes > Respaldos entre Netlify, el administrador puede exportar el estado completo de
  un sitio e importarlo en otro. Esto sirve para copiar datos entre una web firme y una web de
  pruebas. El respaldo incluye grilla, finanzas, reclasificaciones de Bistrosoft, personal,
  fichas, mermas, presupuestos y ajustes. No incluye las contrasenas de empleados, que quedan
  guardadas como hashes separados en cada sitio Netlify.
- **Completar productos** inicia una carga historica unica para Barcelona y Madrid. Netlify
  recorre los meses disponibles en lotes diarios, guarda cada dia inmediatamente y conserva
  la cola fuera del navegador. Se puede cambiar de seccion, cambiar de tienda o cerrar la app
  sin perder el avance.
- La cola tiene bloqueo contra procesos duplicados, reintentos por dia y un control programado
  cada 10 minutos que retoma cualquier lote detenido. La sincronizacion automatica agrega
  tambien los tres dias recientes para incorporar los tickets nuevos con sus productos.
- Finanzas muestra por tienda el avance del recorrido y, al finalizar, la cobertura real de
  tickets con detalle. Un resultado inferior al 100% queda identificado como cobertura parcial:
  la app no inventa articulos para los tickets que Bistrosoft no entregue aun despues de los
  reintentos. Esta cobertura alimenta cross-selling, articulos/ticket, rankings y consultas de IA.
- El cross-selling se define para cualquier rango como `cafes vendidos / productos de pasteleria
  dulces o salados vendidos`. Los productos no necesitan compartir ticket con el cafe: por
  ejemplo, 120 cafes y 30 productos muestran `1 producto cada 4 cafes`.
- Las escrituras completas de navegadores antiguos ya no pueden reemplazar las ventas con
  detalle que el proceso de fondo haya guardado en Netlify.
- Los renglones diarios de **Finanzas > Auditoria** usan la misma funcion de calculo que la vista
  de un dia especifico en **Hoy**. Al actualizar un mes, se conserva la version mas completa de
  los articulos de cada ticket, evitando que cambie el cross-selling ya verificado por dia.

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
