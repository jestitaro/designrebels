/* Dino Cup — base de conocimiento de trivia del equipo para REX.
   Datos provistos por el equipo (encuesta Team Quest interna) — no
   inventar ni mezclar entre personas si se agrega contenido nuevo acá.
   Cada "fact" ya viene redactado en la voz de REX (breve, con el guiño
   prehistórico aplicado solo donde suma, nunca forzado). Roster propio,
   independiente del ROSTER de Dino Cup: acá hay gente que no compite en
   la copa. Expone window.DinoCupTrivia. */
(function () {
  const PEOPLE = [
    {
      id: 'jesi', name: 'Jesi', aliases: ['Jesi', 'Jes', 'Jesica', 'Jesica Titaro'],
      facts: [
        'Es diseñadora y le encanta ilustrar.',
        'Su saga favorita es Jurassic Park. Sí, justo la de este Kahoot.',
        'Su película favorita es El Extraño Mundo de Jack.',
        'Sueña con conocer la Bauhaus, en Alemania.',
        'No se baña los domingos. "Como Shakira", aclara ella.',
        'Si pudiera cenar con una figura histórica, elegiría a John Hammond — "para no reparar en gastos".'
      ]
    },
    {
      id: 'mariana', name: 'Mariana', aliases: ['Mariana'],
      facts: [
        'Trabaja como Admin y su saga favorita es Star Wars.',
        'Una de sus películas favoritas es Big Fish.',
        'Después de dos horas de reunión necesita moverse — la atención empieza a migrar.',
        'Sueña con viajar a Escocia.',
        'Si fuera un personaje de ficción, sería Supergirl. Motivo: quiere volar.',
        'Su meme favorito es el mate cebado con vodka. No hace falta agregar nada.'
      ]
    },
    {
      id: 'loreana', name: 'Loreana', aliases: ['Loreana', 'Lore'],
      facts: [
        'Trabaja en BI y es fan de los Beatles — George Harrison es su favorito.',
        'Tiene una facilidad casi sospechosa para reconocer canciones.',
        'Le interesa el mundo del sonido, además del de los datos.',
        'Sueña con viajar a Escocia.',
        'Quiere profundizar en modelos predictivos e IA aplicada a datos.'
      ]
    },
    {
      id: 'agustin', name: 'Agustín', aliases: ['Agustin', 'Agustín', 'Agus'],
      facts: [
        'Es Director Comercial y le gustan Harry Potter, Friends y Tonto y Retonto.',
        'Toca guitarra y batería.',
        'Confiesa que es chueco, y que se nota cuando corre.',
        'Está convencido de que canta bien — algunos compañeros ya lo escucharon en el campo.',
        'Sueña con conocer Hawái.'
      ]
    },
    {
      id: 'nicolas', name: 'Nicolás', aliases: ['Nicolas', 'Nicolás', 'Nico'],
      facts: [
        'Su rol en la encuesta figura como "COOmander".',
        'Es sommelier.',
        'Tiene un documento llamado "El Cerebro de Nico: Un manual de instrucciones de mí mismo", ya en su versión 2.0.',
        'Su talento oculto es encontrar pasajes de avión baratos.',
        'Sueña con hacer un curso de piloto.',
        'Si fuera un personaje sería Tyrion Lannister — "pero más alto", aclara él.'
      ]
    },
    {
      id: 'sergio', name: 'Sergio', aliases: ['Sergio'],
      facts: [
        'Es desarrollador iOS.',
        'En ocasiones especiales cambia de plumaje: se tiñe el pelo.',
        'Le gusta analizar los sueños de la gente e interpretar posibles significados.',
        'Le gusta cocinar.',
        'Quiere profundizar en IA aplicada a desarrollo, arquitectura y automatización.',
        'Si fuera un personaje sería Morfeo.'
      ]
    },
    {
      id: 'mayra', name: 'Mayra', aliases: ['Mayra', 'May'],
      facts: [
        'Es colíder de IA.',
        'Se considera "10% brasilera" por las conexiones que siempre tuvo con Brasil y su gente.',
        'Probó de todo: ritmos, natación, patín, gimnasia rítmica, béisbol, fútbol, Modelos de Naciones Unidas, teatro, voluntariados.',
        'Su talento oculto es Zumba.',
        'Sueña con ser trilingüe y hablar inglés tan suelta como portugués y español.',
        'Sufre de FOMO, sobre todo cuando el equipo está reunido en CABA y ella no.'
      ]
    },
    {
      id: 'pablo', name: 'Pablo', aliases: ['Pablo', 'Tuki', 'Pablo Gimenez', 'Pablo Giménez'],
      facts: [
        'Su equipo en la encuesta figura como "Los peces del infierno".',
        'Lleva más de 3000 días seguidos de racha en Duolingo — esa racha se niega a extinguirse.',
        'Le gustan Matrix, The Office y la saga Volver al Futuro.',
        'Sus hobbies son los videojuegos y los juegos de mesa.',
        'Si fuera un personaje sería Sherlock Holmes.',
        'Admira a Messi.'
      ]
    },
    {
      id: 'julieta', name: 'Julieta', aliases: ['Julieta', 'Juli', 'Picci', 'Julieta Piccioni'],
      facts: [
        'Trabaja en Comercial y su película favorita es Jurassic Park — la original, la de 1993.',
        'Tiene un posgrado en Exploración y Producción de Petróleo. Sabe de excavaciones de verdad.',
        'Es agente de viajes certificada.',
        'Puede tocarse la nariz con la lengua.',
        'Sueña con mudarse a Australia.'
      ]
    },
    {
      id: 'valeria', name: 'Valeria', aliases: ['Valeria', 'Vale'],
      facts: [
        'Trabaja en BI y le encanta cantar — de chica estudió canto y cantaba folklore con su papá.',
        'Colecciona llaveros.',
        'Puede hacer grullas de origami con los papeles de los chicles.',
        'Sueña con tener casa propia y viajar todo lo que pueda.',
        'Si fuera un personaje sería el Burro de Shrek.'
      ]
    },
    {
      id: 'sebastian', name: 'Sebastián', aliases: ['Sebastian', 'Sebastián', 'Sebas', 'Sebi', 'Carnota', 'Sebastian Carnota'],
      facts: [
        'Su rol en la encuesta figura como "Maestro Jedi".',
        'Le gustan Star Wars, Game of Thrones y el cine en general.',
        'Dice ser más alto de lo que parece.',
        'Canta y toca la guitarra.',
        'Sueña con ver un partido de los Chicago Bulls en el United Center.',
        'Si fuera un personaje sería Tony Stark.'
      ]
    },
    {
      id: 'david', name: 'David Troila', aliases: ['David', 'David Troila', 'Troila'],
      facts: [
        'Trabaja en Desarrollo Mobile y ganó dos concursos de memes en su primer trabajo.',
        'Tiene paciencia y deducción para armar y desarmar cosas.',
        'Le gustan Terminator 2, Interstellar y El Señor de los Anillos.',
        'Sueña con vivir solo.',
        'Si fuera un personaje sería Gandalf.'
      ]
    },
    {
      id: 'adolfo', name: 'Adolfo', aliases: ['Adolfo'],
      facts: [
        'Trabaja en Infraestructura y puede hacer una mortal siendo bastante alto.',
        'Toca la guitarra.',
        'Practica MMA.',
        'Sueña con manejar una CBR 600.',
        'Si fuera un personaje sería Soldier Boy.'
      ]
    },
    {
      id: 'javi', name: 'Javi', aliases: ['Javi', 'Javier', 'Javier De Vergilio'],
      facts: [
        'Trabaja en BI "y otros menesteres".',
        'Colecciona chupitos de todo el mundo.',
        'Su talento es ordenar.',
        'Sueña con restaurar un auto antiguo.',
        'Su videojuego favorito es Age of Empires II.',
        'Si fuera un personaje sería Ikki, el Caballero del Fénix.'
      ]
    },
    {
      id: 'jona', name: 'Jona', aliases: ['Jona', 'Jonathan'],
      facts: [
        'Trabaja en Desarrollo y ya recorrió casi todas las provincias de Ecuador.',
        'Sabe jugar Pump It Up, la máquina de baile.',
        'Le encanta viajar.',
        'Sueña con viajar por el mundo entero.',
        'Si fuera un personaje sería Rajesh, de The Big Bang Theory.'
      ]
    },
    {
      id: 'francisco', name: 'Francisco', aliases: ['Francisco', 'Fran'],
      facts: [
        'Trabaja en Desarrollo y, hasta ahora, nunca se rompió ninguna extremidad. Estado de conservación excepcional.',
        'Tiene facilidad para aprender a tocar instrumentos musicales.',
        'Le gustan la música, el camping y los videojuegos.',
        'Sueña con hacer varios viajes con su nena.',
        'Si fuera un personaje sería Michael Scott.'
      ]
    },
    {
      id: 'franco', name: 'Franco Rivero Segura', aliases: ['Franco', 'Franco Rivero Segura', 'Rivero Segura'],
      facts: [
        'Fue influencer de cine.',
        'Le gustan el gym y el cine.',
        'Quiere dedicarse más al arte y a crear.',
        'Le gustaría aprender fotografía.',
        'Le gustan La La Land, Star Wars y Game of Thrones.',
        'Sus artistas favoritos son Twenty One Pilots y Ed Sheeran.'
      ]
    },
    {
      id: 'guillermo', name: 'Guillermo', aliases: ['Guillermo', 'Guille'],
      facts: [
        'Trabaja en Desarrollo de Software y tiene a Harry Styles tatuado en el brazo.',
        'Sueña con hacer el curso AFF de paracaidismo.',
        'Toca el bajo.',
        'Le gustan Harry Potter, Dr. House y Red Hot Chili Peppers.',
        'Si fuera un personaje sería Flash.'
      ]
    },
    {
      id: 'menta', name: 'Menta', aliases: ['Menta', 'Matias', 'Matías', 'Matias Herrera', 'Matías Herrera'],
      facts: [
        'Trabaja en Backend. Antes fue tornero durante 11 años — un buen hallazgo en la excavación de su pasado laboral.',
        'Es autodidacta.',
        'Su hobby es la panadería.',
        'Sueña con hacer funcionar un negocio propio.',
        'Si fuera un personaje sería Michael Scott.'
      ]
    },
    {
      id: 'lucrecia', name: 'Lucrecia', aliases: ['Lucrecia', 'Lucre', 'Luly'],
      facts: [
        'De chica tuvo de mascotas un puma, un lagarto y un zorrino, entre otros animales.',
        'Todavía hace backflip en la pileta.',
        'Le gusta leer.',
        'Sueña con conocer Egipto.',
        'Quiere dominar la IA "como una PRO", palabras textuales.',
        'Si fuera un personaje sería Po, de Kung Fu Panda.'
      ]
    },
    {
      id: 'eugenio', name: 'Eugenio', aliases: ['Eugenio', 'Euge'],
      facts: [
        'Es Líder Técnico y le gusta mucho el silencio.',
        'Le gusta cocinar.',
        'Su película favorita es Star Wars: Episodio V.',
        'Practica culturismo.',
        'Quiere aprender n8n.'
      ]
    },
    {
      id: 'ciro', name: 'Ciro', aliases: ['Ciro'],
      facts: [
        'Durante la pandemia, alrededor de los 15 años, tuvo una cuenta de Instagram bastante conocida en el ambiente del turf.',
        'Fue entrevistado por Revista Palermo.',
        'Su talento es correr.',
        'Le gustan los autos y los caballos.',
        'Sueña con viajar con su abuela.',
        'Si fuera un personaje sería Shaggy, de Scooby-Doo.'
      ]
    }
  ];

  window.DinoCupTrivia = { PEOPLE };
})();
