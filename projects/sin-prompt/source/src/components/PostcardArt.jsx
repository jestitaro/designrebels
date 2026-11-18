// Frente de cada postal, en SVG (600×400). Mismo SVG se usa en pantalla y
// para exportar a PNG, así lo que ves es exactamente lo que se descarga.
import { forwardRef } from 'react';

export const C = {
  violet: '#7025E0',
  lilac: '#A172FF',
  navy: '#130D5D',
  white: '#FFFFFF',
  blue: '#3C9FF1',
  paper: '#F3F1FA',
  navy2: '#221A86',
};
const SANS = "Poppins, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";

const Lines = ({ x, y, size, lh = 1.18, fill, weight = 600, lines, ls = -0.02, family = SANS }) => (
  <text x={x} y={y} fontFamily={family} fontSize={size} fontWeight={weight} fill={fill} letterSpacing={`${ls}em`}>
    {lines.map((l, i) => (
      <tspan key={i} x={x} dy={i === 0 ? 0 : size * lh}>
        {l}
      </tspan>
    ))}
  </text>
);
const Mono = ({ x, y, size = 12, fill, children, anchor = 'start', opacity = 1, weight = 400 }) => (
  <text x={x} y={y} fontFamily={MONO} fontSize={size} fill={fill} textAnchor={anchor} opacity={opacity} fontWeight={weight} letterSpacing="0.04em">
    {children}
  </text>
);
const Footer = ({ fill }) => (
  <Mono x={560} y={376} size={9} fill={fill} anchor="end" opacity={0.6}>
    QS · SIN PROMPT · 2026
  </Mono>
);

// ── Diseños ────────────────────────────────────────────────────────────────
function Commit() {
  const levels = [0, 1, 2, 3, 4];
  const cx = 470;
  const colors = [C.white, C.lilac, C.blue, C.white, C.lilac];
  return (
    <>
      <rect width="600" height="400" fill={C.navy} />
      <Mono x={40} y={62} fill={C.lilac} size={12}>~/quartzsales  (main)</Mono>
      <Mono x={40} y={150} fill={C.white} size={20}>$ git commit -m</Mono>
      <Lines x={40} y={206} size={42} fill={C.white} lines={['"Gracias por', 'este año"']} />
      <Mono x={40} y={336} fill={C.lilac} size={11} opacity={0.85}>[main 2026] 1 equipo, ∞ insertions(+)</Mono>
      <line x1={cx} y1={66} x2={cx} y2={330} stroke={C.lilac} strokeWidth="3" />
      {levels.map((i) => {
        const y = 92 + i * 46;
        const hw = 20 + i * 18;
        return (
          <g key={i}>
            <path d={`M${cx} ${y} Q ${cx - hw * 0.4} ${y + 6} ${cx - hw} ${y + 34}`} stroke={C.lilac} strokeWidth="2.5" fill="none" />
            <path d={`M${cx} ${y} Q ${cx + hw * 0.4} ${y + 6} ${cx + hw} ${y + 34}`} stroke={C.lilac} strokeWidth="2.5" fill="none" />
            <circle cx={cx - hw} cy={y + 34} r="7" fill={colors[i]} />
            <circle cx={cx + hw} cy={y + 34} r="7" fill={colors[(i + 2) % 5]} />
            <circle cx={cx} cy={y} r="5" fill={C.navy} stroke={C.lilac} strokeWidth="2.5" />
          </g>
        );
      })}
      <path d={`M${cx} 44 l7 13 h-14z`} fill={C.white} />
      <rect x={cx - 9} y={330} width="18" height="18" fill={C.lilac} />
      <Footer fill={C.lilac} />
    </>
  );
}

function Encaje() {
  const tiers = [
    { apex: 64, base: 150, hw: 62, l: C.violet, r: C.lilac },
    { apex: 116, base: 230, hw: 90, l: C.lilac, r: C.navy },
    { apex: 176, base: 310, hw: 118, l: C.navy, r: C.violet },
  ];
  const cx = 455;
  return (
    <>
      <rect width="600" height="400" fill={C.paper} />
      <Mono x={40} y={62} fill={C.violet} size={11} weight={600}>DISEÑO · GRILLA 8PX · 2026</Mono>
      <Lines x={40} y={200} size={38} fill={C.navy} lines={['Gracias por', 'hacer que todo', 'encaje.']} />
      {tiers.map((t, i) => (
        <g key={i} stroke={C.paper} strokeWidth="4" strokeLinejoin="round">
          <polygon points={`${cx},${t.apex} ${cx - t.hw},${t.base} ${cx},${t.base}`} fill={t.l} />
          <polygon points={`${cx},${t.apex} ${cx},${t.base} ${cx + t.hw},${t.base}`} fill={t.r} />
        </g>
      ))}
      <rect x={cx - 18} y={314} width="36" height="34" fill={C.blue} />
      <circle cx={cx} cy={46} r="11" fill={C.blue} />
      <g stroke={C.violet} strokeWidth="1" opacity="0.35" strokeDasharray="3 4">
        <line x1={cx} y1={20} x2={cx} y2={370} />
        <line x1={320} y1={310} x2={590} y2={310} />
      </g>
      <Footer fill={C.navy} />
    </>
  );
}

function Uptime() {
  const cx = 462;
  const leds = [C.blue, C.lilac, C.white];
  return (
    <>
      <rect width="600" height="400" fill={C.navy} />
      <Mono x={40} y={62} fill={C.lilac} size={12}>uptime: 365d 00h 00m · status: OK</Mono>
      <Lines x={40} y={176} size={34} fill={C.white} lines={['Que lo único', 'que se caiga', 'sea el año.']} />
      {[0, 1, 2, 3, 4].map((i) => {
        const w = 66 + i * 34;
        const y = 104 + i * 46;
        return (
          <g key={i}>
            <rect x={cx - w / 2} y={y} width={w} height={34} rx="6" fill={C.navy2} stroke={C.lilac} strokeOpacity="0.5" />
            {Array.from({ length: 2 + i }).map((_, j) => (
              <circle key={j} cx={cx - w / 2 + 16 + j * 14} cy={y + 17} r="4" fill={leds[(i + j) % 3]} />
            ))}
            <rect x={cx + w / 2 - 34} y={y + 14} width="20" height="6" rx="3" fill={C.lilac} opacity="0.5" />
          </g>
        );
      })}
      <g fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round">
        <path d={`M${cx - 26} 72 a 36 36 0 0 1 52 0`} />
        <path d={`M${cx - 14} 84 a 20 20 0 0 1 28 0`} />
      </g>
      <circle cx={cx} cy={94} r="5" fill={C.white} />
      <rect x={cx - 10} y={334} width="20" height="22" fill={C.lilac} />
      <Footer fill={C.lilac} />
    </>
  );
}

function Metas() {
  const bars = Array.from({ length: 9 }, (_, i) => i);
  const base = 336;
  return (
    <>
      <rect width="600" height="400" fill={C.white} />
      <Mono x={40} y={62} fill={C.violet} size={11} weight={600}>Q1 · Q2 · Q3 · Q4 · 2026</Mono>
      <Lines x={40} y={176} size={36} fill={C.navy} lines={['Por todas', 'las metas que', 'compartimos.']} />
      <Mono x={40} y={336} fill={C.violet} size={13} weight={600}>+100% equipo</Mono>
      {bars.map((i) => {
        const h = 36 + (4 - Math.abs(i - 4)) * 52;
        return (
          <rect key={i} x={352 + i * 24} y={base - h} width="18" height={h} rx="3" fill={i % 2 ? C.lilac : C.violet} opacity={0.55 + (4 - Math.abs(i - 4)) * 0.11} />
        );
      })}
      <line x1={340} y1={base + 0.5} x2={570} y2={base + 0.5} stroke={C.navy} strokeWidth="2" />
      <line x1={461} y1={base - 244} x2={461} y2={base - 280} stroke={C.navy} strokeWidth="2" />
      <path d={`M461 ${base - 280} h26 l-7 8 l7 8 h-26z`} fill={C.navy} />
      <Footer fill={C.navy} />
    </>
  );
}

function Aprobado() {
  const items = ['paciencia', 'criterio', 'buena onda', 'café'];
  return (
    <>
      <rect width="600" height="400" fill={C.violet} />
      <Lines x={40} y={92} size={34} fill={C.white} lines={['Probado y aprobado:', 'trabajar con vos.']} />
      {items.map((t, i) => (
        <g key={t} transform={`translate(40 ${196 + i * 30})`}>
          <rect width="18" height="18" rx="4" fill={C.white} />
          <path d="M4 9.5 l3.5 3.5 l7-8" stroke={C.violet} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Mono x={30} y={14} fill={C.white} size={14}>{t}</Mono>
        </g>
      ))}
      <rect x={40} y={330} width="122" height="26" rx="13" fill={C.navy} />
      <Mono x={101} y={347} fill={C.white} size={11} anchor="middle" weight={600}>PASSED 4/4</Mono>
      <circle cx={468} cy={250} r="92" fill="none" stroke={C.lilac} strokeWidth="2" strokeDasharray="4 6" />
      <path d="M418 252 l34 34 l70 -82" stroke={C.white} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Footer fill={C.white} />
    </>
  );
}

function Hecho() {
  const cols = ['POR HACER', 'EN CURSO', 'HECHO'];
  return (
    <>
      <rect width="600" height="400" fill={C.paper} />
      <Mono x={40} y={62} fill={C.violet} size={11} weight={600}>SPRINT FINAL · 2026</Mono>
      <Lines x={40} y={176} size={34} fill={C.navy} lines={['Gracias por', 'priorizar lo', 'importante.']} />
      {cols.map((c, i) => {
        const x = 330 + i * 86;
        return (
          <g key={c}>
            <rect x={x} y={56} width="78" height="292" rx="8" fill={C.white} />
            <Mono x={x + 10} y={78} fill={C.navy} size={8.5} weight={600} opacity={0.7}>{c}</Mono>
            {i < 2 &&
              [0, 1, 2 - i].map((j) => (
                <rect key={j} x={x + 8} y={92 + j * 40} width="62" height="30" rx="5" fill={C.lilac} opacity={0.25 + j * 0.1} />
              ))}
          </g>
        );
      })}
      <g transform="rotate(-6 543 160)">
        <rect x={505} y={128} width="76" height="64" rx="8" fill={C.violet} />
        <text x={543} y={168} fontFamily={SANS} fontWeight={700} fontSize="22" fill={C.white} textAnchor="middle">2026</text>
      </g>
      <path d="M470 160 q 18 -26 30 -4" stroke={C.violet} strokeWidth="2" fill="none" strokeDasharray="3 4" />
      <Footer fill={C.navy} />
    </>
  );
}

function Correlacion() {
  // puntos determinísticos dentro de un triángulo
  const pts = [];
  let s = 7;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  while (pts.length < 64) {
    const x = 340 + r() * 220;
    const y = 70 + r() * 250;
    const half = ((y - 70) / 250) * 110;
    if (Math.abs(x - 450) < half) pts.push([x, y]);
  }
  return (
    <>
      <rect width="600" height="400" fill={C.navy} />
      <Mono x={40} y={62} fill={C.blue} size={12}>r = 0.99 · p &lt; 0.01</Mono>
      <Lines x={40} y={176} size={29} fill={C.white} lines={['Correlación', 'positiva: vos y', 'los buenos días.']} />
      <g stroke={C.lilac} strokeOpacity="0.5">
        <line x1={330} y1={340} x2={575} y2={340} />
        <line x1={330} y1={50} x2={330} y2={340} />
      </g>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 6 : 3.5} fill={i % 3 === 0 ? C.lilac : i % 3 === 1 ? C.white : C.blue} opacity={i % 7 === 0 ? 1 : 0.85} />
      ))}
      <line x1={340} y1={330} x2={570} y2={62} stroke={C.lilac} strokeWidth="2" strokeDasharray="6 5" />
      <rect x={442} y={322} width="16" height="18" fill={C.lilac} />
      <Footer fill={C.lilac} />
    </>
  );
}

function OtroLado() {
  return (
    <>
      <rect width="600" height="400" fill={C.lilac} />
      <g>
        <rect x={40} y={48} width="236" height="54" rx="20" fill={C.white} />
        <text x={62} y={82} fontFamily={SANS} fontSize="18" fontWeight={500} fill={C.navy}>¿Hay alguien ahí?</text>
        <rect x={392} y={118} width="168" height="54" rx="20" fill={C.navy} />
        <text x={414} y={152} fontFamily={SANS} fontSize="18" fontWeight={600} fill={C.white}>Siempre.</text>
        <rect x={40} y={188} width="78" height="40" rx="18" fill={C.white} opacity="0.7" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={62 + i * 16} cy={208} r="5" fill={C.violet} opacity={0.5 + i * 0.25} />
        ))}
      </g>
      <Lines x={40} y={300} size={30} fill={C.navy} lines={['Gracias por estar siempre', 'del otro lado.']} />
      <Footer fill={C.navy} />
    </>
  );
}

function Cuidarnos() {
  const rows = [[460], [436, 484], [412, 460, 508], [388, 436, 484, 532]];
  const fills = [C.violet, C.lilac, C.blue, C.navy];
  return (
    <>
      <rect width="600" height="400" fill={C.paper} />
      <Mono x={40} y={62} fill={C.violet} size={11} weight={600}>PEOPLE · CULTURA · 2026</Mono>
      <Lines x={40} y={180} size={27} fill={C.navy} lines={['Gracias por cuidar', 'lo que no sale en', 'ningún tablero.']} />
      {rows.map((row, ri) =>
        row.map((x, i) => (
          <circle key={`${ri}-${i}`} cx={x} cy={96 + ri * 54} r="34" fill={fills[(ri + i) % 4]} opacity={0.82} style={{ mixBlendMode: 'multiply' }} />
        )),
      )}
      <rect x={450} y={290} width="20" height="50" fill={C.navy} />
      <Footer fill={C.navy} />
    </>
  );
}

function Kilometros() {
  const pts = [
    [460, 330], [380, 300], [530, 250], [400, 210], [505, 165], [425, 125], [460, 70],
  ];
  return (
    <>
      <rect width="600" height="400" fill={C.white} />
      <Mono x={40} y={62} fill={C.violet} size={11} weight={600}>PDV 001 → PDV 999</Mono>
      <Lines x={40} y={176} size={33} fill={C.navy} lines={['Por cada', 'kilómetro que', 'hicimos juntos.']} />
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.lilac} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {i === pts.length - 1 ? (
            <path d="M0 -26 l7 16 l17 2 l-13 11 l4 17 l-15 -9 l-15 9 l4 -17 l-13 -11 l17 -2z" fill={C.violet} />
          ) : (
            <>
              <path d="M0 0 c-12 -14 -12 -26 0 -26 c12 0 12 12 0 26z" fill={i % 2 ? C.navy : C.violet} />
              <circle cx="0" cy="-16" r="4" fill={C.white} />
            </>
          )}
        </g>
      ))}
      <Footer fill={C.navy} />
    </>
  );
}

function Cursor() {
  return (
    <>
      <rect width="600" height="400" fill={C.paper} />
      <Lines x={40} y={96} size={40} fill={C.navy} lines={['Esto no lo escribió', 'ninguna IA.']} />
      <rect x={40} y={210} width="520" height="70" rx="35" fill={C.white} stroke={C.navy} strokeOpacity="0.12" />
      <Mono x={76} y={251} fill={C.navy} size={15} opacity={0.35}>Escribí lo que quieras…</Mono>
      <rect x={72} y={232} width="3" height="28" fill={C.violet}>
        <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite" />
      </rect>
      <circle cx={524} cy={245} r="21" fill={C.navy} opacity="0.12" />
      <path d="M524 255 v-18 m-7 7 l7 -7 l7 7" stroke={C.navy} strokeOpacity="0.4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Mono x={40} y={330} fill={C.violet} size={12} weight={600}>0 tokens · 100% persona</Mono>
      <Footer fill={C.navy} />
    </>
  );
}

function Bloques() {
  const rows = [1, 2, 3, 4];
  const fills = [C.white, C.lilac, C.navy, C.white];
  const unit = 40;
  return (
    <>
      <rect width="600" height="400" fill={C.violet} />
      <Lines x={40} y={92} size={34} fill={C.white} lines={['Este año lo', 'armamos entre', 'todos.']} />
      {rows.map((n, ri) => {
        const w = n * unit + 16;
        const y = 92 + ri * 52;
        const x = 470 - w / 2;
        return (
          <g key={ri}>
            {Array.from({ length: n + 1 }).map((_, j) => (
              <rect key={j} x={x + 12 + j * (w - 24) / Math.max(n, 1) - 7} y={y - 7} width="14" height="8" rx="2" fill={fills[ri]} />
            ))}
            <rect x={x} y={y} width={w} height="42" rx="4" fill={fills[ri]} />
            <rect x={x} y={y + 34} width={w} height="8" rx="2" fill={C.navy} opacity="0.18" />
          </g>
        );
      })}
      <rect x={452} y={300} width="36" height="40" rx="4" fill={C.navy} />
      <path d="M470 44 l10 18 h-20z" fill={C.white} />
      <Footer fill={C.white} />
    </>
  );
}

function Cierre() {
  return (
    <>
      <rect width="600" height="400" fill={C.navy} />
      <text x={300} y={238} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize="190" fill="none" stroke={C.lilac} strokeWidth="2" letterSpacing="-0.04em">2026</text>
      <g transform="translate(486 70)">
        <circle r="26" fill={C.violet} />
        <circle cx="-7" cy="-9" r="4" fill="none" stroke={C.white} strokeWidth="2.4" />
        <circle cx="-7" cy="10" r="4" fill="none" stroke={C.white} strokeWidth="2.4" />
        <circle cx="8" cy="2" r="4" fill="none" stroke={C.white} strokeWidth="2.4" />
        <path d="M-7 -5 v11 M-7 -2 q0 4 11 4" stroke={C.white} strokeWidth="2.4" fill="none" />
      </g>
      <Mono x={40} y={62} fill={C.lilac} size={12}>status: merged</Mono>
      <Lines x={40} y={306} size={28} fill={C.white} lines={['Cerrado, mergeado', 'y agradecido.']} />
      <Footer fill={C.lilac} />
    </>
  );
}

const ART = {
  commit: Commit,
  encaje: Encaje,
  uptime: Uptime,
  metas: Metas,
  aprobado: Aprobado,
  hecho: Hecho,
  correlacion: Correlacion,
  otrolado: OtroLado,
  cuidarnos: Cuidarnos,
  kilometros: Kilometros,
  cursor: Cursor,
  bloques: Bloques,
  cierre: Cierre,
};

/** Frente de la postal. `drawing` (dataURL o URL) reemplaza al diseño. */
const PostcardArt = forwardRef(function PostcardArt({ designId, drawing, title, className, style }, ref) {
  const Art = ART[designId] || Cursor;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 400"
      className={className}
      style={style}
      role="img"
      aria-label={title || (drawing ? 'Postal dibujada a mano' : 'Postal')}
    >
      {drawing ? <image href={drawing} x="0" y="0" width="600" height="400" preserveAspectRatio="xMidYMid slice" /> : <Art />}
    </svg>
  );
});

export default PostcardArt;
