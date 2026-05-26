import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <main className="min-h-screen p-12 flex flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">Design Rebels</h1>
      <p className="text-muted-foreground text-lg">cult-ui instalado y funcionando ✓</p>
      <div className="flex gap-4 items-center flex-wrap justify-center">
        <Button>Botón primario</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Badge>Badge</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </main>
  )
}
