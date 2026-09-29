import React from 'react';

/**
 * Blur de profundidad. Regla de performance: como máximo 1 o 2 por frame.
 * Usarlo solo en la capa fg o bg más lejana, nunca por elemento.
 */
export const DepthBlur: React.FC<{ amount: number; children: React.ReactNode }> = ({ amount, children }) =>
  amount <= 0.05 ? (
    <>{children}</>
  ) : (
    <div style={{ position: 'absolute', inset: 0, filter: `blur(${amount}px)`, willChange: 'filter' }}>{children}</div>
  );
