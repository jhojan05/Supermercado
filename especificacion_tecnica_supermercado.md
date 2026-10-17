# Especificación técnica frontend: Supermercado virtual

**Versión:** 1.0  
**Tipo de proyecto:** sitio web de supermercado / comercio electrónico  
**Alcance:** únicamente frontend  
**Tecnologías permitidas:** HTML5, CSS3 y JavaScript ES6+  
**Nombre provisional:** Supermercado Verde

---

## 1. Descripción general

El proyecto consiste en desarrollar una página web para un supermercado que permita a los usuarios explorar productos, consultar precios, identificar promociones, filtrar categorías y simular una compra desde una interfaz agradable y fácil de utilizar.

El objetivo no es únicamente que la página se vea bien, sino que el usuario pueda completar sus tareas sin confusiones, encuentre rápidamente los productos que busca y tenga una experiencia de compra coherente.

**Tipo de producto:** sitio web de comercio electrónico de alimentos, bebidas, productos de aseo y artículos para el hogar.

**Alcance:** prototipo funcional de frontend, con productos de demostración y almacenamiento local cuando sea necesario. No procesará pagos reales ni registrará pedidos en un servidor.

## 2. Investigación de referentes y buenas prácticas

La propuesta toma como referencia sitios y estudios relacionados con supermercados digitales y experiencia de usuario. Los siguientes referentes pueden orientar la organización y el diseño, sin copiar sus interfaces literalmente.

### 2.1. Instacart

**Sitio:** https://www.instacart.com/

Referencia para:
- Búsqueda de productos visible.
- Organización por categorías.
- Acceso rápido al carrito.
- Colecciones y descubrimiento de productos.

### 2.2. ALDI

**Sitio:** https://www.aldi.us/

Referencia para:
- Compra práctica y sencilla.
- Jerarquía visual clara.
- Presentación de productos y promociones.
- Navegación directa.

### 2.3. Baymard Institute

**Sitio:** https://baymard.com/

Referencia de investigación UX para:
- Navegación y búsqueda.
- Filtros y listados de productos.
- Fichas de producto.
- Carrito y proceso de compra.
- Usabilidad de comercio electrónico.

### 2.4. Referentes colombianos

- **Merqueo:** https://merqueo.com/  
  Referente de supermercado digital, categorías y opciones de compra.

- **Mercanto:** https://mercanto.pro/  
  Referente de mercado digital y productos de la canasta familiar colombiana.

### 2.5. Buenas prácticas que se aplicarán

- Mantener la búsqueda disponible en la parte superior.
- Organizar las categorías de manera clara.
- Mostrar nombre, imagen, presentación y precio de cada producto.
- Mantener visibles las cantidades y el total del carrito.
- Adaptar la interfaz a pantallas pequeñas.
- Comunicar las acciones completadas y los errores con mensajes claros.
- Utilizar una identidad visual propia inspirada en las convenciones del comercio electrónico.

## 3. Objetivos del sistema

### 3.1. Objetivo general

Desarrollar una interfaz web de supermercado que permita explorar y seleccionar productos mediante una experiencia de usuario intuitiva, accesible, responsive y visualmente consistente, utilizando únicamente HTML, CSS y JavaScript.

### 3.2. Objetivos específicos

1. Diseñar una página de inicio con promociones, categorías y productos destacados.
2. Facilitar la búsqueda y el filtrado de productos.
3. Implementar un carrito de compras interactivo.
4. Mantener el estado del carrito mediante `localStorage`.
5. Diseñar una interfaz adaptable a computadores, tabletas y celulares.
6. Aplicar principios de accesibilidad y usabilidad.
7. Organizar el código para permitir una futura conexión con un backend sin rehacer la interfaz.

## 4. Alcance funcional

| Módulo | Funcionalidades |
|---|---|
| Inicio | Banner promocional, accesos a categorías y productos destacados. |
| Catálogo | Listado de productos con imágenes, precios y cantidades. |
| Búsqueda | Buscar por nombre y filtrar por categoría. |
| Ordenamiento | Precio ascendente, precio descendente y nombre. |
| Productos | Ver información y agregar unidades al carrito. |
| Carrito | Agregar, eliminar, aumentar y disminuir cantidades. |
| Resumen de compra | Calcular subtotal, descuentos de demostración y total. |
| Favoritos | Marcar y desmarcar productos favoritos. |
| Navegación | Acceso a inicio, categorías, ofertas y carrito. |
| Persistencia local | Recordar carrito y favoritos en el mismo navegador. |
| Estados de interfaz | Mensajes de confirmación, errores y resultados vacíos. |

### 4.1. Fuera del alcance

No se implementarán:
- Inicio de sesión real.
- Pagos en línea.
- Gestión de inventario real.
- Envío de pedidos a un servidor.
- Autenticación de usuarios.
- Base de datos.
- Panel administrativo.
- Seguimiento real de domicilios.

Estos servicios necesitan infraestructura adicional y no forman parte del alcance frontend solicitado.

## 5. Arquitectura de la interfaz

La página se construirá como una tienda virtual de una sola página, con secciones navegables y componentes visuales reutilizables.

### 5.1. Secciones principales

1. **Encabezado:** marca, búsqueda, categorías, favoritos y carrito.
2. **Banner principal:** mensaje comercial, imagen de productos frescos y botón para explorar productos.
3. **Categorías:** accesos a las principales familias de productos.
4. **Productos destacados:** tarjetas con información y acción para agregar al carrito.
5. **Catálogo completo:** listado con búsqueda, filtros y ordenamiento.
6. **Carrito lateral:** artículos seleccionados, cantidades y subtotal.
7. **Pie de página:** información general y enlaces de navegación.

### 5.2. Categorías iniciales

- Frutas y verduras.
- Carnes y huevos.
- Lácteos.
- Panadería.
- Despensa.
- Bebidas.
- Aseo del hogar.

## 6. Especificación de diseño UI/UX

### 6.1. Identidad visual

Se propone una identidad fresca, limpia y cercana, utilizando el verde como color principal y tonos neutros para evitar saturar la pantalla.

| Uso | Color | Código hexadecimal |
|---|---|---|
| Marca, encabezados y botones principales | Verde oscuro | `#163D2A` |
| Acciones y elementos interactivos | Verde principal | `#2E7D4F` |
| Fondos de promociones y categorías | Verde claro | `#EAF5EC` |
| Fondo general y superficies | Blanco cálido | `#F7F8F5` |
| Promociones y etiquetas de oferta | Naranja | `#D97706` |

La tipografía recomendada es Arial, con distintos pesos para títulos, precios y descripciones. Así se evita depender de fuentes externas.

### 6.2. Encabezado

Debe incluir:
- Logotipo y nombre del supermercado.
- Buscador visible.
- Acceso a favoritos y carrito.
- Menú de navegación.
- Contador de productos en el carrito.

### 6.3. Banner principal

Debe incluir:
- Mensaje comercial breve.
- Fotografía de productos frescos.
- Botón «Explorar productos».
- Diseño visual con poco texto y jerarquía clara.

### 6.4. Categorías

Cada categoría debe ser reconocible y permitir filtrar el catálogo con un solo clic. Se pueden utilizar imágenes o iconos consistentes.

### 6.5. Tarjetas de producto

Cada tarjeta mostrará:
- Imagen del producto.
- Nombre.
- Presentación o unidad de medida.
- Precio.
- Precio anterior y etiqueta de oferta, si aplica.
- Disponibilidad simulada.
- Botón «Agregar».
- Acceso para marcar como favorito.

### 6.6. Carrito lateral

Al agregar un producto:
- Se actualizará el contador del carrito.
- Se podrá abrir un panel lateral sin abandonar el catálogo.
- Se podrán aumentar o disminuir cantidades.
- Se podrán eliminar artículos.
- Se mostrará el subtotal actualizado.
- Se mostrará un mensaje apropiado si el carrito está vacío.

### 6.7. Diseño responsive

| Dispositivo | Adaptación recomendada |
|---|---|
| Escritorio, desde 1024 px | Catálogo de 4 o 5 columnas, navegación completa y panel lateral. |
| Tableta, 768–1023 px | Catálogo de 2 o 3 columnas y navegación compacta. |
| Móvil, menos de 768 px | 2 columnas de productos, controles táctiles y menú compacto. |

Se utilizarán CSS Grid, Flexbox y media queries. No se crearán versiones separadas de la página para cada dispositivo.

### 6.8. Reglas de experiencia de usuario

- Los botones tendrán estados `hover`, `focus` y `active`.
- El usuario recibirá confirmación al agregar o eliminar productos.
- Los formularios mostrarán errores junto al campo correspondiente.
- El carrito vacío tendrá un mensaje y un acceso para volver al catálogo.
- Los filtros activos podrán identificarse y eliminarse fácilmente.
- Los controles podrán utilizarse con teclado.
- Las imágenes tendrán textos alternativos descriptivos.
- Los precios se mostrarán en pesos colombianos, por ejemplo: `$ 12.500`.
- Los descuentos y totales se calcularán mediante JavaScript.
- Se evitarán ventanas emergentes innecesarias y animaciones excesivas.

## 7. Especificación técnica del frontend

### 7.1. Tecnologías permitidas

#### HTML5 — estructura
Define la estructura semántica de la página: encabezado, navegación, secciones, catálogo, tarjetas, formularios, carrito y pie de página.

#### CSS3 — presentación
Controla colores, tipografías, dimensiones, animaciones, tarjetas, diseño responsive y estados visuales.

#### JavaScript ES6+ — comportamiento
Gestiona eventos, búsqueda, filtros, carrito, cálculos, favoritos y persistencia local.

No se utilizarán React, Angular, Vue, Bootstrap, Tailwind, bibliotecas de componentes, preprocesadores CSS ni herramientas de compilación. El proyecto podrá abrirse directamente en un navegador moderno.

### 7.2. Estructura de archivos

```text
supermercado-virtual/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── products.js
│   └── app.js
└── assets/
    └── imágenes y recursos visuales
```

### 7.3. Responsabilidades por archivo

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura semántica, contenedores y elementos accesibles. |
| `css/styles.css` | Variables CSS, diseño, tarjetas, estados y responsive. |
| `js/products.js` | Catálogo de demostración con datos uniformes. |
| `js/app.js` | Renderizado, eventos, búsqueda, filtros, carrito y persistencia. |
| `assets/` | Imágenes y recursos visuales locales. |

### 7.4. Modelo de datos de producto

Cada producto utilizará una estructura uniforme. Ejemplo:

```javascript
const producto = {
  id: 1,
  nombre: "Manzana roja",
  categoria: "Frutas",
  presentacion: "Unidad",
  precio: 2500,
  precioAnterior: null,
  imagen: "assets/manzana.jpg",
  disponible: true
};
```

Los precios serán números enteros en pesos colombianos. El campo `precioAnterior` permitirá representar promociones, y `disponible` será únicamente un estado simulado.

### 7.5. Funciones principales

El archivo `app.js` deberá organizarse alrededor de funciones con responsabilidades concretas:

- `renderProducts()`: dibuja las tarjetas de productos.
- `searchProducts()`: filtra por nombre.
- `filterByCategory()`: filtra por categoría.
- `sortProducts()`: ordena los resultados.
- `addToCart()`: agrega productos al carrito.
- `updateQuantity()`: modifica cantidades.
- `removeFromCart()`: elimina artículos.
- `calculateSubtotal()`: calcula el valor de los artículos.
- `renderCart()`: actualiza el contenido visual del carrito.
- `saveCart()`: guarda el carrito en `localStorage`.
- `loadCart()`: recupera el carrito guardado.
- `toggleFavorite()`: agrega o quita favoritos.

Estas funciones describen la organización propuesta; deberán implementarse durante el desarrollo.

## 8. Persistencia y límites de seguridad

`localStorage` permitirá conservar el carrito y los favoritos cuando se recargue la página o se cierre y vuelva a abrir el navegador.

Consideraciones:
- Los datos se guardan únicamente en el navegador del usuario.
- No se sincronizan entre dispositivos.
- Pueden eliminarse si el usuario borra los datos del navegador.
- No se almacenarán contraseñas, datos bancarios ni información sensible.
- Los precios y totales del frontend pueden modificarse desde las herramientas del navegador.

Por tanto, el proyecto será un prototipo funcional y no una plataforma lista para gestionar transacciones reales.

## 9. Accesibilidad y rendimiento

La implementación deberá cumplir los siguientes criterios:

- Utilizar etiquetas HTML semánticas.
- Asociar etiquetas con campos de búsqueda y formularios.
- Mantener contraste suficiente entre texto y fondo.
- Incorporar indicadores de foco visibles.
- Permitir utilizar los controles mediante teclado.
- Reservar dimensiones para las imágenes y utilizar carga diferida cuando corresponda.
- Evitar animaciones excesivas y respetar `prefers-reduced-motion`.
- No insertar contenido de usuario directamente con `innerHTML` sin validarlo y escaparlo adecuadamente.
- Mostrar mensajes accesibles cuando cambien los resultados o el contenido del carrito.

## 10. Plan de implementación

### Fase 1. Estructura y diseño
- Crear los archivos del proyecto.
- Definir la paleta de colores.
- Construir encabezado, banner, categorías, tarjetas y pie de página.

**Resultado:** página estática con identidad visual definida.

### Fase 2. Catálogo interactivo
- Crear el arreglo de productos.
- Renderizar las tarjetas.
- Implementar búsqueda, categorías y ordenamiento.

**Resultado:** catálogo navegable.

### Fase 3. Carrito y favoritos
- Implementar cantidades y eliminación.
- Calcular subtotal y total.
- Gestionar estados vacíos.
- Guardar datos en `localStorage`.

**Resultado:** simulación de compra funcional.

### Fase 4. Responsive y validación
- Probar tamaños de pantalla.
- Revisar navegación por teclado y accesibilidad.
- Verificar cálculos y persistencia.

**Resultado:** prototipo revisado y listo para demostración.

## 11. Criterios de aceptación

El proyecto se considerará terminado cuando:

- [ ] La página cargue correctamente en un navegador moderno.
- [ ] El catálogo muestre productos con nombre, imagen y precio.
- [ ] La búsqueda funcione y permita mostrar un estado sin resultados.
- [ ] Las categorías y el ordenamiento actualicen el catálogo.
- [ ] El carrito permita agregar, eliminar y modificar cantidades.
- [ ] Los subtotales y totales se calculen correctamente.
- [ ] El carrito y los favoritos persistan al recargar la página.
- [ ] La interfaz se adapte a escritorio, tableta y móvil.
- [ ] Los botones, formularios y mensajes sean accesibles.
- [ ] No se utilicen frameworks ni dependencias externas de frontend.

## 12. Resultado esperado

Al finalizar, tendremos un supermercado virtual con identidad visual consistente, catálogo de productos, búsqueda, filtros, promociones, favoritos y carrito funcional. Todo se ejecutará del lado del cliente utilizando HTML, CSS y JavaScript.

La especificación prioriza las tareas más importantes en un supermercado digital: encontrar productos rápidamente, entender sus precios y controlar la compra. La implementación será propia y estará inspirada en buenas prácticas de comercio electrónico y usabilidad.

**Recomendación de desarrollo:** comenzar por una página de inicio visualmente sólida y un catálogo de 15–20 productos de demostración. Después implementar el carrito y, por último, los detalles de diseño responsive y accesibilidad. Esto permite construir una experiencia de calidad sin complicar innecesariamente el código.

---

## Fuentes y referentes para consulta

- Instacart: https://www.instacart.com/
- ALDI: https://www.aldi.us/
- Baymard Institute: https://baymard.com/
- Merqueo: https://merqueo.com/
- Mercanto: https://mercanto.pro/

Los sitios anteriores se incluyen como referentes de análisis y no implican afiliación ni autorización para copiar sus diseños o contenidos.
