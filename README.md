# Control y Recepción de Almacén SUNAT (PWA Offline-First)

Aplicación Web Progresiva (PWA) de nivel producción diseñada para el **control y recepción física de mercadería en almacén** a partir de archivos XML de comprobantes electrónicos de SUNAT Perú (Guías de Remisión Electrónica `DespatchAdvice` y Facturas Electrónicas `Invoice`), optimizada para pantallas móviles (~6.1" Android / Google Pixel 6a) y preparada para servir como módulo de ingresos de un sistema POS.

---

## 🛠️ Stack Tecnológico

- **Framework:** React 18 + TypeScript + Vite
- **Estilos & Mobile Ergonomics:** Tailwind CSS + Lucide React
- **PWA & Offline 100%:** `vite-plugin-pwa` con Service Worker en modo `autoUpdate` y `manifest.webmanifest`
- **Persistencia Local Robusta:** **Dexie.js** (IndexedDB) para persistencia atómica en tiempo real
- **Pruebas Unitarias:** Vitest + Fake IndexedDB + JSDOM

---

## 🚀 Características Principales

### 1. Parser Universal de XML SUNAT (`src/utils/sunatXmlParser.ts`)
- Basado en `DOMParser` nativo, sin dependencias pesadas de XML.
- Identifica automáticamente el comprobante:
  - **`DespatchAdvice` (Guías de Remisión Remitente):** Extrae líneas `<cac:DespatchLine>`, cantidades de `<cbc:DeliveredQuantity>` y código de unidad.
  - **`Invoice` (Facturas Electrónicas):** Extrae líneas `<cac:InvoiceLine>`, cantidades de `<cbc:InvoicedQuantity>` y precio unitario `<cac:Price><cbc:PriceAmount>` para futura integración con POS.
- **Diccionario de Unidades (UN/ECE Rec 20):** Traduce todos los códigos técnicos a español claro (`NIU`/`ZZ` -> *Unidad/es*, `BX` -> *Caja/s*, `PK` -> *Paquete/s*, `BG` -> *Bolsa/s*, `BO` -> *Botella/s*, etc.).
- **Detección de Factor de Conversión:** Inspecciona patrones en la descripción (`CAX24`, `PQTX100`, `CAX12`, `DISPX12`, `BLX100`) para sugerir factores de conversión de empaque.

### 2. Ergonomía Mobile-First para Almacén (Manejo con 1 Pulgar)
- **Buscador Multitoken Fijo (`sticky top-0`):** Búsqueda instantánea escribiendo términos desordenados (ej. `chenille rojo` o `50974001`). Botón `X` grande para limpiar en un toque y opción de auto-limpieza al confirmar.
- **Pestañas de Filtro Rápido:** `Todos`, `Pendientes` (0 recibidos), `En Proceso` (parciales), `Observados / Extras`, `Completos`.
- **Botón `✓ Todo (N)` / `+ Resto (N)`:** Completa en 1 toque la cantidad esperada (44px+ de alto táctil).
- **Botón `+ Sumar` (Bottom Sheet Ergonómico):** Permite sumar conteos parciales por caja (ej. `14 + 2`), selector de unidad (caja o sueltas), y etiquetas de ubicación (`Caja 1`, `Caja 4`).
- **Botón `Deshacer`:** Revierte el último ingreso parcial si hubo error de digitación.
- **Botón `!` (Novedades):** Registro en 1 toque de mercadería faltante, dañada/rota, modelo cambiado o sobrante con notas breves.
- **Productos Extras (No en Guía):** Registro directo desde la barra de búsqueda o mediante el botón flotante `+ Extra`.

### 3. Cierre de Recepción y Puente con POS
- **Cierre Formal:** Modal de validación que detecta ítems en 0 o parciales y permite marcarlos automáticamente como `Faltante`. Bloquea los botones para evitar toques accidentales en el bolsillo.
- **Resumen para WhatsApp:** Copia en 1 toque el texto estructurado con proveedor, documento, conformidad y **únicamente la lista de excepciones** (faltantes, rotos, sobrantes, extras) listo para reclamos al proveedor.
- **Exportación Dual:**
  - **Excel (CSV):** Con BOM UTF-8 (`\uFEFF`) para abrir directamente con tildes y caracteres en español.
  - **JSON para POS (`RecepcionPOSPayload`):** Contrato tipado con movimientos de inventario y desglose de conteos para Kardex.

---

## 📦 Comandos Disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Ejecutar pruebas unitarias
npm test

# Compilar para producción (TypeScript + Vite + PWA Service Worker)
npm run build

# Previsualizar build de producción
npm run preview
```
