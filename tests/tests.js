/**
 * ==========================================================================
 * SUPERMERCADO LA CASONA - SUITE DE TESTING COMPLETA (tests/tests.js)
 * Batería de pruebas unitarias, de integración, seguridad y DOM.
 * ==========================================================================
 */

(function (window) {
  'use strict';

  // Mini framework de pruebas ligero y reactivo
  class TestRunner {
    constructor() {
      this.suites = [];
      this.currentSuite = null;
      this.stats = { total: 0, passed: 0, failed: 0, duration: 0 };
      this.listeners = [];
    }

    describe(name, fn) {
      const suite = { name, tests: [], beforeFns: [] };
      this.suites.push(suite);
      this.currentSuite = suite;
      fn();
      this.currentSuite = null;
    }

    beforeEach(fn) {
      if (this.currentSuite) {
        this.currentSuite.beforeFns.push(fn);
      }
    }

    it(name, testFn) {
      if (this.currentSuite) {
        this.currentSuite.tests.push({ name, testFn });
      }
    }

    async run() {
      this.stats = { total: 0, passed: 0, failed: 0, duration: 0 };
      const startTime = performance.now();
      const results = [];

      for (const suite of this.suites) {
        const suiteResult = { name: suite.name, tests: [] };

        for (const test of suite.tests) {
          this.stats.total++;
          for (const before of suite.beforeFns) {
            await before();
          }

          let passed = false;
          let error = null;
          try {
            await test.testFn();
            passed = true;
            this.stats.passed++;
          } catch (e) {
            passed = false;
            error = e.message || String(e);
            this.stats.failed++;
          }

          const testResult = { name: test.name, passed, error };
          suiteResult.tests.push(testResult);
          this.notify({ type: 'test_end', suite: suite.name, test: testResult, stats: this.stats });
        }
        results.push(suiteResult);
      }

      this.stats.duration = Math.round(performance.now() - startTime);
      this.notify({ type: 'all_end', results, stats: this.stats });
      return { results, stats: this.stats };
    }

    onUpdate(fn) {
      this.listeners.push(fn);
    }

    notify(event) {
      this.listeners.forEach(fn => fn(event));
    }
  }

  // Funciones de aserción (expect)
  function expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Se esperaba [${expected}] pero se obtuvo [${actual}]`);
        }
      },
      toEqual: (expected) => {
        const actStr = JSON.stringify(actual);
        const expStr = JSON.stringify(expected);
        if (actStr !== expStr) {
          throw new Error(`Se esperaba ${expStr} pero se obtuvo ${actStr}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (!(actual > expected)) {
          throw new Error(`Se esperaba que ${actual} fuera mayor que ${expected}`);
        }
      },
      toBeLessThanOrEqual: (expected) => {
        if (!(actual <= expected)) {
          throw new Error(`Se esperaba que ${actual} fuera <= ${expected}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Se esperaba un valor verdadero pero se obtuvo [${actual}]`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Se esperaba un valor falso pero se obtuvo [${actual}]`);
        }
      },
      toContain: (expected) => {
        if (typeof actual === 'string' && !actual.includes(expected)) {
          throw new Error(`Se esperaba que la cadena contuviera "${expected}"`);
        } else if (Array.isArray(actual) && !actual.includes(expected)) {
          throw new Error(`Se esperaba que el arreglo contuviera [${expected}]`);
        }
      },
      toBeDefined: () => {
        if (typeof actual === 'undefined') {
          throw new Error(`Se esperaba que el valor estuviera definido`);
        }
      },
      toThrow: () => {
        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
        }
        if (!threw) {
          throw new Error(`Se esperaba que la función lanzara un error, pero no lo hizo.`);
        }
      }
    };
  }

  const runner = new TestRunner();
  const describe = runner.describe.bind(runner);
  const it = runner.it.bind(runner);
  const beforeEach = runner.beforeEach.bind(runner);

  /* ==========================================================================
     SUITE 1: MÓDULO DE SEGURIDAD DEFENSIVA (Security)
     ========================================================================== */
  describe('1. Módulo de Seguridad Defensiva (Security)', () => {
    it('Security debe estar definido y congelado (Object.isFrozen)', () => {
      expect(typeof window.Security).toBe('object');
      expect(Object.isFrozen(window.Security)).toBe(true);
    });

    it('escapeHTML debe neutralizar inyecciones de scripts (XSS)', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = Security.escapeHTML(malicious);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it('escapeHTML debe neutralizar comillas y caracteres especiales peligrosos', () => {
      const input = `<img src=x onerror='alert(1)'> & "test"`;
      const escaped = Security.escapeHTML(input);
      expect(escaped.includes('<')).toBe(false);
      expect(escaped.includes('>')).toBe(false);
      expect(escaped.includes('"')).toBe(false);
      expect(escaped.includes("'")).toBe(false);
    });

    it('validateName debe aceptar nombres colombianos reales con tildes y espacios', () => {
      const valid1 = Security.validateName('Carlos Restrepo');
      const valid2 = Security.validateName('María José Peña');
      expect(valid1.valid).toBe(true);
      expect(valid2.valid).toBe(true);
    });

    it('validateName debe rechazar nombres con inyecciones o caracteres no permitidos', () => {
      const invalid1 = Security.validateName('<script>Carlos</script>');
      const invalid2 = Security.validateName('A'); // Demasiado corto
      const invalid3 = Security.validateName('Carlos1234');
      expect(invalid1.valid).toBe(false);
      expect(invalid2.valid).toBe(false);
      expect(invalid3.valid).toBe(false);
    });

    it('validateEmail debe validar correos electrónicos estándar', () => {
      expect(Security.validateEmail('cliente@casona.com.co').valid).toBe(true);
      expect(Security.validateEmail('ana.gomez@gmail.com').valid).toBe(true);
      expect(Security.validateEmail('invalido-sin-arroba').valid).toBe(false);
      expect(Security.validateEmail('correo@').valid).toBe(false);
      expect(Security.validateEmail('<bad>@correo.com').valid).toBe(false);
    });

    it('validatePhone debe aceptar celulares colombianos válidos', () => {
      expect(Security.validatePhone('312 456 7890').valid).toBe(true);
      expect(Security.validatePhone('+573124567890').valid).toBe(true);
      expect(Security.validatePhone('3001234567').valid).toBe(true);
      expect(Security.validatePhone('123').valid).toBe(false); // muy corto
      expect(Security.validatePhone('abc-312-telef').valid).toBe(false);
    });

    it('validatePassword debe exigir mínimo 8 caracteres con letras y números', () => {
      expect(Security.validatePassword('Segura2026').valid).toBe(true);
      expect(Security.validatePassword('12345').valid).toBe(false); // corto
      expect(Security.validatePassword('sololetras').valid).toBe(false); // sin número
      expect(Security.validatePassword('12345678').valid).toBe(false); // sin letra
    });

    it('safeJSONParse debe prevenir Prototype Pollution', () => {
      const payload = '{"__proto__": {"polluted": true}, "items": [1,2,3]}';
      const parsed = Security.safeJSONParse(payload, {});
      expect(parsed.items).toEqual([1, 2, 3]);
      expect(Object.prototype.polluted).toBe(undefined);
    });

    it('safeJSONParse debe retornar valor por defecto ante JSON malformado sin explotar', () => {
      const parsed = Security.safeJSONParse('{ malformed json }', { fallback: true });
      expect(parsed).toEqual({ fallback: true });
    });

    it('sanitizeCart debe corregir intentos de manipulación de precios en localStorage', () => {
      const manipulatedCart = [
        { id: 1, nombre: 'Manzana Roja Royal Gala', precio: 10, quantity: 2 }, // Precio hackeado a $10
        { id: 999999, nombre: 'Producto Falso', precio: 50, quantity: 1 } // ID no existente
      ];
      const catalog = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [{ id: 1, precio: 7200 }];
      const sanitized = Security.sanitizeCart(manipulatedCart, catalog);

      expect(sanitized.length).toBe(1);
      expect(sanitized[0].id).toBe(1);
      expect(sanitized[0].precio).toBe(7200); // Precio original restaurado del catálogo
    });

    it('sanitizeCart debe corregir cantidades negativas o fraudulentas', () => {
      const badQtyCart = [
        { id: 1, quantity: -5 },
        { id: 2, quantity: 9999 } // Por encima del máximo permitido (99)
      ];
      const catalog = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [{ id: 1, precio: 7200 }, { id: 2, precio: 4500 }];
      const sanitized = Security.sanitizeCart(badQtyCart, catalog);
      expect(sanitized[0].quantity).toBe(1);
      expect(sanitized[1].quantity).toBe(99);
    });

    it('rateLimit debe limitar acciones repetitivas según umbral', () => {
      const action = 'test_action_' + Date.now();
      expect(Security.rateLimit(action, 2, 5000)).toBe(true);
      expect(Security.rateLimit(action, 2, 5000)).toBe(true);
      // Tercer intento debe ser bloqueado
      expect(Security.rateLimit(action, 2, 5000)).toBe(false);
    });
  });

  /* ==========================================================================
     SUITE 2: CATÁLOGO DE PRODUCTOS Y CATEGORÍAS (Data Integrity)
     ========================================================================== */
  describe('2. Integridad del Catálogo y Categorías', () => {
    it('PRODUCTS debe estar cargado y contener al menos 20 productos', () => {
      expect(Array.isArray(PRODUCTS)).toBe(true);
      expect(PRODUCTS.length).toBeGreaterThan(19);
    });

    it('CATEGORIES debe contener las 8 categorías principales', () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(CATEGORIES.length).toBe(8);
      const categoryIds = CATEGORIES.map(c => c.id);
      expect(categoryIds).toContain('all');
      expect(categoryIds).toContain('Frutas y verduras');
      expect(categoryIds).toContain('Carnes y huevos');
      expect(categoryIds).toContain('Lácteos');
      expect(categoryIds).toContain('Panadería');
      expect(categoryIds).toContain('Despensa');
      expect(categoryIds).toContain('Bebidas');
      expect(categoryIds).toContain('Aseo del hogar');
    });

    it('Todos los productos deben tener id numérico único', () => {
      const ids = new Set();
      PRODUCTS.forEach(p => {
        expect(typeof p.id).toBe('number');
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
      });
    });

    it('Todos los productos deben tener precio positivo y categoría válida', () => {
      const validCategories = CATEGORIES.map(c => c.id);
      PRODUCTS.forEach(p => {
        expect(p.precio).toBeGreaterThan(0);
        expect(validCategories.includes(p.categoria)).toBe(true);
        expect(typeof p.nombre).toBe('string');
        expect(p.nombre.length).toBeGreaterThan(2);
      });
    });

    it('Si un producto tiene precioAnterior, debe ser mayor al precio de venta', () => {
      PRODUCTS.filter(p => p.precioAnterior !== null).forEach(p => {
        expect(p.precioAnterior).toBeGreaterThan(p.precio);
      });
    });
  });

  /* ==========================================================================
     SUITE 3: FORMATEO Y MONEDA (COP)
     ========================================================================== */
  describe('3. Formateo y Moneda Colombiana (formatCOP)', () => {
    it('formatCOP debe formatear cantidades con separador de miles y signo peso', () => {
      const formatted = app.formatCOP(12500);
      expect(formatted).toContain('$');
      expect(formatted).toContain('12');
      expect(formatted).toContain('500');
    });

    it('formatCOP debe manejar el valor 0 de manera limpia', () => {
      expect(app.formatCOP(0)).toBe('$ 0');
    });

    it('formatCOP debe manejar valores NaN, null o undefined sin lanzar errores', () => {
      expect(app.formatCOP(null)).toBe('$ 0');
      expect(app.formatCOP(undefined)).toBe('$ 0');
      expect(app.formatCOP(NaN)).toBe('$ 0');
      expect(app.formatCOP('texto')).toBe('$ 0');
    });
  });

  /* ==========================================================================
     SUITE 4: LÓGICA Y ESTADO DEL CARRITO DE COMPRAS
     ========================================================================== */
  describe('4. Lógica y Estado del Carrito de Compras', () => {
    beforeEach(() => {
      if (app && app.clearCart) {
        app.clearCart();
      }
    });

    it('addToCart debe agregar un nuevo producto con cantidad 1', () => {
      app.addToCart(1);
      const state = app.getState();
      expect(state.cart.length).toBe(1);
      expect(state.cart[0].id).toBe(1);
      expect(state.cart[0].quantity).toBe(1);
    });

    it('addToCart repetido sobre el mismo producto debe incrementar la cantidad', () => {
      app.addToCart(1);
      app.addToCart(1);
      const state = app.getState();
      expect(state.cart.length).toBe(1);
      expect(state.cart[0].quantity).toBe(2);
    });

    it('calculateTotal debe sumar el subtotal exacto de los artículos', () => {
      app.addToCart(1); // Manzana: 7200
      app.addToCart(2); // Plátano: 4500
      const { subtotal, total } = app.calculateTotal();
      expect(subtotal).toBe(11700);
      expect(total).toBe(11700);
    });

    it('updateQuantity debe modificar la cantidad correctamente', () => {
      app.addToCart(1);
      app.updateQuantity(1, 2); // Qty pasa de 1 a 3
      let state = app.getState();
      expect(state.cart[0].quantity).toBe(3);

      app.updateQuantity(1, -1); // Qty pasa a 2
      state = app.getState();
      expect(state.cart[0].quantity).toBe(2);
    });

    it('updateQuantity a 0 o negativo debe eliminar el producto del carrito', () => {
      app.addToCart(1);
      app.updateQuantity(1, -1); // 1 - 1 = 0 -> eliminar
      const state = app.getState();
      expect(state.cart.length).toBe(0);
    });

    it('removeFromCart debe remover el producto específico', () => {
      app.addToCart(1);
      app.addToCart(2);
      app.removeFromCart(1);
      const state = app.getState();
      expect(state.cart.length).toBe(1);
      expect(state.cart[0].id).toBe(2);
    });

    it('clearCart debe vaciar todo el carrito', () => {
      app.addToCart(1);
      app.addToCart(2);
      app.addToCart(3);
      app.clearCart();
      const state = app.getState();
      expect(state.cart.length).toBe(0);
      expect(app.calculateTotal().total).toBe(0);
    });

    it('El carrito debe persistir correctamente en localStorage', () => {
      app.addToCart(1);
      const stored = localStorage.getItem(app.STORAGE_KEYS.CART);
      expect(typeof stored).toBe('string');
      const parsed = JSON.parse(stored);
      expect(parsed[0].id).toBe(1);
    });
  });

  /* ==========================================================================
     SUITE 5: FAVORITOS Y PERSISTENCIA
     ========================================================================== */
  describe('5. Favoritos y Persistencia', () => {
    it('toggleFavorite debe alternar el estado de favorito de un producto', () => {
      const state = app.getState();
      const initialFavs = [...state.favorites];

      app.toggleFavorite(1);
      expect(state.favorites).toContain(1);

      app.toggleFavorite(1);
      expect(state.favorites.includes(1)).toBe(false);

      // Restaurar estado inicial
      state.favorites = initialFavs;
    });

    it('Los favoritos deben guardarse en localStorage', () => {
      app.toggleFavorite(5);
      const raw = localStorage.getItem(app.STORAGE_KEYS.FAVORITES);
      expect(typeof raw).toBe('string');
      expect(JSON.parse(raw)).toContain(5);
      app.toggleFavorite(5); // desmarcar
    });
  });

  /* ==========================================================================
     SUITE 6: MOTOR DE BÚSQUEDA Y FILTRADO
     ========================================================================== */
  describe('6. Motor de Búsqueda y Filtros de Productos', () => {
    it('searchProducts debe encontrar productos sin importar mayúsculas', () => {
      app.searchProducts('MANZANA');
      const state = app.getState();
      expect(state.filteredProducts.length).toBeGreaterThan(0);
      expect(state.filteredProducts[0].nombre.toLowerCase()).toContain('manzana');
      app.searchProducts(''); // Limpiar
    });

    it('searchProducts debe tolerar tildes colombianas (plátano / platano)', () => {
      app.searchProducts('platano');
      const state = app.getState();
      const found = state.filteredProducts.some(p => p.nombre.toLowerCase().includes('plátano') || p.nombre.toLowerCase().includes('platano'));
      expect(found).toBe(true);
      app.searchProducts('');
    });

    it('Filtrar por categoría debe devolver solo productos de esa categoría', () => {
      app.setCategory('Lácteos');
      const state = app.getState();
      expect(state.filteredProducts.length).toBeGreaterThan(0);
      state.filteredProducts.forEach(p => {
        expect(p.categoria).toBe('Lácteos');
      });
      app.setCategory('all'); // Limpiar
    });

    it('Filtrar solo ofertas debe devolver únicamente productos en descuento o con precioAnterior', () => {
      app.filterOnlyOffers(true);
      const state = app.getState();
      expect(state.filteredProducts.length).toBeGreaterThan(0);
      state.filteredProducts.forEach(p => {
        const isOffer = p.precioAnterior !== null || (p.badge && p.badge.includes('OFF')) || p.destacado;
        expect(Boolean(isOffer)).toBe(true);
      });
      app.filterOnlyOffers(false); // Limpiar
    });
  });

  /* ==========================================================================
     SUITE 7: VALIDACIÓN DE FORMULARIOS Y FLUJO DE CHECKOUT
     ========================================================================== */
  describe('7. Validación de Formularios y Flujo de Checkout', () => {
    it('Formulario de checkout debe tener campo honeypot anti-bot', () => {
      const hp = document.getElementById('website_hp_co');
      expect(Boolean(hp)).toBe(true);
      expect(hp.value).toBe('');
    });

    it('Formulario de login debe tener honeypot anti-bot', () => {
      const hp = document.getElementById('website_hp_lf');
      expect(Boolean(hp)).toBe(true);
      expect(hp.value).toBe('');
    });

    it('Formulario de registro debe tener honeypot anti-bot', () => {
      const hp = document.getElementById('website_hp_rf');
      expect(Boolean(hp)).toBe(true);
      expect(hp.value).toBe('');
    });

    it('Simulación de loginUser actualiza el usuario en state y localStorage', () => {
      const testUser = {
        id: 'usr_test_1',
        nombre: 'Prueba Usuario',
        email: 'test@correo.com',
        telefono: '312 000 0000',
        pedidos: []
      };
      app.loginUser(testUser);
      const state = app.getState();
      expect(state.user.id).toBe('usr_test_1');
      expect(state.user.nombre).toBe('Prueba Usuario');

      // Logout y restauración
      app.logoutUser();
      expect(state.user).toBe(null);
    });
  });

  /* ==========================================================================
     SUITE 8: ESTRUCTURA DEL DOM Y ACCESIBILIDAD (A11y & SEO)
     ========================================================================== */
  describe('8. Estructura del DOM y Accesibilidad (A11y & SEO)', () => {
    it('Debe existir exactamente un único h1 en el documento', () => {
      const h1s = document.querySelectorAll('h1');
      expect(h1s.length).toBe(1);
    });

    it('El contenedor de productos (#products-grid) debe existir', () => {
      const grid = document.getElementById('products-grid');
      expect(Boolean(grid)).toBe(true);
    });

    it('El cajón del carrito (#cart-drawer) y sus controles deben existir', () => {
      expect(Boolean(document.getElementById('cart-drawer'))).toBe(true);
      expect(Boolean(document.getElementById('cart-items-list'))).toBe(true);
      expect(Boolean(document.getElementById('cart-subtotal'))).toBe(true);
      expect(Boolean(document.getElementById('cart-total'))).toBe(true);
      expect(Boolean(document.getElementById('checkout-open-btn'))).toBe(true);
    });

    it('La sección de AEO "¿Cómo comprar?" (#como-comprar) debe existir con 4 pasos', () => {
      const section = document.getElementById('como-comprar');
      expect(Boolean(section)).toBe(true);
      const steps = section.querySelectorAll('.step-card');
      expect(steps.length).toBe(4);
    });

    it('La sección FAQ (#faq) debe contener acordeones accesibles', () => {
      const faq = document.getElementById('faq');
      expect(Boolean(faq)).toBe(true);
      const items = faq.querySelectorAll('.faq-item');
      expect(items.length).toBeGreaterThan(3);
    });

    it('La sección GEO de impacto regional (#compromiso-campo) debe existir', () => {
      const geoSection = document.getElementById('compromiso-campo');
      expect(Boolean(geoSection)).toBe(true);
    });

    it('Todos los botones de acción principal deben tener aria-label o texto accesible', () => {
      const cartToggle = document.getElementById('cart-toggle-btn');
      expect(Boolean(cartToggle.getAttribute('aria-label') || cartToggle.innerText)).toBe(true);
    });
  });

  window.LaCasonaTests = runner;
})(window);
