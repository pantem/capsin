# Manual de Usuario

## Sistema de Registro de Afectaciones por Sismos

---

# 1. Aplicación Móvil (Inspector de Campo)

## 1.1 Requisitos

- Dispositivo Android 5.0+ o iOS 12+
- GPS activado
- Conexión a internet (solo para sincronizar; el registro funciona sin conexión)

## 1.2 Pantalla Principal

Al abrir la app se muestra la lista de reportes capturados:

- Cada tarjeta muestra: **folio**, **dirección** (calle y colonia)
- Un icono de nube tachada indica que el reporte **no se ha sincronizado**
- Toca un reporte para ver su detalle
- Mantén presionado o usa el icono de papelera para eliminar
- Botón **+ Nuevo Reporte** para crear uno

Botón de **sincronizar** (esquina superior derecha) para subir datos pendientes y descargar reportes de otros dispositivos.

## 1.3 Crear un Nuevo Reporte (6 pasos)

### Paso 1 — Datos Generales

| Campo | Descripción |
|-------|-------------|
| Nombre del capturista | Tu nombre completo |
| Área a la que pertenece | Dependencia o equipo |
| Fecha y hora | Se asigna automáticamente |

### Paso 2 — Información del Inmueble Afectado

- **Obtener coordenadas**: Presiona el botón GPS. La app capturará tu ubicación y automáticamente rellenará la dirección (calle, colonia, alcaldía, CP) usando geolocalización inversa.
- **Calle y Número**: Dirección del inmueble.
- **Código Postal**: Escribe 5 dígitos. Al completarlos, la app buscará el CP en el catálogo SEPOMEX. Si hay una sola colonia, se auto-rellena. Si hay varias, aparece un menú desplegable para elegir.
- **Colonia**: Se auto-rellena con el CP o puedes escribirla manualmente.
- **Alcaldía**: Se auto-rellena con el CP o puedes escribirla manualmente.

**Campos dinámicos**: Tomados de las características configuradas para el tipo de inmueble (sección 2 del catálogo). Los principales son:

- **2.9 Uso del Inmueble** (selección): UNIFAMILIAR, MULTIFAMILIAR, CENTRO DE REUNIÓN, OFICINAS PRIVADAS, INDUSTRIAS, RECREATIVO, COMERCIOS, ESTACIONAMIENTO, EDUCACIÓN, OFICINAS PÚBLICAS, BODEGAS, MIXTO
- **2.8 Año estimado de la Construcción** (número, de 1700 a 2026)
- **2.10 Número de niveles sobre el terreno** (selección del 1 al 100)
- **2.11 Número de sótanos** (selección del 0 al 100)
- **2.12 Número de ocupantes** (número)
- **2.6 Responsable del Inmueble** y **2.7 Teléfono del Responsable** (texto y número)
- **2.13 Tipo de inspección** (selección): INSPECCIÓN EXTERIOR ÚNICAMENTE, INSPECCIÓN INTERIOR Y EXTERIOR

> Nota: las **coordenadas** (Latitud/Longitud), el **Nombre** y el **Tipo de inmueble** se capturan en el registro del inmueble (web, sección *Alta Inmuebles*); el resto de los campos 2.1 a 2.13 —incluido el **2.8 Año estimado de la Construcción**— son características del catálogo.

### Paso 3 — Estado de la Edificación

Campo dinámico: **3.1 Sistema constructivo** (texto largo) y los incisos **3.2 a 3.15** (selección única).

- **3.2 ¿Presenta colapso estructural?** (desplegable): No presenta colapso, Colapso parcial, Colapso total
- **3.3 a 3.15** se responden con **Sí** / **No**:
  - Edificación separada de su cimentación
  - Asentamiento diferencial o hundimiento
  - Inclinación notoria de la edificación o de algún entrepiso
  - Daños severos en elementos estructurales (columnas, vigas, muros de carga)
  - Daños moderados en elementos estructurales
  - Daños severos en elementos no estructurales (muros divisorios, acabados, cancelería)
  - Daños moderados en elementos no estructurales
  - Daños en instalaciones eléctricas, hidrosanitarias y de gas
  - Deslizamiento de talud o corte
  - Pretiles, balcones u otros objetos en peligro de caer
  - Otros peligros (líneas o ductos rotos, derrames tóxicos, etc.)

### Paso 4 — Clasificación Global

Campo dinámico: **4.1 Nivel de riesgo** (selección única):

- Riesgo bajo
- Riesgo medio
- Riesgo alto
- Colapso

El sistema muestra esta clasificación (como píldora de color) en las listas, el mapa y la ubicación de inmuebles.

### Paso 5 — Recomendaciones

- **5.1 Requiere revisión futura** (Sí / No)
- **5.2 ¿Requiere D.R.O. o C-SE?** (desplegable): D.R.O., C-SE
- **5.3 Apuntalar** (Sí / No)
- **5.4 Maquinaria para remover escombro** (Sí / No)
- **5.5 ¿Requiere apoyo de alguna dependencia?** (desplegable): Sí / No. Al elegir **Sí** se despliega el campo **"Indique la dependencia que brindará el apoyo"**; al cambiar a **No** el texto se limpia.

### Paso 6 — Fotos y Observaciones

- **Observaciones**: texto libre para notas, comentarios o información relevante.
- **Fotografías**: presiona **Cámara** para tomar una foto o **Galería** para seleccionar una existente; toca la **X** en una miniatura para eliminarla (máximo 10, incluyendo fachada).

### Guardar Reporte

Al llegar al paso 6, el botón muestra **Guardar Reporte**. La app valida todos los campos requeridos y guarda el reporte en el almacenamiento local del dispositivo.

## 1.4 Ver Detalle de un Reporte

Desde la pantalla principal, toca un reporte para ver:

- Folio único
- Fecha de captura
- Dirección completa
- Coordenadas geográficas
- Datos del capturista
- Características del inmueble (secciones 2 a 6)
- Estado de la edificación (3.1 a 3.15)
- Clasificación global / Nivel de riesgo (4.1)
- Recomendaciones (5.1 a 5.5)
- Observaciones
- Fotografías capturadas
- Personas damnificadas registradas (nombre, edad, sexo, estado, requiere traslado)

## 1.5 Sincronización

La app funciona **offline-first**: los reportes se guardan localmente aunque no haya internet.

Para sincronizar:

1. Conéctate a internet
2. Presiona el icono de sincronización (esquina superior derecha)
3. La app subirá los reportes nuevos al servidor y descargará los creados por otros dispositivos
4. Los reportes sincronizados mostrarán el icono de nube (sin tachadura)

**Nota**: La URL del servidor se configura en `lib/config.dart`. Por defecto apunta a `https://capsin.onrender.com/api`. Si ejecutas el backend localmente, cambia esta URL.

---

# 2. Dashboard Web (Centro de Monitoreo)

## 2.1 Acceso

Abre el navegador y ve a la URL donde está alojado el backend:

- Producción: `https://capsin.onrender.com`
- Local: `http://localhost:4000`

## 2.2 Vista de Resumen (Dashboard)

Muestra indicadores agregados de todos los inmuebles registrados:

| Indicador | Descripción |
|-----------|-------------|
| **Total de inmuebles** | Registros en el padrón |
| **Sin daño** | Inmuebles en estado "sin daños" (+ % del total) |
| **Moderado** | Inmuebles con daño moderado (+ % del total) |
| **Crítico** | Inmuebles en riesgo alto (+ % del total) |
| **Colapso** | Inmuebles colapsados (+ % del total) |

- **Gráfico de pastel** con la distribución por estado de afectación.
- **Sección de alcaldías** con el desglose por alcaldía.
- **Fecha de actualización** de los datos (hora local de la CDMX).
- Botón **Exportar PDF** para descargar el estado actual del dashboard.

## 2.3 Lista de Reportes

Navegación: Haz clic en **Lista de Reportes** en el menú superior.

- Tabla con columnas: **Folio**, **Fecha de Registro**, **Dirección / Ubicación**, **Nivel de Riesgo**, **Descargar Reporte**.
- El **Nivel de Riesgo** se muestra como píldora de color: Riesgo bajo (verde), Riesgo medio (ámbar), Riesgo alto (rojo), Colapso (negro).
- **Buscar**: filtra por folio, dirección, municipio/alcaldía o código postal.
- **Paginación**: "Mostrando X a Y de Z reportes", con selector de **10, 15, 25, 50 o 100 por página** y botones `« ‹ › »`.
- **Ver detalle**: haz clic en cualquier fila para abrir el modal con folio, botón **Descargar Reporte Oficial (PDF)**, fecha de creación, capturista, fecha de sincronización, dirección, coordenadas, descripción, dispositivo, fotos e inmuebles asociados.
- **Descargar**: botón en la última columna para generar el PDF del reporte.

## 2.4 Mapa Interactivo

Navegación: Haz clic en **Mapa** en el menú superior.

- Mapa centrado en la CDMX con marcadores por cada siniestro
- **Colores**:
  - 🔴 Rojo: Crítico (con fallecidos o lesionados graves)
  - 🟡 Amarillo: Moderado (con lesionados leves)
  - 🟢 Verde: Sin daños
- Haz clic en un marcador para ver: folio, dirección, damnificados, inmuebles
- Leyenda de colores en la esquina inferior derecha
- Controles de zoom y desplazamiento

## 2.5 Ubicación de Inmuebles

Navegación: Haz clic en **Ubicación** en el menú superior.

- Título: **Ubicación de Inmuebles**; botón **Exportar XLSX** para descargar la tabla (con los filtros aplicados) a Excel.
- **Filtros**: Alcaldía (`Todas las alcaldías`), Colonia (`Todas las colonias`), Código postal y Riesgo (`Riesgos`, `Riesgo bajo`, `Riesgo medio`, `Riesgo alto`, `Colapso`).
- Contador: `N registro(s) en total` / `0 registro(s) encontrado(s)`.
- Tabla con columnas: **Folio**, **Fecha**, **Alcaldía**, **Dirección**, **CP**, **Uso**, **Niveles** (sobre terreno + sótanos), **Nivel de riesgo**, **Descargar**.
- **Detalle**: haz clic en cualquier fila para abrir el modal del reporte.
- **Descargar**: genera el PDF del reporte en el navegador.
- **Paginación**: "Mostrando 1 a 15 de N registros" con selector de 10, 15, 25, 50 o 100 por página.

## 2.6 Alta de Inmuebles (Padrón)

Navegación: Haz clic en **Alta Inmuebles** en el menú superior (requiere el permiso `ver_alta_inmuebles`).

- Título: **Alta de Inmuebles**; botón **+ Nuevo Inmueble**.
- **Buscador**: `Buscar por nombre, colonia, dirección...`
- **Filtro** por alcaldía (`Todas las alcaldías`).
- Contador: `N inmueble(s) registrado(s)` / `N inmueble(s) encontrado(s)`.
- Tabla con columnas: **Nombre**, **Dirección**, **Colonia**, **Alcaldía**, **CP**, **Niveles**, **Último Reporte** (o `Sin reportes`), **Acciones**.
- **Acciones por fila**: ✏️ Editar y 🗑 Eliminar (confirmación: `¿Eliminar este inmueble y todos sus reportes de seguimiento?`).

### Formulario del inmueble

Se abre como modal (`Nuevo Inmueble en Padrón` / `Editar Inmueble`). Primero aparece un indicador de carga y después la sección **1. Ubicación y Descripción**, formada por tres campos fijos:

| Campo | Detalle |
|-------|---------|
| Nombre / Descripción del inmueble | Obligatorio |
| Tipo de inmueble | Desplegable con los tipos activos |
| Latitud / Longitud | Números decimales |

El resto de la sección 1 **se genera desde las características 2.1 a 2.13** del tipo de inmueble (las mismas que aparecen en la API y en el catálogo *Características*):

| Característica | Tipo |
|----------------|------|
| 2.1 Calle y Número (Manzana y Lote, en su caso) | Texto |
| 2.2 Colonia | Texto |
| 2.3 Alcaldía | Texto |
| 2.4 Código Postal | Texto (5 dígitos) |
| 2.5 Entre que calles / Referencia | Texto |
| 2.6 Responsable del Inmueble | Texto |
| 2.7 Teléfono del Responsable del Inmueble | Número |
| 2.8 Año estimado de la Construcción | Número (1700 a 2026) |
| 2.9 Uso del Inmueble | Las 12 opciones del catálogo (UNIFAMILIAR … MIXTO) |
| 2.10 Número de niveles sobre el terreno | 1 a 100 |
| 2.11 Número de sótanos | 0 a 100 |
| 2.12 Número de ocupantes | Número |
| 2.13 Tipo de inspección | INSPECCIÓN EXTERIOR ÚNICAMENTE / INSPECCIÓN INTERIOR Y EXTERIOR |

A continuación se pintan las secciones dinámicas **2. Estado de la Edificación**, **3. Clasificación Global**, **4. Recomendaciones** y **5. Observaciones**, generadas desde las características del tipo de inmueble.

- Las selecciones `Sí` / `No` se muestran como botones de radio; el resto como desplegables.
- En **5.5 ¿Requiere apoyo de alguna dependencia?**, al elegir **Sí** aparece el campo **"Indique la dependencia que brindará el apoyo"**.
- Al editar, los valores capturados se cargan de nuevo en el formulario (los guardados antes en los campos fijos del inmueble se muestran en su característica correspondiente).
- El catálogo se guarda en caché en el navegador: la primera apertura tarda lo que tarde la red y las siguientes se abren de inmediato; al guardar o eliminar un **Tipo de Inmueble** la caché se vuelve a cargar.
- Si la consulta falla, el modal muestra un mensaje de error con el botón **Reintentar**.

**Fotografías**: botón **📷 Seleccionar imágenes** (máximo 10, con vista previa y ✕ para quitar).

**Botones**: **Crear Inmueble** / **Guardar Cambios** y **Cancelar**. Validación: `El nombre es requerido`.

## 2.7 Administración de Tipos de Inmueble

> **Nota**: el botón **Tipos** del menú superior está oculta en esta versión; esta sección describe la pantalla para cuando sea habilitada.

Navegación: Haz clic en **Tipos** en el menú superior.

### Lista de tipos

Muestra todos los tipos de inmueble registrados con:

- Nombre y descripción
- Número de características asociadas
- Estado: Activo / Inactivo
- Acciones: Editar ✏️, Eliminar 🗑, Activar/Desactivar

### Editar un tipo

1. Haz clic en **✏️** junto al tipo deseado
2. Modifica el **Nombre** y **Descripción** si es necesario
3. Administra las **Características**:
   - **Agregar**: Presiona "+ Agregar Característica"
   - **Editar**: Haz clic en ✏️ sobre una característica
   - **Eliminar**: Haz clic en 🗑 sobre una característica
4. Presiona **Guardar Cambios**

### Configuración de una Característica

| Campo | Descripción |
|-------|-------------|
| Nombre | Ej: "Material predominante". Se recomienda mantener el prefijo numérico (2.9, 5.5…) |
| Tipo de dato | Texto, Texto largo, Número, Sí/No, Selección, Multiselección |
| Orden | Número que define la posición dentro de la sección (2.x = 1-14, 3.x = 20-40, 4.x = 40-50, 5.x = 50-60, 6.x = 60-70) |
| Requerido | Marca si el campo es obligatorio |
| Visualización | Solo para Selección/Multiselección: Automático, Desplegable o Radio. Automático pinta radio cuando las opciones son `Sí`/`No` (o `Sí`/`No`/`Existen dudas`) y desplegable en el resto |
| Condicional texto | **No / Sí**. Con **Sí**, la selección se fuerza a desplegable y al elegir `Sí` aparece un campo de texto ("Indique la dependencia que brindará el apoyo") que se guarda como valor condicional |
| Opciones | Solo para Selección/Multiselección. Escribe una opción por línea |
| Mínimo / Máximo | Solo para Número: rango permitido (Ej: 1700 - 2026) |

> Las opciones definidas aquí son las que muestran la app móvil y el formulario de *Alta Inmuebles*. Si cambias una opción, reinicia el backend: al arrancar, el seed sincroniza las opciones de todas las características con la base de datos (excepto las que se listen en `OPCIONES_EXCLUIDAS`).

### Crear un nuevo tipo

1. Presiona **+ Agregar Característica** (arriba de la lista)
2. Llena el formulario igual que al editar
3. Presiona **Crear Tipo**

### Eliminar un tipo

- Haz clic en 🗑 junto al tipo
- Confirma la eliminación
- Se borran el tipo y todas sus características asociadas

## 2.8 Catálogo de Códigos Postales

> **Nota**: el botón **Catálogo CDMX** del menú superior está oculta en esta versión.

Navegación: Haz clic en **Catálogo CDMX** en el menú superior.

- **Buscar**: Escribe un código postal o nombre de colonia
- **Filtrar por alcaldía**: Usa el menú desplegable
- Los resultados muestran: código postal, colonia, tipo de asentamiento y alcaldía
- Límite de 200 resultados por búsqueda

## 2.9 Usuarios

Navegación: Haz clic en **Usuarios** en el menú superior (requiere el permiso `ver_usuarios`).

- Título: **Usuarios**; botón **+ Nuevo Usuario**.
- Lista de tarjetas con: nombre del usuario, `@username · Rol`, `Área · Activo|Inactivo` (los inactivos se muestran atenuados).
- Sin buscador, filtros ni paginación.
- **Acciones**: ✏️ Editar y 🗑 Eliminar (confirmación: `¿Eliminar este usuario?`).

### Formulario

| Campo | Detalle |
|-------|---------|
| Nombre completo | Obligatorio |
| Nombre de usuario | Obligatorio |
| Contraseña | Obligatoria en alta; en edición: `Contraseña (dejar vacío para mantener actual)` |
| Área | Desplegable (`Seleccionar área...`) |
| Rol | Desplegable con los roles registrados |

**Botones**: **Crear Usuario** / **Guardar Cambios** y **Cancelar**. Validaciones: `Nombre y usuario son requeridos`, `La contraseña es requerida`.

## 2.10 Áreas

Navegación: Haz clic en **Áreas** en el menú superior (requiere el permiso `ver_areas`).

- Título: **Áreas**; botón **+ Nueva Área**.
- Tarjetas con: nombre, descripción (o `Sin descripción`) y `Activo` / `Inactivo`.
- **Acciones**: interruptor para activar/desactivar, ✏️ Editar y 🗑 Eliminar (confirmación: `¿Eliminar esta área?`).
- Si el área tiene usuarios: `No se puede eliminar: N usuario(s) pertenecen a esta área`.

### Formulario

- **Nombre** (obligatorio) y **Descripción** (texto largo).
- **Botones**: **Crear Área** / **Guardar Cambios** y **Cancelar**. Validación: `El nombre es requerido`.

## 2.11 Roles y Permisos

Navegación: Haz clic en **Roles** en el menú superior (requiere el permiso `ver_roles`).

- Título: **Roles y Permisos**; botón **+ Nuevo Rol**.
- Tarjetas con: nombre, descripción (o `Sin descripción`) y `Permisos: <lista> · Activo|Inactivo` (o `Ninguno`).
- **Acciones**: interruptor para activar/desactivar, ✏️ Editar y 🗑 Eliminar (confirmación: `¿Eliminar este rol?`).
- Si el rol tiene usuarios: `No se puede eliminar: N usuario(s) tienen este rol`.

### Formulario

- **Nombre** (obligatorio), **Descripción** y la lista **Permisos (pestañas que puede ver)** con casillas:

| Permiso | Casilla en el formulario |
|---------|--------------------------|
| `ver_dashboard` | Dashboard |
| `ver_mapa` | Mapa |
| `ver_lista` | Lista de Reportes |
| `ver_catalogo` | Catálogo CDMX |
| `ver_usuarios` | Usuarios |
| `ver_tipos` | Tipos de Inmueble |
| `ver_areas` | Áreas |
| `ver_roles` | Roles y Permisos |
| `ver_alta_inmuebles` | Alta Inmuebles |
| `ver_mascaras` | Máscaras de Folio |

- En la práctica, los permisos muestran u ocultan las pestañas **Usuarios**, **Áreas**, **Roles**, **Alta Inmuebles** y **Máscaras Folio**.
- **Botones**: **Crear Rol** / **Guardar Cambios** y **Cancelar**. Validación: `El nombre es requerido`.

## 2.12 Máscaras de Folio

Navegación: Haz clic en **Máscaras Folio** en el menú superior (requiere el permiso `ver_mascaras`).

- Título: **Máscaras de Folio**; botón **+ Nueva Máscara**.
- Tarjetas con: nombre, descripción, el `formato` en código, `Aplica a: … | Secuencial actual: N | Longitud: N` y `Activa` / `Inactiva`.
- **Acciones**: interruptor para activar/desactivar, ✏️ Editar y 🗑 Eliminar (confirmación: `¿Eliminar esta máscara?`).

### Formulario

| Campo | Detalle |
|-------|---------|
| Nombre | Obligatorio. Ej: `Siniestros CDMX` |
| Descripción | Texto largo opcional |
| Formato del folio | Obligatorio. Por defecto `{prefijo}-{aaaa}-{mm}-{seq_padded}` |
| Prefijo (valor para {prefijo}) | Ej: `SIS` |
| Longitud del secuencial | 1 a 10. `Ej: 4 genera 0001, 5 genera 00001` |
| Aplica a | `Siniestros y Seguimiento`, `Solo Siniestros (móvil)`, `Solo Seguimiento` |
| Secuencial actual | Solo al editar: `Último número generado. Solo editar si es necesario.` |

**Tokens disponibles** (haz clic en uno para insertarlo en el formato):

| Token | Descripción |
|-------|-------------|
| `{prefijo}` | Prefijo de la máscara |
| `{aaaa}` | Año (4 dígitos) |
| `{mm}` | Mes (2 dígitos) |
| `{dd}` | Día (2 dígitos) |
| `{alcaldia}` | Alcaldía del reporte |
| `{seq}` | Secuencial sin padding |
| `{seq_padded}` | Secuencial con ceros (ej: 0001) |

**Botones**: **Crear Máscara** / **Guardar Cambios** y **Cancelar**. Validaciones: `El nombre es requerido`, `El formato es requerido`.

---

# 3. Solución de Problemas

| Problema | Causa posible | Solución |
|----------|---------------|----------|
| GPS no obtiene coordenadas | GPS desactivado o sin permisos | Activa el GPS y concede permisos a la app |
| No se auto-rellena la dirección al obtener GPS | Sin conexión a internet (Nominatim requiere internet) | Conéctate a internet o escribe la dirección manualmente |
| La búsqueda de CP no devuelve resultados | Servidor no disponible o CP no está en el catálogo | Verifica conexión o escribe la dirección manualmente |
| No se sincronizan los reportes | Sin internet o URL del servidor incorrecta | Verifica conexión y la URL en `lib/config.dart` |
| El dashboard web no carga datos | Servidor backend no está corriendo | Inicia el servidor con `npm start` en la carpeta `backend/` |
| Las características no aparecen en la app móvil | No se ha sincronizado después de cambiar los tipos | Sincroniza la app después de guardar cambios en el dashboard |
| En *Alta Inmuebles* no aparece el campo de texto de **5.5 ¿Requiere apoyo de alguna dependencia?** | Navegador con una versión anterior de `js/app.js` en caché | Recarga la página con Ctrl + F5 |
| Las opciones de *Uso del Inmueble* muestran nombres viejos | El backend no se reinició después de cambiar las opciones en el seed | Reinicia el backend: al arrancar sincroniza las opciones con la base de datos |

---

# 4. Configuración

## 4.1 URL del Servidor (App Móvil)

Edita `mobile/lib/config.dart`:

```dart
class AppConfig {
  static const String apiBaseUrl = 'https://capsin.onrender.com/api';
}
```

Para desarrollo local:

```dart
class AppConfig {
  static const String apiBaseUrl = 'http://192.168.x.x:4000/api';
}
```

## 4.2 Variables de Entorno (Backend)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `4000` |
| `MONGO_URI` | Cadena de conexión a MongoDB | `mongodb+srv://...` |
