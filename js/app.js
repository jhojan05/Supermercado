/**
 * ==========================================================================
 * SUPERMERCADO VERDE - APLICACIÓN PRINCIPAL (js/app.js)
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
  filterCategory: "all",
  searchQuery: "",
  onlyOffers: false,
  sortBy: "featured",
  freeShippingThreshold: 50000,
  shippingCost: 5000
};

// Claves de persistencia en localStorage
const STORAGE_KEYS = {
  CART: "supermercado_verde_cart",
  FAVORITES: "supermercado_verde_favorites"
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
  loadFavorites();
  loadCart();
  renderCategories();
  applyFiltersAndSort();
  bindEvents();
  updateBadges();
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
 * Calcula el total del pedido considerando envío y promociones
 */
function calculateTotal() {
  const subtotal = calculateSubtotal();
  if (subtotal === 0) return { subtotal: 0, shipping: 0, total: 0, discount: 0 };

  const isFreeShipping = subtotal >= state.freeShippingThreshold;
  const shipping = isFreeShipping ? 0 : state.shippingCost;
  const total = subtotal + shipping;

  return { subtotal, shipping, total, discount: 0 };
}

/**
 * Actualiza el contenido visual del carrito lateral
 */
function renderCart() {
  const listEl = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-open-btn");
  const clearBtn = document.getElementById("clear-cart-btn");
  const drawerCount = document.getElementById("drawer-item-count");
  const shippingLabel = document.getElementById("shipping-progress-label");
  const shippingAmount = document.getElementById("shipping-progress-amount");
  const shippingFill = document.getElementById("shipping-bar-fill");

  if (!listEl) return;

  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (drawerCount) drawerCount.textContent = totalCount;

  const { subtotal, shipping, total } = calculateTotal();

  // Actualizar barra de envío gratis
  if (subtotal >= state.freeShippingThreshold) {
    if (shippingLabel) shippingLabel.textContent = "¡Felicitaciones! Tienes envío GRATIS 🎉";
    if (shippingAmount) shippingAmount.textContent = "Alcanzado";
    if (shippingFill) shippingFill.style.width = "100%";
  } else {
    const diff = state.freeShippingThreshold - subtotal;
    const percent = Math.min(100, Math.round((subtotal / state.freeShippingThreshold) * 100));
    if (shippingLabel) shippingLabel.textContent = `Faltan ${formatCOP(diff)} para envío gratis`;
    if (shippingAmount) shippingAmount.textContent = formatCOP(state.freeShippingThreshold);
    if (shippingFill) shippingFill.style.width = `${percent}%`;
  }

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
    if (shippingEl) shippingEl.textContent = formatCOP(0);
    if (totalEl) totalEl.textContent = formatCOP(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }

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
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "GRATIS" : formatCOP(shipping);
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
    const data = localStorage.getItem(STORAGE_KEYS.CART);
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
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
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
 * Procesa la simulación de checkout
 */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById("checkout-name");
  const addressInput = document.getElementById("checkout-address");
  const citySelect = document.getElementById("checkout-city");
  const phoneInput = document.getElementById("checkout-phone");
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');

  const formContainer = document.getElementById("checkout-form-container");
  const successContainer = document.getElementById("checkout-success-container");
  const orderCodeDisplay = document.getElementById("order-code-display");
  const summaryDetails = document.getElementById("order-summary-details");

  const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `ORDEN #SV-2026-${randomOrderNum}`;

  if (orderCodeDisplay) orderCodeDisplay.textContent = orderCode;
  if (summaryDetails) {
    summaryDetails.textContent = `A nombre de ${nameInput ? nameInput.value : 'Cliente'} • Entrega estimada en ${addressInput ? addressInput.value : ''}, ${citySelect ? citySelect.value : ''} • Pago: ${paymentMethod ? paymentMethod.value : 'Efectivo'}.`;
  }

  if (formContainer) formContainer.style.display = "none";
  if (successContainer) successContainer.style.display = "block";

  // Vaciar carrito tras simulación exitosa
  state.cart = [];
  saveCart();
  renderCart();
  updateBadges();

  showToast("¡Pedido simulado registrado exitosamente!", "success");
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
  showToast
};
