# Brief · Instructivo de una herramienta (uno solo)

Para explicar paso a paso cómo se usa una herramienta o una función, cuando es un video suelto o el primero de su tipo.

**Cómo usarlo:** completá "Datos del pedido", abrí un chat nuevo de Claude, adjuntá este archivo, el manual de marca y las capturas de pantalla, y enviá. No hace falta instalar nada.

Si vas a hacer varios instructivos con el mismo formato, conviene el brief `brief-instructivo-serie.md`.

---

## Datos del pedido

- **Herramienta o función que se explica:**
- **A quién le habla:** (clientes / equipo interno / promotores)
- **Qué tiene que poder hacer la persona al terminar de verlo:**
- **Pasos, en orden** (una línea por paso):
  1.
  2.
  3.
- **Capturas adjuntas:** una por paso, nombradas `paso-1.png`, `paso-2.png`…
- **Dónde hay que hacer clic o mirar en cada captura:**
- **Formato:** (horizontal 16:9 / vertical 9:16)
- **Duración aproximada:** (60 a 90 segundos es lo habitual)
- **Voz o solo texto en pantalla:**
- **Es de PSMob:** (sí / no). Si es sí, adjuntá también `marca-psmob.md`.

---

## Instrucciones para Claude

Vas a hacer un video instructivo corto a partir de capturas de pantalla y una lista de pasos.

**Antes de empezar**

- Leé el manual de marca adjunto. Si el instructivo es de PSMob, lo que está dentro de la pantalla sigue `marca-psmob.md` y lo que la rodea sigue el manual de QuartzSales.
- Revisá que haya una captura por paso. Si falta alguna o no se entiende dónde va el foco, preguntá.
- No inventes pasos, botones ni pantallas que no estén en las capturas.

**Estructura del video**

1. **Apertura** (3 a 4 segundos): fondo oscuro de marca, nombre de la herramienta y qué se va a aprender.
2. **Un bloque por paso:** número y título del paso, la captura, un acercamiento a la zona donde pasa la acción y un resaltado del clic o del dato.
3. **Cierre** (3 a 4 segundos): resumen en una línea y logo.

**Criterios**

- Un paso, una idea. Si un paso tiene dos acciones, partilo en dos.
- El texto de las capturas suele ser chico: acercá la imagen hasta que se lea en un celular.
- Marcá el clic con un círculo o un recuadro en el violeta de marca, no con flechas grandes.
- Texto en pantalla corto, en imperativo y en rioplatense: "Elegí el cliente", "Confirmá el pedido".
- Cada paso queda en pantalla lo suficiente para leerlo dos veces.
- Si las capturas muestran datos reales de clientes, avisá antes de seguir y ofrecé taparlos.

**Cómo producirlo**

- Animación en HTML/SVG dibujada cuadro a cuadro, capturada con un navegador sin interfaz y unida con ffmpeg en MP4 H.264.
- Mostrá primero dos cuadros fijos (la apertura y un paso) para aprobar el estilo. Después renderizá todo.

**Qué entregar**

- El MP4, con duración y peso.
- El guion paso a paso que quedó, para reutilizarlo como texto de ayuda.
- Qué decidiste por tu cuenta y qué no pudiste revisar.

---

## Checklist antes de publicar

- [ ] Los pasos están en el orden correcto y no falta ninguno.
- [ ] Las pantallas son las de la versión actual de la herramienta.
- [ ] No se ven datos reales de clientes.
- [ ] Todo se lee en un celular.
- [ ] Si sale hacia afuera, lo revisó Diseño.
