import cors from "cors";
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { compareDesignVsImplementation } from "./compare";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "ANTHROPIC_API_KEY no está seteada. Configurala en .env (ver .env.example) antes de llamar a /compare."
  );
}

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const CompareRequestSchema = z.object({
  originalImage: z.string().min(1, "originalImage es requerido"),
  implementedImage: z.string().min(1, "implementedImage es requerido"),
});

app.post("/compare", async (req: Request, res: Response) => {
  const parsedBody = CompareRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ error: "Body inválido", details: parsedBody.error.flatten() });
    return;
  }

  const { originalImage, implementedImage } = parsedBody.data;

  try {
    const result = await compareDesignVsImplementation(originalImage, implementedImage);
    res.json(result);
  } catch (error) {
    console.error("Error comparando imágenes:", error);
    res.status(502).json({
      error: "No se pudo completar la comparación",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno" });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`Design Compare backend escuchando en http://localhost:${PORT}`);
});
