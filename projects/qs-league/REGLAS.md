# Dino Cup (ex QS League) — Reglas y decisiones vigentes

Documento de referencia para no perder las reglas definidas durante el armado del MVP.

> El 23/07/2026 el proyecto se rebrandeó de "QS League" a "Dino Cup": mismo repo, mismos datos de la temporada actual, landing y estilo nuevos. Las reglas de esta página siguen siendo la fuente de verdad; el modal "Reglamento oficial" de la landing es solo la versión resumida para los participantes.

## 1. Temporadas

### Arena actual

La **Arena actual** representa la temporada viva.

Actualmente corresponde a:

```txt
Season 02 · Segundo semestre 2026
```

En esta etapa el ranking principal es **individual**.

La mecánica por equipos queda pausada hasta que se defina mejor.

### Leyendas

La sección **Leyendas** guarda temporadas o semestres ya cerrados.

El primer semestre 2026 queda como histórico cerrado:

```txt
Enero-junio 2026
```

Ese histórico cuenta **solo ganadores de fechas**.

No se cargan meteoritos retroactivos para ese período.

Los meteoritos empiezan desde la temporada actual en adelante.

---

## 2. Puntaje por Kahoot

Para cada informe de Kahoot cargado en la temporada actual:

```txt
1° puesto → +3 DinoCoins
2° puesto → +2 DinoCoins
3° puesto → +1 DinoCoin
```

Solo suman los tres primeros lugares.

El resto de participantes aparece en el ranking, pero no suma DinoCoins por esa fecha.

---

## 3. Moderador

Al subir un informe de Kahoot, el admin debe indicar quién fue el **moderador de la fecha**.

El moderador:

- no compite en su propia fecha,
- no recibe puntos aunque aparezca en el Excel,
- no cuenta como ausente,
- se excluye del cálculo del podio de esa fecha.

Después de quitar al moderador, el sistema debe recalcular el podio real de esa fecha y aplicar:

```txt
1° +3
2° +2
3° +1
```

---

## 4. Participantes oficiales

El sistema debe controlar las ausencias contra este roster oficial:

| Persona | Nombre completo | Casa / rol |
|---|---|---|
| Agustin | Agustin Goñi Piuma | Slytherin / Director Comercial |
| Alejandro | Alejandro Frank | Hufflepuff |
| Eugenio | Eugenio Balbastro Fages | Ravenclaw / Líder técnico |
| Javi | Javier De Vergilio | Gryffindor |
| Jesica | Jesica Titaro | Gryffindor / Rebel Designer |
| Juli | Juli Piccioni | Ravenclaw |
| Lucrecia | Lucrecia Moralejo | Hufflepuff |
| May | Mayra Milanesio | Gryffindor |
| Nico | Nicolas Rivero Segura | Slytherin / Integrator / COO |
| Pablo | Pablo Hernan Gimenez | Slytherin / Visionary / CEO |
| Sebas | Sebastian Carnota | Ravenclaw |

Casas confirmadas contra `quartzsales.com/hogquartz/salacomun/` (17/07/2026).

### Alias importantes

```txt
8706743 → Eugenio / Euge
July → Juli Piccioni
Picci → Juli Piccioni
Heror / Hero → Pablo
Luly / Luli / Lucre → Lucrecia
May → Mayra
Sebas / Seba → Sebastian Carnota
Jesi / Jess → Jesica Titaro
```

---

## 5. Personas nuevas en el Excel

Si el informe de Kahoot trae un participante que no está en el roster oficial ni en los alias conocidos, el sistema no debe sumarlo automáticamente.

Debe preguntar al admin si quiere agregarlo al ranking.

Flujo esperado:

```txt
Detectar participante nuevo
→ Mostrarlo en preview
→ Preguntar si se quiere agregar
→ Permitir asignarle nombre visible
→ Recién ahí sumarlo al ranking
```

---

## 6. Ausencias y meteoritos

Al cargar un informe, el sistema compara:

```txt
Roster oficial
vs.
Participantes del Kahoot, excluyendo al moderador
```

Toda persona oficial que no participó y no fue moderador se considera ausente.

Cada ausencia suma:

```txt
+1 meteorito
```

El meteorito funciona como registro visual de ausencia.

---

## 7. Penalización por ausencia

La penalización ya no depende de llegar a 3 meteoritos.

Regla vigente:

```txt
Ausencia avisando 24 horas antes → -1 DinoCoin
Ausencia sin aviso → -3 DinoCoins
```

El admin debe elegir el tipo de ausencia para cada ausente antes de actualizar el ranking.

No se puede aplicar el informe si hay ausentes sin clasificar.

---

## 8. Ajustes manuales de admin

El admin puede hacer ajustes manuales sobre:

- DinoCoins,
- meteoritos.

Acciones permitidas:

```txt
Sumar DinoCoins
Restar DinoCoins
Cargar meteorito
Quitar meteorito
```

Todo ajuste manual debe tener **motivo obligatorio**.

Ejemplos:

```txt
Premio extra por organizar
Corrección de carga duplicada
Ausencia justificada
Error de mapeo en Kahoot
```

Cada ajuste debe quedar registrado con:

- persona,
- tipo de ajuste,
- cantidad,
- motivo,
- fecha o contexto.

---

## 9. Informes duplicados

Si se intenta cargar un informe que ya parece cargado, el sistema debe avisar antes de aplicarlo.

Flujo esperado:

```txt
Este informe ya parece cargado
→ ¿Querés aplicarlo igual?
```

Esto evita duplicar puntos por accidente.

---

## 10. Fuente de verdad actual del segundo semestre

Para Season 02, los primeros dos informes base son:

### 02 de julio 2026 — Moderador: Ale

```txt
1° May  → +3
2° Javi → +2
3° Nico → +1
```

### 16 de julio 2026 — Moderador: Sebas

```txt
1° Javi  → +3
2° May   → +2
3° Pablo → +1
```

Resultado base, sin penalizaciones nuevas:

```txt
Javi  → 5 DinoCoins
May   → 5 DinoCoins
Nico  → 1 DinoCoin
Pablo → 1 DinoCoin
```

---

## 11. Podio de Arena actual

El podio de Arena actual no es simbólico.

Debe mostrar los **3 primeros reales del ranking actual**.

Orden visual:

```txt
02 Plata  | 01 Oro | 03 Bronce
```

Pero con alturas de podio real:

```txt
01 → más alto
02 → altura media
03 → más bajo
```

El podio debe actualizarse a medida que cambie el ranking de la temporada.

---

## 12. Decisiones de interfaz recientes

- Se quitó el login: QS League entra directo a la app.
- Se ocultó el botón Salir.
- El menú lateral no usa emojis.
- El bloque de Actividad actual se quitó de la vista principal.
- El ranking actual vive dentro de Arena actual.
- La carga del último Kahoot vive dentro de Arena actual.
- Leyendas queda para históricos cerrados.
- Reglas es editable en modo admin.

---

## 13. Cantidad de preguntas por Kahoot

```txt
Hasta 2 preguntas relacionadas con cada participante.
Hasta 2 preguntas generales.
```

Cuando una persona no participe, sus preguntas pueden reemplazarse por preguntas generales de conocimiento común.

---

## 14. Moderación por último puesto

Convención del equipo (no automatizada en el sistema): quien termina último en una fecha queda a cargo de moderar la próxima reunión y de preparar el próximo Kahoot.

Si esa persona se ausenta, modera quien haya salido anteúltimo.

La landing sigue pidiendo elegir el moderador manualmente al cargar cada informe; esta regla es la que el admin debe respetar al elegirlo, no algo que la app calcule sola todavía.

---

## 15. Desafíos 1 vs. 1

Se permiten desafíos entre dos participantes, por fuera del puntaje normal de la fecha.

Para que valga, el desafío debe:

```txt
Acordarse antes de comenzar el juego
Ser aceptado por ambas personas
Definir de antemano cuántos puntos se ponen en juego
```

Gana el desafío quien termine mejor posicionado entre los dos, aunque ninguno ocupe los primeros puestos del Kahoot.

Esto se resuelve hoy como un **ajuste manual** (ver sección 8), con motivo `Desafío 1v1` y el detalle de quién retó a quién.

---

## 16. Cambio de juego

El moderador de la fecha puede proponer un juego distinto al Kahoot, siempre que presente antes de empezar:

```txt
La dinámica del juego
El objetivo
La forma de definir quién gana los puntos
```

La propuesta debe aprobarse antes de arrancar. El puntaje resultante se carga igual que cualquier informe (o como ajuste manual si el juego no genera un Excel exportable).

---

## 17. Desempate

Si al cerrar el período dos o más personas empatan en el primer puesto, se juega un desempate adicional para definir al ganador.

El desempate se hace en una reunión con todos los participantes presentes.

---

## 18. Premio de la copa

Al cerrar cada copa (temporada), quien acumuló más puntos recibe un premio acordado entre todo el equipo. El premio en sí no lo define el sistema.

---

## 19. Panel administrativo (desde el 23/07/2026)

La landing pública y las acciones que modifican puntos quedaron separadas:

```txt
Público (sin login): podio, resultados parciales, campeones, reglas, próximamente.
Administrador (con login): cargar resultados, aplicar descuentos, anular cargas,
anular descuentos, consultar el historial.
```

Acceso: un enlace discreto "Admin" en el footer. Sin sesión, abre un login
(email + contraseña) contra Firebase Authentication. Con sesión de
administrador, abre directo el panel. Hay un único rol: `ADMIN`.

Datos: todo vive en Firestore, en el mismo proyecto `quartzprode2026` que
QuartzProde, bajo sus propias colecciones para no tocar los datos de Prode
ni los de la `qsleague_state` vieja:

```txt
dinocup_users      → {uid, email, role, displayName, createdAt}
dinocup_players    → roster (id, name, alias, house, role, isActive)
dinocup_matches    → una carga por informe de Kahoot
dinocup_movements  → el ledger real de puntos
```

El ranking **nunca** se calcula desde un total guardado en el jugador: se
recalcula sumando los movimientos con estado `APPLIED` cada vez que se
pinta la pantalla (misma lógica de siempre, ahora sobre Firestore en vez de
`localStorage`).

Tipos de movimiento: `REPORT_RESULT`, `ABSENCE_PENALTY`, `REPORT_REVERSAL`,
`PENALTY_REVERSAL`. Estados de carga: `DRAFT` → `PROCESSING` → `APPLIED` /
`ERROR` / `ANNULLED`. Estados de movimiento: `APPLIED` / `ANNULLED`. Nada se
borra: anular una carga o un descuento crea un movimiento inverso y marca el
original como `ANNULLED`, conservando el historial completo.

`dinocup_users/{uid}` nunca se escribe desde el cliente (ni siquiera el
propio usuario): el rol `ADMIN` se asigna a mano desde la consola de
Firebase o el Admin SDK, así nadie puede otorgarse permisos desde el
navegador. Ver `firestore.rules` / `storage.rules` para el detalle de
permisos, y la nota de deploy al principio de esos archivos: hay que
fusionarlos con las reglas que ya tiene `quartzprode2026`, no reemplazarlas.

`localStorage` dejó de usarse para el estado del ranking (Firestore es la
única fuente de verdad); el archivo original de cada informe se guarda en
Firebase Storage, accesible solo para administradores.

---

## 20. Pendiente futuro

Pendientes técnicos:

- formulario de ajuste manual de puntos "genéricos" (hoy Aplicar descuentos
  solo cubre ausencias con -1/-3; sumar puntos sueltos o cargar/quitar un
  meteorito sin ausencia sigue sin una acción dedicada),
- exportación de ranking,
- administración formal de roster y alias desde el panel (hoy `dinocup_players`
  se siembra una sola vez con el roster fijo de `assets/roster.js`),
- cierre de temporada para mandar Arena actual a Leyendas,
- historial de auditoría más allá de lo que ya guarda cada movimiento
  (createdBy/createdByEmail/annulledBy).
