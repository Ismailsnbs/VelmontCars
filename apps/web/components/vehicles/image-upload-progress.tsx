"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ImageUploadProgressProps {
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  errorMessage?: string
}

export function ImageUploadProgress({
  file,
  progress,
  status,
  errorMessage,
}: ImageUploadProgressProps) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
        {status === "uploading" && <Progress value={progress} className="mt-1 h-1.5" />}
        {status === "error" && errorMessage && (
          <p className="text-xs text-destructive mt-1">{errorMessage}</p>
        )}
      </div>

      <div className="flex-shrink-0">
        {status === "uploading" && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
        {status === "success" && (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        {status === "error" && (
          <XCircle className="h-5 w-5 text-destructive" />
        )}
      </div>
    </div>
  )
}
