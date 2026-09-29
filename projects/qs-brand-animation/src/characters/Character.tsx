import React from 'react';
import { Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { CharacterName, characterPoses, characterSrc } from '../assets';
import { breathe } from '../lib/easing';
import { AssetPlaceholder } from '../brand/AssetPlaceholder';

type Props = {
  who: CharacterName;
  /** nombre de archivo sin .png. El swap de pose se hace cambiando este valor en un frame de movimiento. */
  pose: string;
  /** alto final en px. La escala es siempre uniforme: el ancho sale del PNG. */
  height: number;
  /** posición del pie (ancla inferior-centro) en coordenadas de la capa */
  x: number;
  y: number;
  /** respiración en translateY, clamp 2–4 px. 0 la desactiva. */
  breath?: number;
  /** fase para que Caro y Nico no respiren sincronizados */
  phase?: number;
  /** espejo horizontal (no deforma) */
  flip?: boolean;
  opacity?: number;
  tone?: 'light' | 'dark';
};

/**
 * PNG aprobado de Caro / Nico. Se anima solo con posición, parallax (vía DepthLayer),
 * cambios de pose y respiración. No se redibuja, no se deforma, no se recolorea.
 * Si el PNG todavía no está en /public, muestra un placeholder rotulado del mismo alto.
 */
export const Character: React.FC<Props> = ({ who, pose, height, x, y, breath = 3, phase = 0, flip = false, opacity = 1, tone = 'dark' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dy = breath > 0 ? breathe(frame, breath, 3.2, phase, fps) : 0;
  const src = characterSrc(who, pose);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        height,
        opacity,
        transform: `translate(-50%, -100%) translateY(${dy}px) scaleX(${flip ? -1 : 1})`,
        transformOrigin: '50% 100%',
      }}
    >
      {src ? (
        <Img src={src} style={{ height, width: 'auto', display: 'block' }} />
      ) : (
        <AssetPlaceholder
          width={Math.round(height * 0.42)}
          height={height}
          label={`${who === 'caro' ? 'Caro' : 'Nico'} · ${pose}`}
          file={`characters/${who}/${pose}.png`}
          tone={tone}
        />
      )}
    </div>
  );
};

/** Lista de poses disponibles (para checkpoints y validación). */
export const useCharacterPoses = (who: CharacterName) => characterPoses(who);
