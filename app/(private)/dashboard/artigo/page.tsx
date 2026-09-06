import { DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ARTICLE_PDF_SRC = '/docs/mapeando-o-invisivel.pdf'

export default function ArtigoPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl">Mapeando o (in)visível</h1>
          <p className="text-muted-foreground text-sm">
            FIGUEIREDO, A. da S. et al
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={ARTICLE_PDF_SRC} download="mapeando-o-invisivel.pdf">
            <DownloadIcon />
            Baixar PDF
          </a>
        </Button>
      </div>

      <iframe
        src={ARTICLE_PDF_SRC}
        title='Artigo "Mapeando o (in)visível"'
        className="min-h-[70vh] w-full flex-1 rounded-xl border bg-muted"
      />
    </div>
  )
}
