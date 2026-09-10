/* QuartzEight — banco de cartas.
 * Cada carta tiene una categoría (el "mazo": producto, diseño, ia,
 * negocio, usuario, comodín) y un tipo transversal (diagnóstico,
 * contexto, confianza, dirección) que sirve para filtrar al cambiar
 * una carta, sin importar de qué mazo salió.
 */
var QUARTZ8_CATEGORIES = {
  producto: 'Producto',
  diseno: 'Diseño',
  ia: 'IA',
  negocio: 'Negocio',
  usuario: 'Usuario',
  comodin: 'Comodín'
};

var QUARTZ8_TIPOS = {
  diagnostico: 'Diagnóstico',
  contexto: 'Contexto',
  confianza: 'Confianza',
  direccion: 'Dirección'
};

var QUARTZ8_CARDS = [
  { id: 'p1', category: 'producto', tipo: 'contexto', title: 'Contá el problema real', prompt: '¿Qué problema estás resolviendo realmente? Contalo sin mencionar la solución.' },
  { id: 'p2', category: 'producto', tipo: 'diagnostico', title: 'Encontrá el punto ciego', prompt: '¿Qué parte de la idea todavía no probaste con nadie?' },
  { id: 'p3', category: 'producto', tipo: 'direccion', title: 'Definí el primer paso', prompt: 'Si solo pudieras construir una pantalla o funcionalidad esta semana, ¿cuál sería?' },
  { id: 'p4', category: 'producto', tipo: 'confianza', title: 'Verificá el valor', prompt: '¿Por qué alguien elegiría esto en vez de seguir haciéndolo como hasta ahora?' },
  { id: 'p5', category: 'producto', tipo: 'diagnostico', title: 'Simplificá al extremo', prompt: '¿Qué podrías sacar por completo y que la idea siga resolviendo el problema?' },

  { id: 'd1', category: 'diseno', tipo: 'contexto', title: 'Mirá la jerarquía', prompt: '¿Qué es lo primero que ve alguien al entrar? ¿Es lo que más importa?' },
  { id: 'd2', category: 'diseno', tipo: 'diagnostico', title: 'Buscá la confusión', prompt: '¿En qué parte del flujo alguien podría trabarse o dudar?' },
  { id: 'd3', category: 'diseno', tipo: 'confianza', title: 'Probá la accesibilidad', prompt: '¿Esto funciona igual de bien para alguien que no distingue los colores o usa el teclado?' },
  { id: 'd4', category: 'diseno', tipo: 'direccion', title: 'Elegí un estado', prompt: '¿Cómo se ve esta pantalla vacía, cargando o con un error?' },
  { id: 'd5', category: 'diseno', tipo: 'diagnostico', title: 'Cuestioná el patrón', prompt: '¿Estás usando este componente porque es el correcto o porque ya existía?' },

  { id: 'i1', category: 'ia', tipo: 'contexto', title: 'Definí el rol', prompt: '¿La IA reemplaza una tarea, la asiste o solo sugiere? ¿Quién decide al final?' },
  { id: 'i2', category: 'ia', tipo: 'diagnostico', title: 'Buscá el riesgo', prompt: '¿Qué pasa si la IA se equivoca acá? ¿Alguien lo nota a tiempo?' },
  { id: 'i3', category: 'ia', tipo: 'confianza', title: 'Medí la confianza', prompt: '¿Cómo sabe la persona que puede confiar en esta respuesta?' },
  { id: 'i4', category: 'ia', tipo: 'direccion', title: 'Marcá el límite', prompt: '¿Qué no debería hacer nunca esta IA, aunque técnicamente pudiera?' },
  { id: 'i5', category: 'ia', tipo: 'diagnostico', title: 'Buscá el dato', prompt: '¿De dónde sale la información que la IA necesita, y quién la mantiene actualizada?' },

  { id: 'n1', category: 'negocio', tipo: 'contexto', title: 'Nombrá quién paga', prompt: '¿Quién se beneficia directamente de esto, y quién lo paga?' },
  { id: 'n2', category: 'negocio', tipo: 'diagnostico', title: 'Medí lo real', prompt: '¿Cómo vas a saber, con un número, que esto funcionó?' },
  { id: 'n3', category: 'negocio', tipo: 'confianza', title: 'Calculá el costo', prompt: '¿Cuánto cuesta no hacer esto? ¿Alguien ya lo está pagando?' },
  { id: 'n4', category: 'negocio', tipo: 'direccion', title: 'Pensá en escala', prompt: 'Si esto funciona con 10 personas, ¿sigue funcionando con 1000?' },
  { id: 'n5', category: 'negocio', tipo: 'diagnostico', title: 'Buscá el freno', prompt: '¿Qué podría hacer que esto nunca se adopte, aunque esté bien construido?' },

  { id: 'u1', category: 'usuario', tipo: 'contexto', title: 'Ponete en su lugar', prompt: '¿Qué sabe esta persona antes de llegar acá? ¿Qué no sabe?' },
  { id: 'u2', category: 'usuario', tipo: 'diagnostico', title: 'Buscá el malentendido', prompt: '¿Qué palabra o ícono podría interpretarse distinto de lo que pensás?' },
  { id: 'u3', category: 'usuario', tipo: 'confianza', title: 'Escuchá la queja', prompt: 'Si esto no existiera, ¿de qué se estaría quejando esta persona ahora mismo?' },
  { id: 'u4', category: 'usuario', tipo: 'direccion', title: 'Seguí después del click', prompt: '¿Qué hace esta persona un minuto después de usar esto?' },
  { id: 'u5', category: 'usuario', tipo: 'diagnostico', title: 'Cuestioná la necesidad', prompt: '¿Esto lo pidió alguien, o alguien lo asumió por ellos?' },

  { id: 'c1', category: 'comodin', tipo: 'direccion', title: 'Cambiá de formato', prompt: 'Si esto no pudiera ser una pantalla, ¿cómo se resolvería?' },
  { id: 'c2', category: 'comodin', tipo: 'diagnostico', title: 'Sumale un límite', prompt: '¿Qué pasaría si tuvieras la mitad del tiempo para hacerlo?' },
  { id: 'c3', category: 'comodin', tipo: 'confianza', title: 'Contalo en voz alta', prompt: 'Explicá la idea en una frase a alguien que no sabe nada del proyecto.' },
  { id: 'c4', category: 'comodin', tipo: 'contexto', title: 'Invertí el problema', prompt: '¿Cómo harías esto peor a propósito? ¿Qué te dice eso?' },
  { id: 'c5', category: 'comodin', tipo: 'diagnostico', title: 'Buscá lo obvio', prompt: '¿Cuál es la solución más aburrida y evidente que todavía no probaste?' }
];
