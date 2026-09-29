import React from 'react';
import { Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { CharacterName, characterSrc } from '../assets';
import { breathe } from '../lib/easing';
import { AssetPlaceholder } from '../brand/AssetPlaceholder';
import { POSES, PoseKind, PoseMeta } from './poses';

export type PoseOf<W extends CharacterName> = keyof (typeof POSES)[W] & string;

/**
 * Relación alto visible / alto de pie por tipo de pose, para que Caro y Nico midan lo mismo
 * en todas las poses. Las poses sentadas y la caída son aproximaciones (ajustables).
 */
const STANDING_RATIO: Record<PoseKind, number> = {
  standing: 1,
  seated: 0.84,
  fallen: 0.72,
  closeup: 1,
};

export const poseMeta = (who: CharacterName, pose: string): PoseMeta | undefined =>
  (POSES[who] as Record<string, PoseMeta>)[pose];

/**
 * Escala uniforme para que la figura mida `height` px de pie.
 * En closeup, `height` es directamente el alto de la imagen.
 */
export const poseScale = (meta: PoseMeta, height: number) => {
  if (meta.kind === 'closeup') return height / meta.h;
  const visible = meta.bbox[3] - meta.bbox[1];
  return height / (visible / STANDING_RATIO[meta.kind]);
};

type Props<W extends CharacterName> = {
  who: W;
  /** nombre de archivo sin .png. El swap de pose se hace cambiando este valor en un frame de movimiento. */
  pose: PoseOf<W>;
  /** alto de la figura de pie en px (mismo valor en todas las poses = misma persona, mismo tamaño) */
  height: number;
  /** posición de los pies (centro del canvas, base del bounding box) en coordenadas de la capa */
  x: number;
  y: number;
  /** respiración en translateY, clamp 2–4 px. 0 la desactiva. */
  breath?: number;
  /** fase para que Caro y Nico no respiren sincronizados */
  phase?: number;
  /** desplazamiento vertical extra (rebote de caminata) */
  offsetY?: number;
  opacity?: number;
  tone?: 'light' | 'dark';
};

/**
 * PNG aprobado de Caro / Nico. Se anima solo con posición, parallax (vía DepthLayer),
 * cambios de pose y respiración. No se redibuja, no se deforma (escala uniforme), no se recolorea, no se espeja.
 * Si el PNG no está en /public, muestra un placeholder rotulado.
 */
export const Character = <W extends CharacterName>({ who, pose, height, x, y, breath = 3, phase = 0, offsetY = 0, opacity = 1, tone = 'dark' }: Props<W>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dy = (breath > 0 ? breathe(frame, breath, 3.2, phase, fps) : 0) + offsetY;
  const meta = poseMeta(who, pose);
  const src = characterSrc(who, pose);
  if (!meta || !src) {
    return (
      <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)', opacity }}>
        <AssetPlaceholder width={Math.round(height * 0.42)} height={height} label={`${who} · ${pose}`} file={`characters/${who}/${pose}.png`} tone={tone} />
      </div>
    );
  }
  const s = poseScale(meta, height);
  const footY = meta.kind === 'closeup' ? meta.h : meta.bbox[3];
  return (
    <Img
      src={src}
      style={{
        position: 'absolute',
        left: x - (meta.w / 2) * s,
        top: y - footY * s,
        width: meta.w * s,
        height: meta.h * s,
        opacity,
        transform: `translateY(${dy}px)`,
        display: 'block',
      }}
    />
  );
};

type WalkProps<W extends CharacterName> = Omit<Props<W>, 'pose' | 'offsetY' | 'breath'> & {
  /** fotogramas de la caminata, en orden */
  frames: PoseOf<W>[];
  /** segundos por fotograma */
  frameSec?: number;
  /** rebote vertical por paso (px) */
  bob?: number;
};

/**
 * Caminata por swap de PNG + rebote leve. El desplazamiento lateral (travelling) lo hace la escena.
 * Nota: los fotogramas entregados son variantes de la misma zancada; para un ciclo completo
 * hacen falta los de la fase opuesta.
 */
export const CharacterWalk = <W extends CharacterName>({ frames, frameSec = 0.2, bob = 5, ...rest }: WalkProps<W>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = Math.max(1, Math.round(frameSec * fps));
  const i = Math.floor(frame / step) % frames.length;
  const t = (frame % step) / step;
  const offsetY = -Math.abs(Math.sin(t * Math.PI)) * bob;
  return <Character {...(rest as Props<W>)} pose={frames[i]} breath={0} offsetY={offsetY} />;
};

export const WALK_FRAMES = {
  caro: ['caminando-ciclo-01', 'caminando-ciclo-02', 'caminando-ciclo-03', 'caminando-ciclo-04', 'caminando-ciclo-05'] as PoseOf<'caro'>[],
  nico: ['caminando-ciclo-01', 'caminando-ciclo-02', 'caminando-ciclo-03', 'caminando-ciclo-04'] as PoseOf<'nico'>[],
};

export const listPoses = (who: CharacterName) => Object.keys(POSES[who]);
