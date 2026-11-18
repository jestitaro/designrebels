// Íconos lineales propios (24×24, trazo 1.8). Decorativos por defecto.
const P = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  pen: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3',
  eraser: 'M8 20h12M5 15l8-8 6 6-6 6H9l-4-4z',
  text: 'M5 6V5h14v1M12 5v14M9 19h6',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
  tree: 'M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7l5-6zM12 19v2',
  play: 'M7 5l12 7-12 7V5z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  shuffle: 'M4 7h3c5 0 5 10 10 10h3M17 14l3 3-3 3M4 17h3c1.5 0 2.5-.8 3.3-2M14 9c.8-1.2 1.8-2 3-2h3M17 4l3 3-3 3',
  rotateL: 'M4 12a8 8 0 108-8H8M8 1L5 4l3 3',
  rotateR: 'M20 12a8 8 0 11-8-8h4M16 1l3 3-3 3',
  menu: 'M4 8h16M4 16h16',
  flip: 'M4 9h13l-3-3M20 15H7l3 3',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4.5-6 8-6s7 2 8 6',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5v.5',
};

export default function Icon({ name, size = 20, stroke = 1.8, className, label }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={P[name]} />
    </svg>
  );
}
