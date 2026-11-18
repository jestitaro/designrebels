// Pieza 3D tipo bloque de construcción, hecha con CSS 3D (sin WebGL).
// Unidades en px. x/y/z = centro de la pieza. y negativo = arriba.
export default function Brick({ x = 0, y = 0, z = 0, w, h, d, color = '#7025E0', studs = true, className = '', style, ghost = false, children, ...rest }) {
  const vars = {
    '--w': `${w}px`,
    '--h': `${h}px`,
    '--d': `${d}px`,
    '--c': color,
    transform: `translate3d(${x}px, ${y}px, ${z}px)`,
    ...style,
  };
  return (
    <div className={`brick ${ghost ? 'is-ghost' : ''} ${studs ? 'has-studs' : ''} ${className}`} style={vars} {...rest}>
      <i className="f f-front" />
      <i className="f f-back" />
      <i className="f f-right" />
      <i className="f f-left" />
      <i className="f f-top" />
      {children}
    </div>
  );
}
