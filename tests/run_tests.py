#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==========================================================================
SUPERMERCADO LA CASONA - RUNNER DE PRUEBAS AUTOMATIZADAS (Python CI)
Valida integridad estática, esquemas Schema.org, seguridad CSP,
SEO, GEO, AEO, coherencia de datos y consistencia del frontend.
==========================================================================
"""

import os
import re
import sys
import json

import os
import re
import sys
import json

# Soporte de codificación UTF-8 en consolas Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

passed_count = 0
failed_count = 0
total_count = 0

def assert_test(name, condition, error_msg=""):
    global passed_count, failed_count, total_count
    total_count += 1
    if condition:
        passed_count += 1
        print(f"  {Color.GREEN}[PASS]{Color.RESET} {name}")
    else:
        failed_count += 1
        print(f"  {Color.RED}[FAIL]{Color.RESET} {name}")
        if error_msg:
            print(f"    {Color.YELLOW}Detalle:{Color.RESET} {error_msg}")

def test_file_structure():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 1. Pruebas de Estructura de Archivos ---{Color.RESET}")
    required_files = [
        "index.html",
        "css/styles.css",
        "js/security.js",
        "js/products.js",
        "js/app.js",
        "assets/logo.svg",
        "assets/og-banner.jpg",
        "manifest.json",
        "robots.txt",
        "sitemap.xml",
        "llms.txt",
        "llms-full.txt",
        "tests/test-runner.html",
        "tests/tests.js"
    ]
    for rel_path in required_files:
        full_path = os.path.join(BASE_DIR, rel_path)
        exists = os.path.isfile(full_path)
        assert_test(f"Archivo existe: {rel_path}", exists, f"No encontrado en {full_path}")

def test_html_and_security_headers():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 2. Pruebas de Metadatos y Seguridad HTTP (index.html) ---{Color.RESET}")
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    # DOCTYPE y etiquetas base
    assert_test("DOCTYPE HTML5 presente", "<!DOCTYPE html>" in html)
    assert_test("Idioma establecido a es-CO", 'lang="es-CO"' in html)
    assert_test("Charset UTF-8 configurado", 'charset="UTF-8"' in html or 'charset="utf-8"' in html)
    assert_test("Viewport responsivo configurado", 'name="viewport"' in html and "width=device-width" in html)

    # 1 único h1
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
    assert_test("Exactamente 1 único <h1> para jerarquía SEO", len(h1_matches) == 1, f"Se encontraron {len(h1_matches)} h1")

    # Cabeceras de Seguridad HTTP
    assert_test("Content Security Policy (CSP) configurado", 'http-equiv="Content-Security-Policy"' in html)
    assert_test("CSP restringe default-src 'self'", "default-src 'self'" in html)
    assert_test("X-Content-Type-Options: nosniff presente", 'http-equiv="X-Content-Type-Options"' in html and 'content="nosniff"' in html)
    assert_test("X-Frame-Options: DENY anti-clickjacking presente", 'http-equiv="X-Frame-Options"' in html and 'content="DENY"' in html)
    assert_test("Referrer-Policy estricta configurada", 'name="referrer"' in html and 'strict-origin-when-cross-origin' in html)
    assert_test("Permissions-Policy restringida", 'http-equiv="Permissions-Policy"' in html)

    # Open Graph & Twitter Cards
    assert_test("Open Graph og:title configurado", 'property="og:title"' in html)
    assert_test("Open Graph og:image configurado", 'property="og:image"' in html)
    assert_test("Open Graph og:type configurado", 'property="og:type"' in html)
    assert_test("Twitter Card summary_large_image configurado", 'name="twitter:card"' in html and 'summary_large_image' in html)

    # GEO Tags
    assert_test("GEO tag geo.region (CO-CUN) configurado", 'name="geo.region"' in html)
    assert_test("GEO tag geo.placename configurado", 'name="geo.placename"' in html)
    assert_test("GEO tag ICBM / geo.position configurado", 'name="ICBM"' in html)

    # Orden de scripts: security.js debe cargarse primero
    sec_idx = html.find('src="js/security.js"')
    prod_idx = html.find('src="js/products.js"')
    app_idx = html.find('src="js/app.js"')
    assert_test("security.js cargado antes de products.js y app.js", sec_idx != -1 and sec_idx < prod_idx and prod_idx < app_idx,
                f"Indices: sec={sec_idx}, prod={prod_idx}, app={app_idx}")

def test_jsonld_schemas():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 3. Pruebas de Esquemas Estructurados JSON-LD ---{Color.RESET}")
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    assert_test(f"Existen al menos 6 esquemas JSON-LD (encontrados: {len(scripts)})", len(scripts) >= 6)

    detected_types = set()
    for i, script in enumerate(scripts, 1):
        try:
            data = json.loads(script)
            schema_type = data.get("@type")
            if isinstance(schema_type, list):
                detected_types.update(schema_type)
            elif schema_type:
                detected_types.add(schema_type)
            assert_test(f"Esquema #{i} [{schema_type}] tiene JSON sintácticamente válido", True)
        except Exception as e:
            assert_test(f"Esquema #{i} sintaxis JSON", False, str(e))

    expected_schemas = ["WebSite", "GroceryStore", "ItemList", "FAQPage", "HowTo", "BreadcrumbList"]
    for s in expected_schemas:
        assert_test(f"Esquema @type '{s}' detectado", s in detected_types, f"No encontrado en {detected_types}")

def test_form_security_and_honeypots():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 4. Pruebas de Seguridad en Formularios y Honeypots ---{Color.RESET}")
    html_path = os.path.join(BASE_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    assert_test("Honeypot presente en formulario checkout (#website_hp_co)", 'id="website_hp_co"' in html)
    assert_test("Honeypot presente en formulario login (#website_hp_lf)", 'id="website_hp_lf"' in html)
    assert_test("Honeypot presente en formulario registro (#website_hp_rf)", 'id="website_hp_rf"' in html)
    assert_test("Formulario de checkout tiene novalidate para validación defensiva en JS", '<form id="checkout-form" novalidate' in html)
    assert_test("Longitud máxima (maxlength) delimitada en campos sensibles", 'maxlength="60"' in html and 'maxlength="15"' in html)

def test_data_integrity():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 5. Pruebas de Integridad de Datos (js/products.js) ---{Color.RESET}")
    prod_path = os.path.join(BASE_DIR, "js", "products.js")
    with open(prod_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verificar presencia de constantes
    assert_test("Constante PRODUCTS definida", "const PRODUCTS = [" in content)
    assert_test("Constante CATEGORIES definida", "const CATEGORIES = [" in content)

    # Extraer IDs de productos mediante regex
    ids = re.findall(r'id:\s*(\d+)', content)
    assert_test(f"Catálogo contiene al menos 20 productos (encontrados: {len(ids)})", len(ids) >= 20)

    # Verificar que los precios sean positivos
    precios = re.findall(r'precio:\s*(\d+)', content)
    all_positive = all(int(p) > 0 for p in precios)
    assert_test("Todos los precios de los productos son mayores a 0 COP", all_positive and len(precios) >= 20)

    # Verificar categorías
    cat_names = ["Frutas y verduras", "Carnes y huevos", "Lácteos", "Panadería", "Despensa", "Bebidas", "Aseo del hogar"]
    for c in cat_names:
        assert_test(f"Categoría '{c}' presente en catálogo", f'"{c}"' in content or f"'{c}'" in content)

def test_sitemap_and_robots():
    print(f"\n{Color.BOLD}{Color.CYAN}--- 6. Pruebas de Rastreo (robots.txt y sitemap.xml) ---{Color.RESET}")
    robots_path = os.path.join(BASE_DIR, "robots.txt")
    with open(robots_path, "r", encoding="utf-8") as f:
        robots = f.read()
    assert_test("robots.txt permite rastreo general (User-agent: *)", "User-agent: *" in robots and "Allow: /" in robots)
    assert_test("robots.txt apunta a Sitemap oficial", "Sitemap: https://supermercadolacasona.com.co/sitemap.xml" in robots)

    sitemap_path = os.path.join(BASE_DIR, "sitemap.xml")
    with open(sitemap_path, "r", encoding="utf-8") as f:
        sitemap = f.read()
    assert_test("sitemap.xml tiene formato XML válido con urlset", "<urlset" in sitemap and "</urlset>" in sitemap)
    assert_test("sitemap.xml incluye URL canónica de La Casona", "https://supermercadolacasona.com.co/" in sitemap)

def main():
    print(f"\n{Color.BOLD}{Color.BLUE}=========================================================================={Color.RESET}")
    print(f"{Color.BOLD}{Color.BLUE}   SUPERMERCADO LA CASONA — SUITE DE VALIDACIÓN AUTOMATIZADA             {Color.RESET}")
    print(f"{Color.BOLD}{Color.BLUE}=========================================================================={Color.RESET}")

    test_file_structure()
    test_html_and_security_headers()
    test_jsonld_schemas()
    test_form_security_and_honeypots()
    test_data_integrity()
    test_sitemap_and_robots()

    print(f"\n{Color.BOLD}--------------------------------------------------------------------------{Color.RESET}")
    print(f"Resumen: {Color.BOLD}{total_count}{Color.RESET} pruebas ejecutadas.")
    print(f"Pasadas: {Color.GREEN}{passed_count}{Color.RESET}")
    print(f"Fallidas: {Color.RED}{failed_count}{Color.RESET}")
    print(f"{Color.BOLD}--------------------------------------------------------------------------{Color.RESET}")

    if failed_count == 0:
        print(f"\n{Color.BOLD}{Color.GREEN}🎉 ¡TODAS LAS PRUEBAS AUTOMATIZADAS PASARON CON ÉXITO! (100%){Color.RESET}\n")
        return 0
    else:
        print(f"\n{Color.BOLD}{Color.RED}❌ Se detectaron {failed_count} fallos.{Color.RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
