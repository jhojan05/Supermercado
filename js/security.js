/**
 * ==========================================================================
 * SUPERMERCADO LA CASONA - MÓDULO DE SEGURIDAD DEFENSIVA (js/security.js)
 * Protección frontend multicapa (Defensa en Profundidad):
 * 1. Prevención de Clickjacking (Frame-Busting)
 * 2. Mitigación de XSS (Cross-Site Scripting) y Sanitización Estricta
 * 3. Prevención de Prototype Pollution en JSON
 * 4. Protección contra Manipulación de Precios y Estado (Anti-Tampering)
 * 5. Validación Cripto-segura de Formularios (RegEx, tipos, longitudes)
 * 6. Detección Anti-Bot mediante Campo Honeypot
 * 7. Limitador de Tasa (Rate Limiting / Anti-Spam / Anti-Brute-Force)
 * 8. Higiene de Memoria y Privacidad de Credenciales
 * ==========================================================================
 */

(function (window) {
  'use strict';

  // 1. PREVENCIÓN DE CLICKJACKING (FRAME-BUSTING)
  // Evita que la aplicación sea embebida dentro de iframes maliciosos
  try {
    if (window.top !== window.self) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    // Si hay restricción cross-origin en el top frame, romper el contexto
    document.documentElement.style.display = 'none';
    window.location = window.self.location;
  }

  // 2. MAPA DE INTENTOS PARA RATE LIMITING (ANTI-SPAM / ANTI-BRUTE FORCE)
  const rateLimitStore = new Map();

  const Security = {
    /**
     * Escapado de caracteres especiales HTML para prevenir XSS Reflejado y Almacenado
     */
    escapeHTML: function (str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/`/g, '&#x60;')
        .replace(/\//g, '&#x2F;');
    },

    /**
     * Sanitiza texto plano eliminando etiquetas HTML, scripts, null bytes y secuencias de control
     */
    sanitizeText: function (str, maxLength = 255) {
      if (typeof str !== 'string') return '';
      // Eliminar null bytes y caracteres de control invisibles
      let clean = str.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      // Eliminar cualquier etiqueta HTML (<...>)
      clean = clean.replace(/<[^>]*>?/gm, '');
      // Normalizar espacios en blanco
      clean = clean.trim().replace(/\s+/g, ' ');
      // Truncar a la longitud máxima especificada
      return clean.slice(0, maxLength);
    },

    /**
     * Parseo seguro de JSON con protección contra Prototype Pollution
     * Rechaza llaves peligrosas como __proto__, constructor y prototype
     */
    safeJSONParse: function (jsonString, fallback = null) {
      if (!jsonString || typeof jsonString !== 'string') return fallback;
      try {
        return JSON.parse(jsonString, (key, value) => {
          if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            console.warn(`[Seguridad] Bloqueado intento de Prototype Pollution con la clave: "${key}"`);
            return undefined; // Descarta la propiedad maliciosa
          }
          return value;
        });
      } catch (err) {
        console.warn('[Seguridad] Error al parsear JSON no confiable:', err);
        return fallback;
      }
    },

    /**
     * Validador estricto de nombre y apellido
     * Solo permite letras (incluyendo tildes y ñ), espacios y guiones (2 a 60 caracteres)
     */
    validateName: function (name) {
      if (!name || typeof name !== 'string') return { valid: false, error: 'El nombre es obligatorio.' };
      const trimmed = name.trim();
      if (trimmed.length < 2) return { valid: false, error: 'El nombre debe tener mínimo 2 caracteres.' };
      if (trimmed.length > 60) return { valid: false, error: 'El nombre no puede exceder 60 caracteres.' };
      
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
      if (!nameRegex.test(trimmed)) {
        return { valid: false, error: 'El nombre solo puede contener letras y espacios.' };
      }
      return { valid: true, value: trimmed };
    },

    /**
     * Validador de número celular para Colombia (10 dígitos comenzando con 3)
     */
    validatePhone: function (phone) {
      if (!phone || typeof phone !== 'string') return { valid: false, error: 'El teléfono es obligatorio.' };
      // Limpiar espacios, guiones y código de país (+57)
      let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
      if (cleaned.startsWith('+57')) cleaned = cleaned.slice(3);
      else if (cleaned.startsWith('57') && cleaned.length === 12) cleaned = cleaned.slice(2);

      const phoneRegex = /^3[0-9]{9}$/;
      if (!phoneRegex.test(cleaned)) {
        return { 
          valid: false, 
          error: 'Ingresa un número celular colombiano válido de 10 dígitos (ej. 312 456 7890).' 
        };
      }
      return { valid: true, value: cleaned };
    },

    /**
     * Validador de correo electrónico conforme a estándares seguros
     */
    validateEmail: function (email) {
      if (!email || typeof email !== 'string') return { valid: false, error: 'El correo es obligatorio.' };
      const trimmed = email.trim();
      if (trimmed.length > 100) return { valid: false, error: 'El correo no puede exceder 100 caracteres.' };

      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
      if (!emailRegex.test(trimmed)) {
        return { valid: false, error: 'Ingresa una dirección de correo electrónico válida.' };
      }
      return { valid: true, value: trimmed.toLowerCase() };
    },

    /**
     * Validador de contraseña para registro
     * Requiere mínimo 8 caracteres con al menos una letra y un número
     */
    validatePassword: function (password) {
      if (!password || typeof password !== 'string') return { valid: false, error: 'La contraseña es obligatoria.' };
      if (password.length < 8) {
        return { valid: false, error: 'La contraseña debe contener al menos 8 caracteres.' };
      }
      if (password.length > 128) {
        return { valid: false, error: 'La contraseña no puede superar 128 caracteres.' };
      }
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      if (!hasLetter || !hasNumber) {
        return { valid: false, error: 'La contraseña debe incluir al menos una letra y un número.' };
      }
      return { valid: true };
    },

    /**
     * Validador de notas y comentarios especiales del pedido
     */
    validateNotes: function (notes) {
      if (!notes) return { valid: true, value: '' };
      const sanitized = Security.sanitizeText(notes, 200);
      return { valid: true, value: sanitized };
    },

    /**
     * Detección Anti-Bot mediante campo Honeypot
     * Los bots automatizados suelen rellenar todos los campos del formulario.
     * Si el campo oculto contiene algún valor, se detecta como bot.
     */
    isHoneypotTriggered: function (formElement) {
      if (!formElement) return false;
      const hpField = formElement.querySelector('input[name="website_hp"]');
      if (hpField && hpField.value.trim() !== '') {
        console.warn('[Seguridad] Alerta: Intento de bot detectado mediante campo honeypot.');
        return true;
      }
      return false;
    },

    /**
     * Limitador de tasa (Rate Limiting) para prevenir ataques de fuerza bruta y flood
     * @param {string} action - Identificador de la acción ('login', 'register', 'checkout')
     * @param {number} maxAttempts - Máximo de intentos permitidos en la ventana
     * @param {number} windowMs - Ventana de tiempo en milisegundos (por defecto 30 segundos)
     */
    checkRateLimit: function (action, maxAttempts = 5, windowMs = 30000) {
      const now = Date.now();
      const record = rateLimitStore.get(action) || { attempts: [], blockedUntil: 0 };

      // Si está en periodo de enfriamiento
      if (now < record.blockedUntil) {
        const remainingSec = Math.ceil((record.blockedUntil - now) / 1000);
        return {
          allowed: false,
          error: `Has realizado demasiados intentos. Por favor espera ${remainingSec} segundos antes de reintentar.`
        };
      }

      // Filtrar intentos dentro de la ventana de tiempo activa
      record.attempts = record.attempts.filter(timestamp => now - timestamp < windowMs);
      record.attempts.push(now);

      if (record.attempts.length > maxAttempts) {
        // Bloquear por 20 segundos
        record.blockedUntil = now + 20000;
        rateLimitStore.set(action, record);
        return {
          allowed: false,
          error: 'Límite de intentos superado por seguridad. Espera 20 segundos para volver a intentar.'
        };
      }

      rateLimitStore.set(action, record);
      return { allowed: true };
    },

    /**
     * ANTI-TAMPERING: Saneamiento y Validación de Integridad del Carrito
     * Compara cada artículo contra la lista oficial de PRODUCTS inmutables.
     * Evita que un atacante modifique precios en localStorage o inyecte IDs falsos.
     */
    sanitizeCart: function (rawCart, catalog) {
      if (!Array.isArray(rawCart) || !Array.isArray(catalog)) return [];
      
      const cleanCart = [];
      const catalogMap = new Map();
      catalog.forEach(p => {
        if (p && typeof p.id === 'number') {
          catalogMap.set(p.id, p);
        }
      });

      rawCart.forEach(item => {
        if (!item || typeof item !== 'object') return;
        const validId = parseInt(item.id, 10);
        if (isNaN(validId) || !catalogMap.has(validId)) {
          console.warn(`[Seguridad] Eliminado producto no autorizado o inexistente en el carrito: ID ${item.id}`);
          return;
        }

        const officialProduct = catalogMap.get(validId);
        // Validar cantidad entre 1 y 99
        let validQty = parseInt(item.cantidad, 10);
        if (isNaN(validQty) || validQty < 1) validQty = 1;
        if (validQty > 99) validQty = 99;

        // Construir el artículo garantizando el precio y nombre oficial
        cleanCart.push({
          id: officialProduct.id,
          nombre: officialProduct.nombre,
          presentacion: officialProduct.presentacion,
          precio: officialProduct.precio, // PRECIO AUTORITATIVO, NO EL DE LOCALSTORAGE
          precioAnterior: officialProduct.precioAnterior || null,
          imagen: officialProduct.imagen,
          cantidad: validQty
        });
      });

      return cleanCart;
    },

    /**
     * Saneamiento y validación de favoritos
     */
    sanitizeFavorites: function (rawFavorites, catalog) {
      if (!Array.isArray(rawFavorites) || !Array.isArray(catalog)) return [];
      const validIds = new Set(catalog.map(p => p.id));
      return rawFavorites
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id) && validIds.has(id));
    },

    /**
     * Saneamiento y validación de la sesión de usuario
     */
    sanitizeUser: function (rawUser) {
      if (!rawUser || typeof rawUser !== 'object') return null;
      if (!rawUser.nombre || !rawUser.email) return null;

      const cleanUser = {
        id: Security.sanitizeText(String(rawUser.id || 'usr_' + Date.now()), 40),
        nombre: Security.sanitizeText(String(rawUser.nombre), 60),
        email: Security.sanitizeText(String(rawUser.email).toLowerCase(), 100),
        telefono: Security.sanitizeText(String(rawUser.telefono || ''), 20),
        pedidos: []
      };

      if (Array.isArray(rawUser.pedidos)) {
        cleanUser.pedidos = rawUser.pedidos.slice(0, 50).map(p => ({
          codigo: Security.sanitizeText(String(p.codigo || ''), 30),
          fecha: Security.sanitizeText(String(p.fecha || ''), 30),
          total: Math.max(0, parseInt(p.total, 10) || 0),
          estado: Security.sanitizeText(String(p.estado || 'Confirmado'), 30),
          items: Security.sanitizeText(String(p.items || ''), 300)
        }));
      }

      return cleanUser;
    },

    /**
     * Limpieza segura de campos de contraseñas de la memoria y el DOM
     */
    clearSensitiveInputs: function (form) {
      if (!form) return;
      const passInputs = form.querySelectorAll('input[type="password"], input[type="text"][data-sensitive="true"]');
      passInputs.forEach(input => {
        input.value = '';
      });
    }
  };

  // Inmutabilidad del módulo de seguridad
  Object.freeze(Security);
  window.Security = Security;

  // Manejador global seguro de excepciones para no filtrar stack traces en la UI
  window.addEventListener('error', function (event) {
    if (event && event.error) {
      // Registrar de forma controlada sin exponer datos del usuario
      console.warn('[Seguridad: Error interceptado]:', event.error.message || 'Error de ejecución no controlado');
    }
  });

})(window);
