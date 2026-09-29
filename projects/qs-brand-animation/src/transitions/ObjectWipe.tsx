import React from 'react';
import { HEIGHT, WIDTH } from '../lib/time';

type Props = {
  /** 0 = objeto en su posición inicial, 1 = objeto cubre todo el frame */
  progress: number;
  /** tamaño del objeto a escala 1 */
  width: number;
  height: number;
  /** centro inicial del objeto en el frame */
  fromX: number;
  fromY: number;
  /** rotación inicial; termina en 0 */
  fromRotate?: number;
  children: React.ReactNode;
};

/**
 * El objeto viaja hacia cámara y crece hasta cubrir el frame (cover + 4 %).
 * Al llegar a 1, la escena siguiente arranca con ese mismo objeto como fondo/pantalla.
 */
export const ObjectWipe: React.FC<Props> = ({ progress, width, height, fromX, fromY, fromRotate = -6, children }) => {
  // progress llega con curva (progressAt / springAt), igual que la prop progress de los componentes de UI
  const p = Math.min(1, Math.max(0, progress));
  const cover = Math.max(WIDTH / width, HEIGHT / height) * 1.04;
  // escala en espacio log para que el acercamiento se sienta constante
  const scale = Math.exp(Math.log(1) + (Math.log(cover) - Math.log(1)) * p);
  const x = fromX + (WIDTH / 2 - fromX) * p;
  const y = fromY + (HEIGHT / 2 - fromY) * p;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: `translate(-50%, -50%) rotate(${fromRotate * (1 - p)}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    >
      {children}
    </div>
  );
};
