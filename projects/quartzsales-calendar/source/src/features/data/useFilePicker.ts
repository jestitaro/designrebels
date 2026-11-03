import { useCallback } from 'react';

/** Abre el selector de archivos del sistema y devuelve el texto del archivo elegido. */
export function useFilePicker(accept: string) {
  return useCallback(
    () =>
      new Promise<{ name: string; text: string } | null>((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          resolve({ name: file.name, text: await file.text() });
        };
        input.click();
      }),
    [accept],
  );
}
