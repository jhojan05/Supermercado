/**
 * ==========================================================================
 * SUPERMERCADO LA CASONA - APLICACIÓN PRINCIPAL (js/app.js)
 * Arquitectura basada en ES6+, modular, accesible y persistente con localStorage.
 * Cumple en su totalidad con la sección 7.5 de la Especificación Técnica.
 * ==========================================================================
 */

// Estado global de la aplicación
const state = {
  products: typeof PRODUCTS !== "undefined" ? PRODUCTS : [],
  categories: typeof CATEGORIES !== "undefined" ? CATEGORIES : [],
  filteredProducts: [],
  cart: [],
  favorites: [],
  user: null,
  filterCategory: "all",
  searchQuery: "",
  onlyOffers: false,
  sortBy: "featured"
};

// Claves de persistencia en localStorage
const STORAGE_KEYS = {
  CART: "supermercado_casona_cart",
  FAVORITES: "supermercado_casona_favorites",
  USER: "supermercado_casona_user",
  OLD_CART: "supermercado_verde_cart",
  OLD_FAVORITES: "supermercado_verde_favorites",
  OLD_USER: "supermercado_verde_user"
};

// Usuario de demostración preconfigurado
const DEMO_USER = {
  id: "usr_demo_1",
  nombre: "Carlos Restrepo",
  email: "carlos.restrepo@correo.com",
  telefono: "312 456 7890",
  pedidos: [
    {
      codigo: "ORDEN #LC-2026-3819",
      fecha: "12 Oct 2026",
      total: 42800,
      estado: "Confirmado",
      items: "Manzana Roja x2, Leche Entera x2, Arepas x1"
    }
  ]
};

/**
 * Formateador de moneda en pesos colombianos (COP)
 * Ejemplo: 12500 -> "$ 12.500"
 */
function formatCOP(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "$ 0";
  return "$ " + Math.round(amount).toLocaleString("es-CO");
}

/**
 * Escapar texto para prevenir inserción insegura
 */
function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================================================================
   1. INICIALIZACIÓN DE LA APLICACIÓN
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  loadUser();
  loadFavorites();
  loadCart();
  renderCategories();
  applyFiltersAndSort();
  bindEvents();
  updateBadges();
  updateUserUI();
}

/* ==========================================================================
   2. RENDERIZADO DE CATEGORÍAS (Sección 6.4)
   ========================================================================== */
function renderCategories() {
  const container = document.getElementById("categories-container");
  if (!container) return;

  container.innerHTML = state.categories.map(cat => {
    const isActive = state.filterCategory === cat.id;
    return `
      <button 
        type="button" 
        class="category-chip ${isActive ? 'active' : ''}" 
        data-category-id="${escapeHTML(cat.id)}"
        role="tab"
        aria-selected="${isActive ? 'true' : 'false'}"
      >
        <span class="category-icon" aria-hidden="true">${cat.icon}</span>
        <span class="category-name">${escapeHTML(cat.nombre)}</span>
      </button>
    `;
  }).join("");

  // Event delegation para los chips de categoría
  container.querySelectorAll(".category-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const catId = btn.getAttribute("data-category-id");
      filterByCategory(catId);
    });
  });
}

/* ==========================================================================
   3. FILTRADO, BÚSQUEDA Y ORDENAMIENTO (Sección 7.5)
   ========================================================================== */

/**
 * Filtra por categoría
 */
function filterByCategory(category) {
  state.filterCategory = category;
  renderCategories();
  applyFiltersAndSort();
}

/**
 * Filtra por término de búsqueda en nombre y categoría
 */
function searchProducts(query) {
  state.searchQuery = (query || "").trim().toLowerCase();
  
  const clearBtn = document.getElementById("clear-search-btn");
  if (clearBtn) {
    clearBtn.hidden = state.searchQuery.length === 0;
  }
  
  applyFiltersAndSort();
}

/**
 * Ordena el arreglo de productos según el criterio seleccionado
 */
function sortProducts(criteria, items) {
  const sorted = [...items];
  switch (criteria) {
    case "price-asc":
      return sorted.sort((a, b) => a.precio - b.precio);
    case "price-desc":
      return sorted.sort((a, b) => b.precio - a.precio);
    case "name-asc":
      return sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    case "name-desc":
      return sorted.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
    case "featured":
    default:
      // Priorizar destacados y ofertas
      return sorted.sort((a, b) => {
        if (a.destacado === b.destacado) {
          const discountA = a.precioAnterior ? (a.precioAnterior - a.precio) : 0;
          const discountB = b.precioAnterior ? (b.precioAnterior - b.precio) : 0;
          return discountB - discountA;
        }
        return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0);
      });
  }
}

/**
 * Aplica todos los filtros activos y dispara el renderizado
 */
function applyFiltersAndSort() {
  let result = state.products;

  // 1. Filtro por categoría
  if (state.filterCategory && state.filterCategory !== "all") {
    result = result.filter(p => p.categoria === state.filterCategory);
  }

  // 2. Filtro por búsqueda
  if (state.searchQuery) {
    const q = state.searchQuery;
    result = result.filter(p => 
      p.nombre.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q) ||
      (p.origen && p.origen.toLowerCase().includes(q))
    );
  }

  // 3. Filtro por ofertas
  if (state.onlyOffers) {
    result = result.filter(p => p.precioAnterior && p.precioAnterior > p.precio);
  }

  // 4. Ordenamiento
  state.filteredProducts = sortProducts(state.sortBy, result);

  // 5. Renderizado
  renderProducts(state.filteredProducts);
  updateToolbarStatus();
}

/**
 * Actualiza el indicador de resultados y filtro activo
 */
function updateToolbarStatus() {
  const countEl = document.getElementById("catalog-count");
  if (countEl) {
    countEl.innerHTML = `Mostrando <strong>${state.filteredProducts.length}</strong> de ${state.products.length} productos`;
  }

  const badgeContainer = document.getElementById("active-filter-container");
  if (!badgeContainer) return;

  const badges = [];

  if (state.filterCategory !== "all") {
    badges.push(`
      <span class="active-filter-badge">
        <span>${escapeHTML(state.filterCategory)}</span>
        <button type="button" onclick="app.setCategory('all')" aria-label="Quitar filtro de categoría">&times;</button>
      </span>
    `);
  }

  if (state.searchQuery) {
    badges.push(`
      <span class="active-filter-badge">
        <span>Búsqueda: "${escapeHTML(state.searchQuery)}"</span>
        <button type="button" onclick="app.clearSearch()" aria-label="Limpiar búsqueda">&times;</button>
      </span>
    `);
  }

  if (state.onlyOffers) {
    badges.push(`
      <span class="active-filter-badge">
        <span>Solo ofertas</span>
        <button type="button" onclick="app.toggleOffersFilter()" aria-label="Quitar filtro de ofertas">&times;</button>
      </span>
    `);
  }

  badgeContainer.innerHTML = badges.join("");
}

/* ==========================================================================
   4. RENDERIZADO DE PRODUCTOS (Sección 6.5 y 7.5)
   ========================================================================== */

/**
 * Dibuja las tarjetas de productos en el catálogo
 */
function renderProducts(productsToRender) {
  const grid = document.getElementById("products-grid");
  const emptyState = document.getElementById("empty-state");
  if (!grid) return;

  if (!productsToRender || productsToRender.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  grid.innerHTML = productsToRender.map(product => {
    const isFav = state.favorites.includes(product.id);
    const hasDiscount = product.precioAnterior && product.precioAnterior > product.precio;
    const savings = hasDiscount ? (product.precioAnterior - product.precio) : 0;
    const discountPercent = hasDiscount ? Math.round((savings / product.precioAnterior) * 100) : 0;

    return `
      <article class="product-card" data-product-id="${product.id}" aria-labelledby="product-title-${product.id}">
        <!-- Barra superior con insignias y botón favorito -->
        <div class="card-header-bar">
          <div class="card-badges">
            ${hasDiscount ? `<span class="badge-offer">${product.badge || `${discountPercent}% OFF`}</span>` : ''}
            ${product.destacado && !hasDiscount ? `<span class="badge-status">⭐ Destacado</span>` : ''}
          </div>
          <button 
            type="button" 
            class="fav-btn ${isFav ? 'favorited' : ''}" 
            data-fav-id="${product.id}"
            aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'} ${escapeHTML(product.nombre)}"
          >
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <!-- Imagen del producto -->
        <div class="product-media">
          <img 
            src="${escapeHTML(product.imagen)}" 
            alt="${escapeHTML(product.nombre)}" 
            class="product-img" 
            loading="lazy"
            width="160"
            height="160"
          >
        </div>

        <!-- Contenido y detalles -->
        <div class="product-content">
          <span class="product-category-tag">${escapeHTML(product.categoria)}</span>
          <h3 id="product-title-${product.id}" class="product-name" title="${escapeHTML(product.nombre)}">
            ${escapeHTML(product.nombre)}
          </h3>
          <p class="product-unit">${escapeHTML(product.presentacion)}</p>
          ${product.origen ? `<p class="product-origin"><span>📍</span> ${escapeHTML(product.origen)}</p>` : ''}

          <!-- Precios en COP -->
          <div class="product-price-block">
            <span class="product-current-price">${formatCOP(product.precio)}</span>
            ${hasDiscount ? `<span class="product-old-price">${formatCOP(product.precioAnterior)}</span>` : ''}
            ${hasDiscount ? `<span class="product-savings">Ahorras ${formatCOP(savings)}</span>` : ''}
          </div>

          <!-- Acciones: selector de cantidad y botón agregar -->
          <div class="product-action-row">
            <div class="qty-control" aria-label="Cantidad para ${escapeHTML(product.nombre)}">
              <button type="button" class="qty-btn" data-card-qty-minus="${product.id}" aria-label="Disminuir">-</button>
              <span class="qty-value" id="card-qty-${product.id}">1</span>
              <button type="button" class="qty-btn" data-card-qty-plus="${product.id}" aria-label="Aumentar">+</button>
            </div>
            <button 
              type="button" 
              class="add-to-cart-btn" 
              data-add-id="${product.id}"
              aria-label="Agregar ${escapeHTML(product.nombre)} al carrito"
            >
              <span>Agregar</span>
              <span aria-hidden="true">🛒</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindProductCardEvents();
}

/**
 * Asigna eventos a los elementos dinámicos de cada tarjeta
 */
function bindProductCardEvents() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  // Favoritos
  grid.querySelectorAll("[data-fav-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.getAttribute("data-fav-id"), 10);
      toggleFavorite(id);
    });
  });

  // Incremento / Decremento de cantidad en tarjeta
  grid.querySelectorAll("[data-card-qty-minus]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-card-qty-minus");
      const valEl = document.getElementById(`card-qty-${id}`);
      if (valEl) {
        let current = parseInt(valEl.textContent, 10) || 1;
        if (current > 1) valEl.textContent = current - 1;
      }
    });
  });

  grid.querySelectorAll("[data-card-qty-plus]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-card-qty-plus");
      const valEl = document.getElementById(`card-qty-${id}`);
      if (valEl) {
        let current = parseInt(valEl.textContent, 10) || 1;
        if (current < 99) valEl.textContent = current + 1;
      }
    });
  });

  // Agregar al carrito
  grid.querySelectorAll("[data-add-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-add-id"), 10);
      const valEl = document.getElementById(`card-qty-${id}`);
      const quantity = valEl ? parseInt(valEl.textContent, 10) : 1;
      addToCart(id, quantity);

      // Microanimación de confirmación
      btn.classList.add("added-feedback");
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span>¡Listo!</span> <span aria-hidden="true">✓</span>`;
      setTimeout(() => {
        btn.classList.remove("added-feedback");
        btn.innerHTML = originalText;
        if (valEl) valEl.textContent = "1"; // Reset quantity counter
      }, 900);
    });
  });
}

/* ==========================================================================
   5. CARRITO DE COMPRAS (Sección 6.6 y 7.5)
   ========================================================================== */

/**
 * Agrega un producto al carrito o incrementa su cantidad
 */
function addToCart(productId, quantity = 1) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    state.cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      precioAnterior: product.precioAnterior,
      presentacion: product.presentacion,
      imagen: product.imagen,
      categoria: product.categoria,
      quantity: quantity
    });
  }

  saveCart();
  renderCart();
  updateBadges();
  showToast(`¡Agregaste ${quantity}x ${product.nombre} al carrito!`, "success");
}

/**
 * Modifica la cantidad de un artículo existente en el carrito
 */
function updateQuantity(productId, delta) {
  const itemIndex = state.cart.findIndex(item => item.id === productId);
  if (itemIndex === -1) return;

  state.cart[itemIndex].quantity += delta;

  if (state.cart[itemIndex].quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
  updateBadges();
}

/**
 * Elimina completamente un artículo del carrito
 */
function removeFromCart(productId) {
  const item = state.cart.find(i => i.id === productId);
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
  updateBadges();

  if (item) {
    showToast(`Eliminaste ${item.nombre} del carrito`, "info");
  }
}

/**
 * Vacía completamente el carrito
 */
function clearCart() {
  if (state.cart.length === 0) return;
  if (confirm("¿Estás seguro de que deseas vaciar tu carrito de compras?")) {
    state.cart = [];
    saveCart();
    renderCart();
    updateBadges();
    showToast("Tu carrito ha sido vaciado", "info");
  }
}

/**
 * Calcula el subtotal del carrito
 */
function calculateSubtotal() {
  return state.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
}

/**
 * Calcula el total del pedido
 */
function calculateTotal() {
  const subtotal = calculateSubtotal();
  if (subtotal === 0) return { subtotal: 0, total: 0, discount: 0 };
  return { subtotal, total: subtotal, discount: 0 };
}

/**
 * Actualiza el contenido visual del carrito lateral
 */
function renderCart() {
  const listEl = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-open-btn");
  const clearBtn = document.getElementById("clear-cart-btn");
  const drawerCount = document.getElementById("drawer-item-count");

  if (!listEl) return;

  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (drawerCount) drawerCount.textContent = totalCount;

  const { subtotal, total } = calculateTotal();

  // Si el carrito está vacío
  if (state.cart.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px; border: none;">
        <span class="empty-state-icon" aria-hidden="true">🛒</span>
        <h3 class="empty-state-title" style="font-size: 1.15rem;">Tu carrito está vacío</h3>
        <p class="empty-state-text" style="font-size: 0.88rem;">Explora nuestros productos frescos y agrégalos a tu carrito.</p>
        <button type="button" class="btn btn-primary" onclick="app.closeCart(); location.href='#catalogo';">
          Empezar a comprar
        </button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatCOP(0);
    if (totalEl) totalEl.textContent = formatCOP(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

  if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
  if (totalEl) totalEl.textContent = formatCOP(total);
  if (checkoutBtn) checkoutBtn.disabled = false;
  if (clearBtn) clearBtn.style.display = "block";

  // Renderizar artículos
  listEl.innerHTML = state.cart.map(item => {
    const itemSubtotal = item.precio * item.quantity;
    return `
      <div class="cart-item" data-cart-id="${item.id}">
        <img src="${escapeHTML(item.imagen)}" alt="${escapeHTML(item.nombre)}" class="cart-item-img">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${escapeHTML(item.nombre)}</h4>
          <p class="cart-item-unit">${escapeHTML(item.presentacion)}</p>
          <div class="cart-item-price">${formatCOP(item.precio)}</div>
        </div>
        <div class="cart-item-actions">
          <div class="cart-qty-control" aria-label="Cantidad">
            <button type="button" class="cart-qty-btn" onclick="app.updateQuantity(${item.id}, -1)" aria-label="Disminuir">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button type="button" class="cart-qty-btn" onclick="app.updateQuantity(${item.id}, 1)" aria-label="Aumentar">+</button>
          </div>
          <button 
            type="button" 
            class="cart-item-remove" 
            onclick="app.removeFromCart(${item.id})"
            aria-label="Eliminar ${escapeHTML(item.nombre)} del carrito"
            title="Eliminar artículo"
          >
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (subtotalEl) subtotalEl.textContent = formatCOP(subtotal);
  if (totalEl) totalEl.textContent = formatCOP(total);
}

/**
 * Guarda el carrito en localStorage (Sección 8)
 */
function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  } catch (e) {
    console.warn("No se pudo guardar el carrito en localStorage", e);
  }
}

/**
 * Recupera el carrito guardado en localStorage
 */
function loadCart() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CART) || localStorage.getItem(STORAGE_KEYS.OLD_CART);
    if (data) {
      state.cart = JSON.parse(data);
    }
  } catch (e) {
    state.cart = [];
  }
}

/* ==========================================================================
   6. FAVORITOS (Sección 7.5 y 8)
   ========================================================================== */

/**
 * Agrega o quita un producto de favoritos
 */
function toggleFavorite(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const index = state.favorites.indexOf(productId);
  let isFav = false;

  if (index === -1) {
    state.favorites.push(productId);
    isFav = true;
    showToast(`Guardaste ${product.nombre} en favoritos ❤️`, "info");
  } else {
    state.favorites.splice(index, 1);
    isFav = false;
    showToast(`Quitaste ${product.nombre} de favoritos`, "info");
  }

  saveFavorites();
  updateBadges();
  renderProducts(state.filteredProducts);
  renderFavoritesModal();
}

/**
 * Guarda los favoritos en localStorage
 */
function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
  } catch (e) {
    console.warn("No se pudo guardar favoritos", e);
  }
}

/**
 * Carga los favoritos de localStorage
 */
function loadFavorites() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES) || localStorage.getItem(STORAGE_KEYS.OLD_FAVORITES);
    if (data) {
      state.favorites = JSON.parse(data);
    }
  } catch (e) {
    state.favorites = [];
  }
}

/**
 * Renderiza el modal de favoritos
 */
function renderFavoritesModal() {
  const container = document.getElementById("favorites-body");
  if (!container) return;

  const favoriteProducts = state.products.filter(p => state.favorites.includes(p.id));

  if (favoriteProducts.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 30px 10px; border: none;">
        <span class="empty-state-icon" aria-hidden="true">❤️</span>
        <h3 class="empty-state-title" style="font-size: 1.15rem;">No tienes favoritos guardados</h3>
        <p class="empty-state-text" style="font-size: 0.88rem;">Haz clic en el corazón de cualquier producto para guardarlo aquí y comprarlo fácilmente.</p>
        <button type="button" class="btn btn-primary" onclick="app.closeFavorites(); location.href='#catalogo';">
          Explorar productos
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${favoriteProducts.map(p => `
        <div style="display: flex; gap: 12px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--color-border);">
          <img src="${escapeHTML(p.imagen)}" alt="${escapeHTML(p.nombre)}" style="width: 56px; height: 56px; object-fit: contain; background: var(--color-bg-warm); border-radius: 8px; padding: 4px;">
          <div style="flex: 1; min-width: 0;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--color-primary-dark); margin-bottom: 2px;">${escapeHTML(p.nombre)}</h4>
            <p style="font-size: 0.8rem; color: var(--color-text-muted);">${escapeHTML(p.presentacion)}</p>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--color-primary);">${formatCOP(p.precio)}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              type="button" 
              class="btn btn-primary" 
              style="padding: 8px 14px; font-size: 0.82rem;" 
              onclick="app.addToCart(${p.id}, 1); app.showToast('¡Agregado al carrito!', 'success');"
            >
              + Carrito
            </button>
            <button 
              type="button" 
              style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--color-danger);" 
              onclick="app.toggleFavorite(${p.id})"
              title="Quitar de favoritos"
            >
              ✕
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* ==========================================================================
   7. CONTROL DE INTERFAZ, MODALES Y TOASTS
   ========================================================================== */

function updateBadges() {
  const cartBadge = document.getElementById("cart-badge-count");
  const favBadge = document.getElementById("fav-badge-count");

  const totalCartItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cartBadge) {
    cartBadge.textContent = totalCartItems;
    cartBadge.style.display = totalCartItems > 0 ? "inline-flex" : "none";
  }

  if (favBadge) {
    favBadge.textContent = state.favorites.length;
    favBadge.style.display = state.favorites.length > 0 ? "inline-flex" : "none";
  }
}

/**
 * Abre el panel lateral del carrito
 */
function openCart() {
  const drawer = document.getElementById("cart-drawer");
  const backdrop = document.getElementById("cart-backdrop");
  if (drawer && backdrop) {
    renderCart();
    drawer.classList.add("open");
    backdrop.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

/**
 * Cierra el panel lateral del carrito
 */
function closeCart() {
  const drawer = document.getElementById("cart-drawer");
  const backdrop = document.getElementById("cart-backdrop");
  if (drawer && backdrop) {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Abre el modal de favoritos
 */
function openFavorites() {
  const modal = document.getElementById("favorites-modal");
  if (modal) {
    renderFavoritesModal();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

/**
 * Cierra el modal de favoritos
 */
function closeFavorites() {
  const modal = document.getElementById("favorites-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Abre el modal de checkout simulado
 */
function openCheckout() {
  if (state.cart.length === 0) {
    showToast("Tu carrito está vacío. Agrega productos primero.", "info");
    return;
  }

  closeCart();

  const modal = document.getElementById("checkout-modal");
  const formContainer = document.getElementById("checkout-form-container");
  const successContainer = document.getElementById("checkout-success-container");
  const modalTotal = document.getElementById("checkout-modal-total");

  const { total } = calculateTotal();
  if (modalTotal) modalTotal.textContent = formatCOP(total);

  // Autocompletar datos del usuario si ha iniciado sesión
  if (state.user) {
    const nameInput = document.getElementById("checkout-name");
    const phoneInput = document.getElementById("checkout-phone");
    if (nameInput) nameInput.value = state.user.nombre || "";
    if (phoneInput) phoneInput.value = state.user.telefono || "";
  }

  if (formContainer) formContainer.style.display = "block";
  if (successContainer) successContainer.style.display = "none";

  if (modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

/**
 * Cierra el modal de checkout simulado
 */
function closeCheckout() {
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Procesa la confirmación de checkout
 */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("checkout-name");
  const phoneInput = document.getElementById("checkout-phone");
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  const notesInput = document.getElementById("checkout-notes");

  const formContainer = document.getElementById("checkout-form-container");
  const successContainer = document.getElementById("checkout-success-container");
  const orderCodeDisplay = document.getElementById("order-code-display");
  const summaryDetails = document.getElementById("order-summary-details");

  const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `ORDEN #LC-2026-${randomOrderNum}`;

  const { total } = calculateTotal();

  const clientName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Cliente";
  const clientPhone = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : "";
  const paymentText = paymentMethod ? paymentMethod.value : "Efectivo en caja";

  if (orderCodeDisplay) orderCodeDisplay.textContent = orderCode;
  if (summaryDetails) {
    summaryDetails.textContent = `A nombre de ${clientName}${clientPhone ? ' • Tel: ' + clientPhone : ''} • Forma de pago: ${paymentText}. Tu pedido ha sido preparado en nuestro sistema.`;
  }

  if (formContainer) formContainer.style.display = "none";
  if (successContainer) successContainer.style.display = "block";

  // Si hay usuario autenticado, guardar en su historial de pedidos
  if (state.user) {
    if (!state.user.pedidos) state.user.pedidos = [];
    state.user.pedidos.unshift({
      codigo: orderCode,
      fecha: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }),
      total: total,
      estado: "Confirmado",
      items: state.cart.map(i => `${i.nombre} x${i.quantity}`).join(", ")
    });
    saveUser();
  }

  // Vaciar carrito tras simulación exitosa
  state.cart = [];
  saveCart();
  renderCart();
  updateBadges();

  showToast("¡Pedido confirmado con éxito!", "success");
}

/* ==========================================================================
   7.1. GESTIÓN DE SESIÓN DE USUARIO Y MODALES DE LOGIN
   ========================================================================== */

/**
 * Carga el usuario desde localStorage
 */
function loadUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER) || localStorage.getItem(STORAGE_KEYS.OLD_USER);
    if (data) {
      state.user = JSON.parse(data);
    }
  } catch (e) {
    state.user = null;
  }
}

/**
 * Guarda el usuario en localStorage
 */
function saveUser() {
  try {
    if (state.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch (e) {
    console.warn("No se pudo guardar el usuario en localStorage", e);
  }
}

/**
 * Inicia sesión con los datos de usuario
 */
function loginUser(userData) {
  state.user = userData;
  saveUser();
  updateUserUI();
  closeLoginModal();
  showToast(`¡Bienvenido, ${userData.nombre.split(" ")[0]}! 👋`, "success");
}

/**
 * Cierra la sesión activa
 */
function logoutUser() {
  const firstName = state.user ? state.user.nombre.split(" ")[0] : "Usuario";
  state.user = null;
  saveUser();
  updateUserUI();
  closeUserDropdown();
  closeProfileModal();
  showToast(`Sesión cerrada. ¡Hasta pronto, ${firstName}!`, "info");
}

/**
 * Actualiza todos los elementos de la interfaz relacionados al usuario
 */
function updateUserUI() {
  const navLoginText = document.getElementById("nav-login-text");
  const navLoginBtn = document.getElementById("nav-login-btn");
  const dropdownAvatar = document.getElementById("dropdown-avatar");
  const dropdownName = document.getElementById("dropdown-name");
  const dropdownEmail = document.getElementById("dropdown-email");

  if (state.user) {
    const firstName = state.user.nombre.split(" ")[0];
    const initials = state.user.nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join("");

    if (navLoginText) navLoginText.textContent = firstName;
    if (navLoginBtn) {
      navLoginBtn.classList.add("logged-in");
      navLoginBtn.setAttribute("aria-label", `Mi Cuenta (${state.user.nombre})`);
    }
    if (dropdownAvatar) dropdownAvatar.textContent = initials || "CR";
    if (dropdownName) dropdownName.textContent = state.user.nombre;
    if (dropdownEmail) dropdownEmail.textContent = state.user.email;
  } else {
    if (navLoginText) navLoginText.textContent = "Iniciar sesión";
    if (navLoginBtn) {
      navLoginBtn.classList.remove("logged-in");
      navLoginBtn.setAttribute("aria-label", "Iniciar sesión");
    }
  }
}

/**
 * Abre el modal de inicio de sesión o registro
 */
function openLoginModal(tab = "login") {
  closeUserDropdown();
  const modal = document.getElementById("login-modal");
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegBtn = document.getElementById("tab-register-btn");
  const panelLogin = document.getElementById("auth-login-panel");
  const panelReg = document.getElementById("auth-register-panel");

  if (!modal) return;

  if (tab === "register") {
    if (tabLoginBtn) tabLoginBtn.classList.remove("active");
    if (tabRegBtn) tabRegBtn.classList.add("active");
    if (panelLogin) panelLogin.style.display = "none";
    if (panelReg) panelReg.style.display = "block";
  } else {
    if (tabLoginBtn) tabLoginBtn.classList.add("active");
    if (tabRegBtn) tabRegBtn.classList.remove("active");
    if (panelLogin) panelLogin.style.display = "block";
    if (panelReg) panelReg.style.display = "none";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

/**
 * Cierra el modal de inicio de sesión
 */
function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Abre / cierra el menú desplegable del usuario
 */
function toggleUserDropdown() {
  const menu = document.getElementById("user-dropdown-menu");
  const btn = document.getElementById("nav-login-btn");
  if (!menu) return;

  const isOpen = menu.classList.contains("open");
  if (isOpen) {
    closeUserDropdown();
  } else {
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
    if (btn) btn.setAttribute("aria-expanded", "true");
  }
}

function closeUserDropdown() {
  const menu = document.getElementById("user-dropdown-menu");
  const btn = document.getElementById("nav-login-btn");
  if (menu) {
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  }
  if (btn) btn.setAttribute("aria-expanded", "false");
}

/**
 * Abre el modal de perfil
 */
function openProfileModal() {
  closeUserDropdown();
  const modal = document.getElementById("profile-modal");
  if (modal) {
    renderProfileModal();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

/**
 * Cierra el modal de perfil
 */
function closeProfileModal() {
  const modal = document.getElementById("profile-modal");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

/**
 * Renderiza el modal de perfil y pedidos del usuario
 */
function renderProfileModal() {
  const body = document.getElementById("profile-modal-body");
  if (!body) return;

  if (!state.user) {
    body.innerHTML = `
      <div class="empty-state" style="padding: 30px 10px; border: none;">
        <span class="empty-state-icon" aria-hidden="true">👤</span>
        <h3 class="empty-state-title" style="font-size: 1.15rem;">No has iniciado sesión</h3>
        <p class="empty-state-text" style="font-size: 0.88rem;">Inicia sesión para consultar tus datos guardados y el historial de compras.</p>
        <button type="button" class="btn btn-primary" onclick="app.closeProfileModal(); app.openLoginModal('login');">
          Iniciar sesión
        </button>
      </div>
    `;
    return;
  }

  const initials = state.user.nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");

  const orders = state.user.pedidos || [];

  body.innerHTML = `
    <div>
      <div class="profile-card-header">
        <div class="profile-avatar-large">${escapeHTML(initials)}</div>
        <div class="profile-info-block">
          <strong>${escapeHTML(state.user.nombre)}</strong>
          <span>${escapeHTML(state.user.email)}</span>
          ${state.user.telefono ? `<span style="display: block; margin-top: 4px; font-size: 0.84rem; color: var(--color-text-muted);">📞 ${escapeHTML(state.user.telefono)}</span>` : ""}
        </div>
      </div>

      <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--color-primary-dark); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <span>Historial de pedidos registrados</span>
        <span class="badge-status">${orders.length} pedidos</span>
      </h3>

      ${orders.length === 0 ? `
        <p style="font-size: 0.88rem; color: var(--color-text-muted); padding: 12px 0;">Aún no has simulado pedidos con esta cuenta.</p>
      ` : `
        <div class="profile-orders-list">
          ${orders.map(o => `
            <div class="profile-order-card">
              <div class="profile-order-header">
                <strong style="color: var(--color-primary-dark); font-family: monospace;">${escapeHTML(o.codigo)}</strong>
                <span class="badge-offer" style="background-color: var(--color-primary); font-size: 0.7rem;">${escapeHTML(o.estado)}</span>
              </div>
              <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 6px;">
                ${escapeHTML(o.items)}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                <span style="color: var(--color-text-light); font-size: 0.78rem;">Fecha: ${escapeHTML(o.fecha)}</span>
                <strong style="color: var(--color-primary-dark); font-size: 0.95rem;">Total: ${formatCOP(o.total)}</strong>
              </div>
            </div>
          `).join("")}
        </div>
      `}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-secondary" onclick="app.closeProfileModal();" style="color: var(--color-text-main); border-color: var(--color-border);">
          Cerrar
        </button>
        <button type="button" class="btn btn-primary" onclick="app.logoutUser();" style="background-color: var(--color-danger); border-color: var(--color-danger);">
          <span>Cerrar sesión</span>
          <span aria-hidden="true">🚪</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Muestra notificación toast accesible
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");

  const icon = type === "success" ? "✓" : "ℹ";
  toast.innerHTML = `<span aria-hidden="true" style="font-weight: bold;">${icon}</span> <span>${escapeHTML(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3200);
}

/* ==========================================================================
   8. VINCULACIÓN DE EVENTOS (LISTENERS)
   ========================================================================== */
function bindEvents() {
  // Buscador central con debounce
  const searchInput = document.getElementById("search-input");
  const clearSearchBtn = document.getElementById("clear-search-btn");

  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchProducts(e.target.value);
      }, 250);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      searchProducts("");
      if (searchInput) searchInput.focus();
    });
  }

  // Toggle de búsqueda móvil
  const mobileSearchToggle = document.getElementById("mobile-search-toggle");
  const headerSearch = document.getElementById("header-search");
  if (mobileSearchToggle && headerSearch) {
    mobileSearchToggle.addEventListener("click", () => {
      headerSearch.classList.toggle("mobile-active");
      if (headerSearch.classList.contains("mobile-active") && searchInput) {
        searchInput.focus();
      }
    });
  }

  // Botones de filtro rápido de ofertas
  const heroOffersBtn = document.getElementById("hero-offers-btn");
  const filterOffersBtn = document.getElementById("filter-offers-btn");
  const filterOffersNav = document.getElementById("filter-offers-nav");

  const toggleOffers = () => {
    state.onlyOffers = !state.onlyOffers;
    if (filterOffersBtn) {
      filterOffersBtn.classList.toggle("active", state.onlyOffers);
      filterOffersBtn.setAttribute("aria-pressed", state.onlyOffers ? "true" : "false");
    }
    applyFiltersAndSort();
    location.href = "#catalogo";
  };

  if (heroOffersBtn) heroOffersBtn.addEventListener("click", toggleOffers);
  if (filterOffersBtn) filterOffersBtn.addEventListener("click", toggleOffers);
  if (filterOffersNav) filterOffersNav.addEventListener("click", toggleOffers);

  // Selector de ordenamiento
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      applyFiltersAndSort();
    });
  }

  // Botón reset de filtros en empty state
  const resetBtn = document.getElementById("reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.filterCategory = "all";
      state.searchQuery = "";
      state.onlyOffers = false;
      state.sortBy = "featured";
      if (searchInput) searchInput.value = "";
      if (sortSelect) sortSelect.value = "featured";
      if (filterOffersBtn) filterOffersBtn.classList.remove("active");
      renderCategories();
      applyFiltersAndSort();
    });
  }

  // Eventos de usuario y autenticación (Login en barra de navegación y cabecera)
  const navLoginBtn = document.getElementById("nav-login-btn");
  const headerUserBtn = document.getElementById("header-user-btn");
  const closeLoginBtn = document.getElementById("close-login-btn");
  const loginModal = document.getElementById("login-modal");
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegisterBtn = document.getElementById("tab-register-btn");
  const btnQuickDemo = document.getElementById("btn-quick-demo");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const toggleLoginPass = document.getElementById("toggle-login-pass");
  const toggleRegPass = document.getElementById("toggle-reg-pass");
  const btnForgotPass = document.getElementById("btn-forgot-password");

  // Único botón de acceso / login en el menú de navegación
  if (navLoginBtn) {
    navLoginBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.user) {
        toggleUserDropdown();
      } else {
        openLoginModal("login");
      }
    });
  }

  // Cierre de modal de login
  if (closeLoginBtn) closeLoginBtn.addEventListener("click", closeLoginModal);
  if (loginModal) {
    loginModal.addEventListener("click", (e) => {
      if (e.target === loginModal) closeLoginModal();
    });
  }

  // Pestañas Iniciar sesión / Crear cuenta
  if (tabLoginBtn) tabLoginBtn.addEventListener("click", () => openLoginModal("login"));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener("click", () => openLoginModal("register"));

  // Acceso rápido con usuario demo
  if (btnQuickDemo) {
    btnQuickDemo.addEventListener("click", () => {
      loginUser(DEMO_USER);
    });
  }

  // Enviar formulario de inicio de sesión
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("login-email");
      const email = emailInput ? emailInput.value.trim() : "cliente@correo.com";
      const nameGuess = email.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);

      loginUser({
        id: "usr_" + Date.now(),
        nombre: formattedName,
        email: email,
        telefono: "310 123 4567",
        pedidos: []
      });
    });
  }

  // Enviar formulario de registro
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const phone = document.getElementById("reg-phone").value.trim();

      loginUser({
        id: "usr_" + Date.now(),
        nombre: name,
        email: email,
        telefono: phone,
        pedidos: []
      });
    });
  }

  // Mostrar / Ocultar contraseñas
  if (toggleLoginPass) {
    toggleLoginPass.addEventListener("click", () => {
      const input = document.getElementById("login-password");
      if (input) {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        toggleLoginPass.textContent = isPass ? "🙈" : "👁️";
      }
    });
  }

  if (toggleRegPass) {
    toggleRegPass.addEventListener("click", () => {
      const input = document.getElementById("reg-password");
      if (input) {
        const isPass = input.type === "password";
        input.type = isPass ? "text" : "password";
        toggleRegPass.textContent = isPass ? "🙈" : "👁️";
      }
    });
  }

  // Olvidé mi contraseña simulado
  if (btnForgotPass) {
    btnForgotPass.addEventListener("click", () => {
      showToast("Hemos enviado un enlace de recuperación simulado a tu correo", "info");
    });
  }

  // Menú desplegable del usuario
  const btnDropdownProfile = document.getElementById("btn-dropdown-profile");
  const btnDropdownOrders = document.getElementById("btn-dropdown-orders");
  const btnDropdownLogout = document.getElementById("btn-dropdown-logout");
  const closeProfileBtn = document.getElementById("close-profile-btn");
  const profileModal = document.getElementById("profile-modal");

  if (btnDropdownProfile) btnDropdownProfile.addEventListener("click", openProfileModal);
  if (btnDropdownOrders) btnDropdownOrders.addEventListener("click", openProfileModal);
  if (btnDropdownLogout) btnDropdownLogout.addEventListener("click", logoutUser);
  if (closeProfileBtn) closeProfileBtn.addEventListener("click", closeProfileModal);
  if (profileModal) {
    profileModal.addEventListener("click", (e) => {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  // Cerrar dropdown si se hace clic fuera
  document.addEventListener("click", (e) => {
    const userWrapper = document.getElementById("user-menu-wrapper");
    if (userWrapper && !userWrapper.contains(e.target)) {
      closeUserDropdown();
    }
  });

  // Eventos de apertura / cierre del carrito
  const cartToggleBtn = document.getElementById("cart-toggle-btn");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartBackdrop = document.getElementById("cart-backdrop");
  const clearCartBtn = document.getElementById("clear-cart-btn");

  if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);
  if (clearCartBtn) clearCartBtn.addEventListener("click", clearCart);

  // Eventos de favoritos
  const favToggleBtn = document.getElementById("fav-toggle-btn");
  const closeFavBtn = document.getElementById("close-fav-btn");
  const favoritesModal = document.getElementById("favorites-modal");

  if (favToggleBtn) favToggleBtn.addEventListener("click", openFavorites);
  if (closeFavBtn) closeFavBtn.addEventListener("click", closeFavorites);
  if (favoritesModal) {
    favoritesModal.addEventListener("click", (e) => {
      if (e.target === favoritesModal) closeFavorites();
    });
  }

  // Eventos de checkout simulado
  const checkoutOpenBtn = document.getElementById("checkout-open-btn");
  const closeCheckoutBtn = document.getElementById("close-checkout-btn");
  const checkoutModal = document.getElementById("checkout-modal");
  const checkoutForm = document.getElementById("checkout-form");
  const successDoneBtn = document.getElementById("success-done-btn");

  if (checkoutOpenBtn) checkoutOpenBtn.addEventListener("click", openCheckout);
  if (closeCheckoutBtn) closeCheckoutBtn.addEventListener("click", closeCheckout);
  if (checkoutModal) {
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) closeCheckout();
    });
  }
  if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckoutSubmit);
  if (successDoneBtn) successDoneBtn.addEventListener("click", closeCheckout);

  // Accesibilidad: Tecla Escape para cerrar modales y cajón
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCart();
      closeFavorites();
      closeCheckout();
      closeLoginModal();
      closeProfileModal();
      closeUserDropdown();
    }
  });
}

/* ==========================================================================
   9. INTERFAZ PÚBLICA (EXPUESTA EN WINDOW)
   ========================================================================== */
window.app = {
  setCategory: (catId) => filterByCategory(catId),
  clearSearch: () => {
    const input = document.getElementById("search-input");
    if (input) input.value = "";
    searchProducts("");
  },
  toggleOffersFilter: () => {
    const btn = document.getElementById("filter-offers-btn");
    if (btn) btn.click();
  },
  addToCart,
  updateQuantity,
  removeFromCart,
  toggleFavorite,
  openCart,
  closeCart,
  openFavorites,
  closeFavorites,
  openCheckout,
  closeCheckout,
  openLoginModal,
  closeLoginModal,
  openProfileModal,
  closeProfileModal,
  loginUser,
  logoutUser,
  showToast
};

