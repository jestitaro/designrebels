# Brief · Serie de instructivos con plantilla

Para cuando hay que hacer varios instructivos con el mismo formato. Se arma una plantilla una vez y después cada video nuevo es solo cargar datos.

**Para quién es:** para la persona que va a mantener la plantilla. Necesita Claude Code y manejarse con una carpeta de proyecto. Quien solo necesita un instructivo suelto usa `brief-instructivo.md`.

---

## Qué hay que tener instalado

| Qué | Para qué | Notas |
|---|---|---|
| Claude Code (o la app de escritorio de Claude) | Trabajar dentro de la carpeta del proyecto | Requiere plan Pro, Max, Team o Enterprise |
| Node.js | Correr el proyecto de video | Versión LTS actual |
| Remotion | Convertir la plantilla en video | Se instala al crear el proyecto |
| Skills de Remotion | Que Claude siga las buenas prácticas de Remotion | `npx skills add remotion-dev/skills` |

**Licencia de Remotion:** es gratis para personas y empresas de hasta 3 personas. Una empresa de 4 o más necesita la licencia Company, desde US$100 por mes. Confirmá el valor en remotion.pro/license antes de empezar.

**Alternativa sin licencia:** HyperFrames, de código abierto. Pide Node.js 22 o posterior y FFmpeg, y se instala en Claude Code con `claude plugin marketplace add heygen-com/hyperframes` y `claude plugin install hyperframes@hyperframes`. Conviene hacer una prueba corta antes de decidir.

---

## Datos del pedido (para armar la plantilla, una sola vez)

- **Nombre de la serie:**
- **Herramienta o producto:**
- **Formato principal:** (horizontal 16:9) y derivados (vertical 9:16)
- **Qué se repite en todos:** (apertura, numeración de pasos, cierre)
- **Qué cambia en cada uno:** (título, pasos, capturas o grabaciones de pantalla)
- **Instructivo de ejemplo para construirla:** adjuntá pasos y capturas de uno real.

---

## Instrucciones para Claude

Vas a construir una plantilla de video reutilizable y a dejarla lista para que cada instructivo nuevo se haga cargando datos.

**Preparación**

- Leé el manual de marca y, si la serie es de PSMob, también `marca-psmob.md`.
- Creá el proyecto con `npx create-video@latest` y usá las skills de Remotion (`/remotion-best-practices` como punto de partida).
- Avisá si la licencia de Remotion todavía no está resuelta: es una decisión de la empresa, no técnica.

**Plantilla**

- Una composición `Instructivo` que reciba todos sus datos por parámetros.
- Tres bloques: `Apertura`, `Paso` y `Cierre`.
- Cada `Paso` admite una captura o una grabación de pantalla, una zona de foco para el acercamiento y un texto corto.
- Colores, tipografías y logo en un único archivo de marca, tomados del manual. Nada de valores sueltos en los componentes.
- La duración de cada paso se calcula a partir del largo del texto, con un mínimo.
- Una segunda composición vertical que reutilice los mismos bloques.

**Borrador y render final**

- El render en calidad final es el paso más lento. Mientras el video se está ajustando, no lo hagas: cada cambio lo dejaría desactualizado.
- Para revisar, usá la vista previa de Remotion Studio o un borrador en baja calidad, a la mitad de resolución y con más compresión. Por ejemplo, sumando `--scale=0.5 --crf=30` al comando de render.
- Entregá el borrador aclarando que es un borrador y pedí la aprobación.
- Con la versión aprobada, hacé un único render en calidad final.

**Datos de cada instructivo**

Una carpeta por video, por ejemplo `instructivos/gestor-de-pedidos/`, con:

```json
{
  "titulo": "Cómo cargar un pedido",
  "herramienta": "Gestor de pedidos",
  "pasos": [
    {
      "titulo": "Elegí el cliente",
      "texto": "Buscalo por nombre o por código.",
      "media": "paso-1.png",
      "foco": { "x": 0.12, "y": 0.20, "ancho": 0.40, "alto": 0.18 }
    }
  ],
  "cierre": "Listo: el pedido ya quedó cargado."
}
```

**Cómo se usa después**

- Para un video nuevo: copiar la carpeta de ejemplo y cambiar el archivo de datos y las capturas.
- Revisar con un borrador en baja calidad y, con la aprobación, renderizar en calidad final.
- Dejá escrito en un `LEEME.md` el comando de vista previa, el de borrador en baja, el de render final y cómo sumar un paso.

**Qué entregar**

- El proyecto funcionando con el instructivo de ejemplo renderizado.
- El `LEEME.md` para quien haga el próximo video.
- Lo que no pudiste verificar.

---

## Checklist de la plantilla

- [ ] Un instructivo nuevo se hace sin tocar el código, solo datos y capturas.
- [ ] Colores, tipografía y logo salen del manual de marca.
- [ ] Hay versión horizontal y vertical.
- [ ] El `LEEME.md` explica cómo sacar un borrador y cómo hacer el render final.
- [ ] El render final se hace una sola vez, con la versión aprobada.
- [ ] La licencia de Remotion está resuelta, o se eligió HyperFrames.
