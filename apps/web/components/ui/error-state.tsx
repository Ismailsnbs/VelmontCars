import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = "Bir sorun oluştu",
  message = "Veriler yüklenirken hata oluştu.",
  onRetry,
  retryLabel = "Tekrar Dene",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <AlertTriangle className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
