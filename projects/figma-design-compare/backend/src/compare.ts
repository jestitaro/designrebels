import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const MODEL = "claude-opus-5";

const DiffSchema = z.object({
  description: z.string().describe("Qué cambió, en una o dos frases concretas."),
  location: z
    .string()
    .describe(
      'Ubicación aproximada dentro de la pantalla (ej. "header, botón CTA superior derecho").'
    ),
  type: z
    .enum(["visual", "funcional", "menor"])
    .describe(
      "visual: difiere en apariencia pero no en comportamiento. funcional: afecta comportamiento/interacción. menor: diferencia trivial (ej. 1-2px, tono de color casi idéntico)."
    ),
});

const CompareResultSchema = z.object({
  diffs: z.array(DiffSchema),
});

export type CompareResult = z.infer<typeof CompareResultSchema>;

const SYSTEM_PROMPT = `Sos un QA visual senior especializado en comparar diseños de Figma contra su implementación real en producción.

Te van a llegar dos imágenes:
1. La primera es el diseño original exportado desde Figma.
2. La segunda es una captura de pantalla de la implementación real.

Tu trabajo es compararlas exhaustivamente y listar cada diferencia relevante que encuentres: espaciado, alineación, tipografía (tamaño, peso, familia), color, bordes/radios, sombras, iconografía, contenido de texto, estados de componentes faltantes o distintos, y elementos agregados/faltantes.

Para cada diferencia devolvé:
- description: qué cambió, concreto y accionable (no vago).
- location: dónde está, en términos de la interfaz (sección, componente).
- type: "visual" si es una diferencia de apariencia sin impacto funcional, "funcional" si afecta el comportamiento o la interacción, "menor" si es una diferencia trivial que probablemente no valga la pena reportar como bug.

No inventes diferencias que no puedas justificar mirando las imágenes. Si las dos imágenes son visualmente equivalentes, devolvé una lista vacía.`;

function detectImageMediaType(base64: string): "image/png" | "image/jpeg" {
  const header = Buffer.from(base64.slice(0, 16), "base64");

  if (header.length >= 4 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    return "image/png";
  }

  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return "image/jpeg";
  }

  throw new Error("No se pudo determinar el tipo de imagen (se esperaba PNG o JPEG).");
}

const client = new Anthropic({
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});

export async function compareDesignVsImplementation(
  originalImageBase64: string,
  implementedImageBase64: string
): Promise<CompareResult> {
  const originalMediaType = detectImageMediaType(originalImageBase64);
  const implementedMediaType = detectImageMediaType(implementedImageBase64);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      format: zodOutputFormat(CompareResultSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Imagen 1 — diseño original (Figma):" },
          {
            type: "image",
            source: { type: "base64", media_type: originalMediaType, data: originalImageBase64 },
          },
          { type: "text", text: "Imagen 2 — implementación real (captura de pantalla):" },
          {
            type: "image",
            source: { type: "base64", media_type: implementedMediaType, data: implementedImageBase64 },
          },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud de comparación.");
  }

  // Defensa en profundidad: aunque output_config.format ya fuerza el schema del
  // lado de la API, revalidamos acá por si parsed_output viene null o incompleto.
  const parsed = CompareResultSchema.safeParse(response.parsed_output);

  if (!parsed.success) {
    throw new Error(
      `El modelo no devolvió un JSON válido según el schema esperado: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
