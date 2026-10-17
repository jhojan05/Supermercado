/**
 * Supermercado La Casona - Catálogo de productos de demostración
 * Precios en pesos colombianos (COP)
 */

const PRODUCTS = [
  // --- FRUTAS Y VERDURAS ---
  {
    id: 1,
    nombre: "Manzana Roja Royal Gala",
    categoria: "Frutas y verduras",
    presentacion: "Bolsa x 1 kg (aprox. 5 unidades)",
    precio: 7200,
    precioAnterior: 9000,
    imagen: "assets/manzana.svg",
    disponible: true,
    destacado: true,
    badge: "20% OFF",
    origen: "Boyacá, Colombia"
  },
  {
    id: 2,
    nombre: "Plátano Maduro Seleccionado",
    categoria: "Frutas y verduras",
    presentacion: "Racimo x 1 kg",
    precio: 4500,
    precioAnterior: null,
    imagen: "assets/platano.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Eje Cafetero, Colombia"
  },
  {
    id: 3,
    nombre: "Aguacate Hass Extra",
    categoria: "Frutas y verduras",
    presentacion: "Malla x 3 unidades (aprox. 600g)",
    precio: 8900,
    precioAnterior: 11000,
    imagen: "assets/aguacate.svg",
    disponible: true,
    destacado: true,
    badge: "Oferta",
    origen: "Antioquia, Colombia"
  },
  {
    id: 4,
    nombre: "Tomate Chonto Maduro",
    categoria: "Frutas y verduras",
    presentacion: "Bolsa x 1 kg",
    precio: 4800,
    precioAnterior: 5500,
    imagen: "assets/tomate.svg",
    disponible: true,
    destacado: false,
    badge: "Fresco",
    origen: "Cundinamarca, Colombia"
  },
  {
    id: 5,
    nombre: "Zanahoria Fresca Lavada",
    categoria: "Frutas y verduras",
    presentacion: "Bolsa x 1 kg",
    precio: 3600,
    precioAnterior: null,
    imagen: "assets/zanahoria.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Sabana de Bogotá"
  },

  // --- CARNES Y HUEVOS ---
  {
    id: 6,
    nombre: "Pechuga de Pollo Campesino",
    categoria: "Carnes y huevos",
    presentacion: "Bandeja x 800g (fileteada)",
    precio: 16500,
    precioAnterior: 19500,
    imagen: "assets/pollo.svg",
    disponible: true,
    destacado: true,
    badge: "15% OFF",
    origen: "Santander, Colombia"
  },
  {
    id: 7,
    nombre: "Carne Molida Especial Res 90/10",
    categoria: "Carnes y huevos",
    presentacion: "Bandeja x 500g",
    precio: 15900,
    precioAnterior: null,
    imagen: "assets/carne.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Meta, Colombia"
  },
  {
    id: 8,
    nombre: "Huevos Rojos Tipo AA",
    categoria: "Carnes y huevos",
    presentacion: "Cubeta x 30 unidades",
    precio: 18500,
    precioAnterior: 21000,
    imagen: "assets/huevos.svg",
    disponible: true,
    destacado: true,
    badge: "Ahorro",
    origen: "Granjas Cundinamarca"
  },

  // --- LÁCTEOS ---
  {
    id: 9,
    nombre: "Leche Entera Ultrapasteurizada",
    categoria: "Lácteos",
    presentacion: "Bolsa x 1100 ml",
    precio: 4600,
    precioAnterior: null,
    imagen: "assets/leche.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Valle de Ubaté"
  },
  {
    id: 10,
    nombre: "Queso Campesino Tradicional",
    categoria: "Lácteos",
    presentacion: "Bloque x 500g",
    precio: 11200,
    precioAnterior: 13500,
    imagen: "assets/queso.svg",
    disponible: true,
    destacado: true,
    badge: "Recomendado",
    origen: "Boyacá"
  },
  {
    id: 11,
    nombre: "Yogur Griego Natural Sin Azúcar",
    categoria: "Lácteos",
    presentacion: "Vaso x 1000g",
    precio: 14800,
    precioAnterior: 17200,
    imagen: "assets/yogur.svg",
    disponible: true,
    destacado: false,
    badge: "Saludable",
    origen: "Cundinamarca"
  },

  // --- PANADERÍA ---
  {
    id: 12,
    nombre: "Pan Tajado Integral con Semillas",
    categoria: "Panadería",
    presentacion: "Paquete x 550g",
    precio: 7800,
    precioAnterior: 9200,
    imagen: "assets/pan.svg",
    disponible: true,
    destacado: false,
    badge: "Fibra",
    origen: "Horneado diario"
  },
  {
    id: 13,
    nombre: "Croissants Artesanales de Mantequilla",
    categoria: "Panadería",
    presentacion: "Paquete x 4 unidades",
    precio: 8500,
    precioAnterior: null,
    imagen: "assets/croissant.svg",
    disponible: true,
    destacado: true,
    badge: "Artesanal",
    origen: "Panadería propia"
  },
  {
    id: 14,
    nombre: "Arepas de Maíz Blanco con Chía",
    categoria: "Panadería",
    presentacion: "Paquete x 5 unidades (500g)",
    precio: 4900,
    precioAnterior: null,
    imagen: "assets/arepas.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Tradición paisa"
  },

  // --- DESPENSA ---
  {
    id: 15,
    nombre: "Arroz Blanco Grano Largo Extra",
    categoria: "Despensa",
    presentacion: "Bolsa x 1000g",
    precio: 4700,
    precioAnterior: 5200,
    imagen: "assets/arroz.svg",
    disponible: true,
    destacado: false,
    badge: "Básico",
    origen: "Tolima, Colombia"
  },
  {
    id: 16,
    nombre: "Aceite Vegetal Puro 100% Girasol",
    categoria: "Despensa",
    presentacion: "Botella x 1000 ml",
    precio: 13900,
    precioAnterior: 16500,
    imagen: "assets/aceite.svg",
    disponible: true,
    destacado: true,
    badge: "15% OFF",
    origen: "Nacional"
  },
  {
    id: 17,
    nombre: "Café Especial Colombiano Tostado y Molido",
    categoria: "Despensa",
    presentacion: "Bolsa x 500g con válvula",
    precio: 22500,
    precioAnterior: 26000,
    imagen: "assets/cafe.svg",
    disponible: true,
    destacado: true,
    badge: "Premium",
    origen: "Huila, Colombia"
  },
  {
    id: 18,
    nombre: "Fríjol Bola Roja Seleccionado",
    categoria: "Despensa",
    presentacion: "Bolsa x 500g",
    precio: 6800,
    precioAnterior: null,
    imagen: "assets/frijol.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Nariño, Colombia"
  },

  // --- BEBIDAS ---
  {
    id: 19,
    nombre: "Jugo de Naranja 100% Prensado en Frío",
    categoria: "Bebidas",
    presentacion: "Botella x 1000 ml",
    precio: 8900,
    precioAnterior: 10500,
    imagen: "assets/jugo.svg",
    disponible: true,
    destacado: true,
    badge: "100% Natural",
    origen: "Cítricos del Llano"
  },
  {
    id: 20,
    nombre: "Agua Mineral de Manantial con Gas",
    categoria: "Bebidas",
    presentacion: "Botella x 1500 ml",
    precio: 3800,
    precioAnterior: null,
    imagen: "assets/agua.svg",
    disponible: true,
    destacado: false,
    badge: null,
    origen: "Manantial Andino"
  },

  // --- ASEO DEL HOGAR ---
  {
    id: 21,
    nombre: "Detergente Líquido Ropa Concentrado",
    categoria: "Aseo del hogar",
    presentacion: "Galón x 2000 ml",
    precio: 24900,
    precioAnterior: 29900,
    imagen: "assets/detergente.svg",
    disponible: true,
    destacado: true,
    badge: "Mega Ahorro",
    origen: "Biodegradable"
  },
  {
    id: 22,
    nombre: "Lavaloza en Crema con Extracto de Limón",
    categoria: "Aseo del hogar",
    presentacion: "Pote x 450g con esponja",
    precio: 5400,
    precioAnterior: 6200,
    imagen: "assets/lavaloza.svg",
    disponible: true,
    destacado: false,
    badge: "Eficaz",
    origen: "Fórmula antigrasa"
  }
];

// Categorías del sistema
const CATEGORIES = [
  { id: "all", nombre: "Todas las categorías", icon: "🛒" },
  { id: "Frutas y verduras", nombre: "Frutas y verduras", icon: "🍎" },
  { id: "Carnes y huevos", nombre: "Carnes y huevos", icon: "🥩" },
  { id: "Lácteos", nombre: "Lácteos", icon: "🥛" },
  { id: "Panadería", nombre: "Panadería", icon: "🥖" },
  { id: "Despensa", nombre: "Despensa", icon: "🌾" },
  { id: "Bebidas", nombre: "Bebidas", icon: "🧃" },
  { id: "Aseo del hogar", nombre: "Aseo del hogar", icon: "✨" }
];
