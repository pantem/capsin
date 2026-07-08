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

**Campos dinámicos**: Dependiendo del tipo de inmueble configurado, aparecen campos adicionales como:

- Uso del Inmueble (selección): Vivienda Unifamiliar, Vivienda Multifamiliar, Escuela, Hospital, Oficina, Comercio, Otro
- Número de niveles (número)
- Fecha aproximada de construcción (texto)

### Paso 3 — Evaluación Preliminar de Daños

Campo dinámico: **Tipo de daño observado** (multiselección)

Selecciona uno o varios:

- Grietas leves
- Grietas estructurales
- Desprendimiento de acabados
- Daño en columnas
- Daño en trabes
- Inclinación
- Colapso parcial
- Colapso total

### Paso 4 — Condición de Seguridad

Campo dinámico: **Condición de seguridad** (selección única)

- Edificación segura
- Riesgo alto
- Riesgo medio
- Riesgo bajo

### Paso 5 — Observaciones Adicionales

Texto libre para notas, comentarios o información relevante.

### Paso 6 — Fotografías

- Presiona **Cámara** para tomar una foto
- Presiona **Galería** para seleccionar una existente
- Toca la **X** en una miniatura para eliminarla

### Guardar Reporte

Al llegar al paso 6, el botón muestra **Guardar Reporte**. La app valida todos los campos requeridos y guarda el reporte en el almacenamiento local del dispositivo.

## 1.4 Ver Detalle de un Reporte

Desde la pantalla principal, toca un reporte para ver:

- Folio único
- Fecha de captura
- Dirección completa
- Coordenadas geográficas
- Datos del capturista
- Características del inmueble
- Daños observados
- Condición de seguridad
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

Muestra estadísticas agregadas de todos los siniestros registrados:

- **Fallecidos**
- **Lesionados graves**
- **Lesionados leves**
- **Ilesos**
- **Inmuebles críticos**
- **Inmuebles con daño moderado**
- **Inmuebles sin daños**
- **Total de siniestros**

## 2.3 Lista de Reportes

Navegación: Haz clic en **Lista** en el menú superior.

- Muestra todos los siniestros en tarjetas con folio, fecha, dirección y nivel de severidad (Crítico / Moderado / Sin daños)
- **Buscar**: Escribe en el campo de búsqueda para filtrar por folio, dirección o alcaldía
- **Ver detalle**: Haz clic en una tarjeta para abrir un modal con:
  - Información completa del siniestro
  - Inmuebles asociados con su estado de afectación
  - Damnificados registrados con su clasificación
  - Detalle de departamentos/unidades (si aplica)

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

## 2.5 Administración de Tipos de Inmueble

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
| Nombre | Ej: "Material predominante" |
| Tipo de dato | Texto, Número, Sí/No, Selección, Multiselección |
| Requerido | Marca si el campo es obligatorio |
| Opciones | Solo para Selección/Multiselección. Escribe una opción por línea |

### Crear un nuevo tipo

1. Presiona **+ Agregar Característica** (arriba de la lista)
2. Llena el formulario igual que al editar
3. Presiona **Crear Tipo**

### Eliminar un tipo

- Haz clic en 🗑 junto al tipo
- Confirma la eliminación
- Se borran el tipo y todas sus características asociadas

## 2.6 Catálogo de Códigos Postales

Navegación: Haz clic en **Catálogo CDMX** en el menú superior.

- **Buscar**: Escribe un código postal o nombre de colonia
- **Filtrar por alcaldía**: Usa el menú desplegable
- Los resultados muestran: código postal, colonia, tipo de asentamiento y alcaldía
- Límite de 200 resultados por búsqueda

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
