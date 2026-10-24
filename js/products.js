/**
 * Supermercado La Casona - Anorí, Antioquia
 * Catálogo oficial de productos para el hogar y la canasta familiar
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
    origen: "Selección Frutas Frescas"
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
    origen: "Región Andina"
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
    origen: "Huerta Seleccionada"
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
    origen: "Cosecha Seleccionada"
  },

  // --- CARNES Y HUEVOS ---
  {
    id: 6,
    nombre: "Pechuga de Pollo Fresca Fileteada",
    categoria: "Carnes y huevos",
    presentacion: "Bandeja x 800g (fileteada)",
    precio: 16500,
    precioAnterior: 19500,
    imagen: "assets/pollo.svg",
    disponible: true,
    destacado: true,
    badge: "15% OFF",
    origen: "Avícola Certificada"
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
    origen: "Carnes Seleccionadas"
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
    origen: "Granja Avícola"
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
    origen: "Cuenca Lechera de Antioquia"
  },
  {
    id: 10,
    nombre: "Queso Blanco Tradicional",
    categoria: "Lácteos",
    presentacion: "Bloque x 500g",
    precio: 11200,
    precioAnterior: 13500,
    imagen: "assets/queso.svg",
    disponible: true,
    destacado: true,
    badge: "Recomendado",
    origen: "Norte de Antioquia"
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
    origen: "Lácteos Especiales"
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
    badge: "Horneado Fresco",
    origen: "Panadería La Casona"
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
    origen: "Tradición Paisa"
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
    origen: "Molino Nacional"
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
    origen: "Consumo Familiar"
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
    origen: "Café de Montaña Colombiano"
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
    origen: "Granos Seleccionados"
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
    origen: "Cítricos Seleccionados"
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
    origen: "Manantial Natural"
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

// Categorías del sistema con iconografía SVG moderna (sin emojis)
const CATEGORIES = [
  { 
    id: "all", 
    nombre: "Todas las categorías", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>` 
  },
  { 
    id: "Frutas y verduras", 
    nombre: "Frutas y verduras", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a9 9 0 0 1 9 9c0 5-4 9-9 9s-9-4-9-9a9 9 0 0 1 9-9z"></path><path d="M12 2v4"></path><path d="M15 5s-1.5 2-3 2"></path></svg>` 
  },
  { 
    id: "Carnes y huevos", 
    nombre: "Carnes y huevos", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M8 12c1.5-2 3-2 4 0s2.5 2 4 0"></path></svg>` 
  },
  { 
    id: "Lácteos", 
    nombre: "Lácteos", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8v4H8z"></path><path d="M6 6h12v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6z"></path><line x1="6" y1="12" x2="18" y2="12"></line></svg>` 
  },
  { 
    id: "Panadería", 
    nombre: "Panadería", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="9" ry="6"></ellipse><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>` 
  },
  { 
    id: "Despensa", 
    nombre: "Despensa", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>` 
  },
  { 
    id: "Bebidas", 
    nombre: "Bebidas", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"></path><line x1="5" y1="9" x2="19" y2="9"></line><line x1="12" y1="13" x2="12" y2="17"></line></svg>` 
  },
  { 
    id: "Aseo del hogar", 
    nombre: "Aseo del hogar", 
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>` 
  }
];
