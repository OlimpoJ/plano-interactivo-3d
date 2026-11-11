# Guía de Integración Técnica — Plano Interactivo 2D / 3D LOOM
**Destinatario:** Equipo de Desarrollo Web — **J&A Marketing Digital (Chic Haus)**  
**Landing destino:** `https://loomcartagena.com/`  
**Proyecto:** LOOM Luxury Residence (Playa Alma, Zona Norte, Cartagena)  
**Dominio del Visor:** `https://www.masterplanalmabeach.com`

---

## Resumen de Funcionamiento

El visor interactivo cuenta con el canal exclusivo **`inmobiliaria=chichaus-ja`** (`Inmobiliaria: Chic Haus (J&A)`), configurado para que el 100% de las conversiones queden dentro de su embudo en `https://loomcartagena.com/`:

1. **Sin enlaces a WhatsApp externos ni pestañas duplicadas:** Cuando el visitante explora el plano dentro de `loomcartagena.com` y hace clic en **"Separar Lote"** (o en el botón superior de contacto), la acción ocurre dentro de la **misma pestaña**.
2. **Apertura automática de su Popup de Elementor (`#355`):** Como el formulario de GoHighLevel en `loomcartagena.com` se despliega mediante el Popup `#355` de Elementor Pro, el bloque de abajo incluye un micro-listener de 10 líneas que **abre automáticamente su formulario emergente** en el instante en que el usuario pulsa *"Separar Lote"*, conservando intactos todos los parámetros UTM (`utm_source`, `fbclid`, `gclid`) sin recargar la página.

---

## 1. Código para Incrustar en Elementor (`https://loomcartagena.com/`)

### Instrucciones rápidas en WordPress / Elementor
1. En el editor de Elementor de `https://loomcartagena.com/`, agreguen una sección de ancho completo (*Full Width*) donde deseen mostrar el Masterplan Interactivo.
2. Arrastren un widget **HTML** y peguen el siguiente código completo (`<iframe>` + `<script>`):

### Opción A (Recomendada): Selector de Etapas 2D + Showroom + Maqueta 3D
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus-ja&embed=true"
  title="Masterplan Interactivo 3D — LOOM Cartagena"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
<script>
window.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "LOT_SEPARATE_CLICKED") return;
  if (e.source) e.source.postMessage({ type: "LOOM_PARENT_HANDLED" }, "*");
  if (
    window.elementorProFrontend &&
    window.elementorProFrontend.modules &&
    window.elementorProFrontend.modules.popup
  ) {
    window.elementorProFrontend.modules.popup.showPopup({ id: 355 });
  } else {
    var btn = document.querySelector('a[href*="popup%3Aopen"]');
    if (btn) btn.click();
  }
});
</script>
```

### Opción B (Opcional): Entrada Directa en Vuelo de Maqueta 3D WebGL
Si prefieren que el recuadro inicie directamente sobre la **Maqueta 3D Aérea** en lugar del mapa 2D por etapas, usen esta variante (solo cambia `/loom?` por `/loom-maqueta?`):

```html
<iframe
  src="https://www.masterplanalmabeach.com/loom-maqueta?inmobiliaria=chichaus-ja&embed=true"
  title="Maqueta 3D Interactiva — LOOM Cartagena"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
<script>
window.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "LOT_SEPARATE_CLICKED") return;
  if (e.source) e.source.postMessage({ type: "LOOM_PARENT_HANDLED" }, "*");
  if (
    window.elementorProFrontend &&
    window.elementorProFrontend.modules &&
    window.elementorProFrontend.modules.popup
  ) {
    window.elementorProFrontend.modules.popup.showPopup({ id: 355 });
  } else {
    var btn = document.querySelector('a[href*="popup%3Aopen"]');
    if (btn) btn.click();
  }
});
</script>
```

---

## 2. ¿Y si más adelante colocan un formulario fijo en la página con un `ID`?

Si en algún momento deciden incrustar el formulario de GoHighLevel directamente en una sección fija de la página (por ejemplo, poniéndole en Elementor *Avanzado → CSS ID:* `formulario`), solo deben agregar `&ancla=formulario` al `src` del `<iframe>`:

```text
https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus-ja&ancla=formulario&embed=true
```

---

## 3. Enlaces Directos para Campañas, Anuncios o Redes (fuera de `iframe`)

Si desean enviar tráfico directo al plano en pantalla completa desde pauta, correos o automatizaciones manteniendo su atribución hacia `https://loomcartagena.com/`:

- **Masterplan Completo (2D + 3D):**  
  `https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus-ja`
- **Maqueta 3D Directa:**  
  `https://www.masterplanalmabeach.com/loom-maqueta?inmobiliaria=chichaus-ja`

*(Cuando el visitante ingresa por estos enlaces y pulsa "Separar Lote", es redirigido automáticamente a `https://loomcartagena.com/`).*

---

## 4. Datos del Lote Seleccionado vía `postMessage` (Opcional para CRM)

Cada vez que un usuario pulsa **"Separar Lote"**, el `<iframe>` emite en `e.data.payload` los datos exactos del lote consultado por si desean capturarlos en Google Tag Manager o en un campo oculto de GoHighLevel:

```json
{
  "type": "LOT_SEPARATE_CLICKED",
  "payload": {
    "lotId": "B-22",
    "price": "$267,957,400",
    "area": "252.79",
    "advisor": "chichaus-ja"
  }
}
```

