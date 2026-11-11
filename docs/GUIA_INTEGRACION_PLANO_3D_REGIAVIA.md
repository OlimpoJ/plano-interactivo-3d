# Guía de Integración Técnica — Plano Interactivo 2D / 3D LOOM
**Destinatario:** Equipo de Desarrollo & Tráfico — **RegiaVia**  
**Proyecto:** LOOM Luxury Residence (Playa Alma, Zona Norte, Cartagena)  
**Dominio del Visor:** `https://www.masterplanalmabeach.com`

---

## Resumen de Funcionamiento

Todos los códigos `<iframe>` de este documento ya vienen configurados con atribución dedicada y navegación inteligente hacia el formulario de cada página:

1. **Sin duplicar pestañas:** Cuando el visitante interactúa con el plano incrustado y pulsa **"Separar Lote"** o el botón de atribución superior, el visor **no abre pestañas externas ni envía a WhatsApp**, sino que dirige al usuario directamente al formulario de registro en la **misma pestaña**.
2. **Respeto estricto por subpágina (versiones sin WhatsApp):** Cada `<iframe>` de las subpáginas `/lista-cero-form/` y `/separa-tu-lote-form/` mantiene al usuario dentro de esa misma URL sin sacarlo al Home.
3. **Variante 2D vs. Maqueta 3D directa:**
   - Todos los códigos abajo inician en el **Selector de Etapas 2D + Showroom + Maqueta 3D** (`/loom?...`).
   - Si en alguna sección prefieren que el visor arranque directamente en el **Vuelo de Maqueta 3D WebGL**, basta cambiar `/loom?` por `/loom-maqueta?` manteniendo exactamente los mismos parámetros.

---

## 1. Integración para Patrimofy (`https://lotes.patrimofy.com/`)

**Importante:** Este `<iframe>` ya envía automáticamente el evento `postMessage` con `type: "masterplan-separar"` que su página `lotes.patrimofy.com` escucha de forma nativa (`lote`, `etapa`, `valor`, `cuotaMensual`, `plazo`, `cuotaInicialPct`). Al pulsar **"Separar Lote"**, se autocompleta el resumen del lote elegido encima del formulario y la vista baja directo a `#agendar` sin recargar la página ni perder UTMs.

### Código `<iframe>` (`lotes.patrimofy.com`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=patrimofy-rv&embed=true"
  title="Masterplan Interactivo 3D — LOOM Luxury Residence"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### Enlaces directos (para anuncios, correos o botones externos fuera de `iframe`)
- **Masterplan Completo (2D + 3D):** `https://www.masterplanalmabeach.com/loom?inmobiliaria=patrimofy-rv`
- **Acceso Directo Maqueta 3D:** `https://www.masterplanalmabeach.com/loom-maqueta?inmobiliaria=patrimofy-rv`  
*(Cuando un usuario entra suelto a estos enlaces y pulsa "Separar Lote", aterriza directo en `https://lotes.patrimofy.com/#agendar`).*

---

## 2. Integración para Chic Haus (`https://www.loomalmabeach.com/`)

Cada página de `loomalmabeach.com` cuenta con su propio contenedor de formulario verificado en el DOM, por lo que debe usarse el bloque correspondiente a cada URL:

| Página | URL | ID del Formulario destino |
| :--- | :--- | :--- |
| **1. Home Principal** | `https://www.loomalmabeach.com/` | `#agendar` |
| **2. Lista Cero** | `https://www.loomalmabeach.com/lista-cero/` | `#formulario` |
| **3. Lista Cero (Solo Formulario)** | `https://www.loomalmabeach.com/lista-cero-form/` | `#formulario` *(permanece en `/lista-cero-form/`)* |
| **4. Separa tu Lote** | `https://www.loomalmabeach.com/separa-tu-lote/` | `#formulario` |
| **5. Separa tu Lote (Solo Formulario)** | `https://www.loomalmabeach.com/separa-tu-lote-form/` | `#formulario` *(permanece en `/separa-tu-lote-form/`)* |
| **6. Lanzamiento** | `https://www.loomalmabeach.com/lanzamiento/` | `#registro` |

---

### 2.1 Home Principal (`https://www.loomalmabeach.com/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&embed=true"
  title="Masterplan Interactivo 3D — LOOM Alma Beach"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### 2.2 Lista Cero (`https://www.loomalmabeach.com/lista-cero/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&pagina=/lista-cero/&ancla=formulario&embed=true"
  title="Masterplan Interactivo 3D — LOOM Alma Beach"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### 2.3 Lista Cero — Solo Formulario sin WhatsApp (`https://www.loomalmabeach.com/lista-cero-form/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&pagina=/lista-cero-form/&ancla=formulario&embed=true"
  title="Masterplan Interactivo 3D — LOOM Alma Beach"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### 2.4 Separa tu Lote (`https://www.loomalmabeach.com/separa-tu-lote/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&pagina=/separa-tu-lote/&ancla=formulario&embed=true"
  title="Masterplan Interactivo 3D — LOOM Alma Beach"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### 2.5 Separa tu Lote — Solo Formulario sin WhatsApp (`https://www.loomalmabeach.com/separa-tu-lote-form/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&pagina=/separa-tu-lote-form/&ancla=formulario&embed=true"
  title="Masterplan Interactivo 3D — LOOM Alma Beach"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

### 2.6 Lanzamiento (`https://www.loomalmabeach.com/lanzamiento/`)
```html
<iframe
  src="https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus&pagina=/lanzamiento/&ancla=registro&embed=true"
  title="Masterplan Interactivo 3D — LOOM Lanzamiento"
  width="100%"
  height="720"
  style="border:0; border-radius:16px; width:100%; min-height:680px;"
  allow="fullscreen"
  loading="lazy"
></iframe>
```

*(Nota en las páginas 2.2 a 2.5: si prefieren que baje al formulario del cierre inferior `<section id="contacto">` en lugar del formulario superior `<section id="formulario">`, basta cambiar `ancla=formulario` por `ancla=contacto`).*

---

## 3. Script Recomendado de Scroll Suave y Preservación de UTMs (`loomalmabeach.com`)

Aunque cada `<iframe>` ya salta por sí solo al ancla de su página, recomendamos incluir este bloque `<script>` debajo del `<iframe>` en las landings de `loomalmabeach.com`. Con él:
- El desplazamiento al formulario ocurre con **scroll suave sin recargar la página**.
- Se conservan al 100% los parámetros de campaña activos en la URL (`?utm_source=...`, `utm_campaign`, `fbclid`, `gclid`).

```html
<script>
window.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "LOT_SEPARATE_CLICKED") return;
  var anchor = (e.data.payload && e.data.payload.targetAnchor) || "";
  var el =
    (anchor && document.getElementById(anchor)) ||
    document.querySelector("#agendar, #formulario, #registro, #contacto");
  if (el) {
    if (e.source) e.source.postMessage({ type: "LOOM_PARENT_HANDLED" }, "*");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
</script>
```

### Enlaces directos de Chic Haus (fuera de `iframe`)
- **Masterplan Completo (2D + 3D):** `https://www.masterplanalmabeach.com/loom?inmobiliaria=chichaus`
- **Acceso Directo Maqueta 3D:** `https://www.masterplanalmabeach.com/loom-maqueta?inmobiliaria=chichaus`  
*(Redirigen directamente a `https://www.loomalmabeach.com/#agendar`).*

