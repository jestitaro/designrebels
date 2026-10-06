# Brief · Animación a partir de un PDF

Para convertir un PDF (un informe, un folleto, una presentación, una hoja de producto) en una pieza animada más llamativa.

**Cómo usarlo:** completá "Datos del pedido", abrí un chat nuevo de Claude, adjuntá este archivo, el PDF y `marca-quartzsales-esaurio.md`, y enviá. No hace falta instalar nada.

---

## Datos del pedido

- **PDF adjunto:** (nombre del archivo)
- **Qué querés destacar:** (todo resumido / estas páginas: __ / estos datos: __)
- **Para qué es:** (redes / web / reunión comercial / interno)
- **Formato:** (horizontal 16:9 / vertical 9:16 / cuadrado 1:1)
- **Duración:** (20 a 45 segundos es lo habitual)
- **El PDF ya tiene diseño de marca:** (sí, respetalo / no, aplicá el manual)
- **Hay datos que no se pueden mostrar:**

---

## Instrucciones para Claude

Vas a convertir un PDF en una pieza animada. El objetivo no es pasar las páginas una por una, sino contar lo importante con movimiento.

**Antes de empezar**

- Leé el PDF completo. Si es un escaneo y el texto no se puede leer bien, avisá y pedí una versión con texto seleccionable.
- Si no se indica qué destacar, proponé de 3 a 5 mensajes y esperá la aprobación.
- Si el PDF parece confidencial (precios, clientes, datos personales), preguntá qué se puede mostrar antes de seguir.

**Cómo pensarlo**

- Una idea por pantalla. Un PDF tiene mucho más texto del que entra en un video.
- Convertí los datos en movimiento: una cifra que sube, una barra que crece, una lista que aparece de a un ítem.
- Reutilizá del PDF lo que ya funciona: gráficos, fotos, íconos. Extraelos como imagen y animalos con acercamientos y resaltados.
- Si el PDF ya tiene diseño de marca, mantené su estilo. Si no, aplicá el manual adjunto.
- Usá las cifras y los nombres exactamente como están en el PDF. No redondees ni reescribas sin avisar.

**Estructura**

1. **Apertura:** título del documento o su idea principal.
2. **Desarrollo:** los mensajes elegidos, uno por pantalla.
3. **Cierre:** conclusión o llamado a la acción, y logo.

**Cómo producirlo**

- Animación en HTML/SVG dibujada cuadro a cuadro, capturada con un navegador sin interfaz y unida con ffmpeg en MP4 H.264.
- Mostrá primero dos cuadros fijos para aprobar el estilo. Después renderizá todo.

**Qué entregar**

- El MP4, con duración y peso.
- La lista de mensajes que usaste y de qué página salió cada uno.
- Lo que quedó afuera, por si quieren una segunda pieza.

---

## Checklist antes de publicar

- [ ] Las cifras coinciden con las del PDF.
- [ ] No se muestra nada confidencial.
- [ ] Cada pantalla tiene una sola idea y se llega a leer.
- [ ] El estilo respeta el del PDF o el manual de marca.
- [ ] Si sale hacia afuera, lo revisó Diseño.
