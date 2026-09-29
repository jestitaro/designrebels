import { Config } from '@remotion/cli/config';
import { existsSync } from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');

// En el contenedor cloud no se puede descargar Chrome: usamos el headless shell preinstalado.
const localShell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (existsSync(localShell)) {
  Config.setBrowserExecutable(localShell);
}
