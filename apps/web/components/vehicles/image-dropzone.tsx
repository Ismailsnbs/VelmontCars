"use client"

import { useCallback, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  useUploadVehicleImage,
  useBulkUploadVehicleImages,
} from "@/hooks/use-vehicle-images"
import { ImageUploadProgress } from "./image-upload-progress"

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 10

interface UploadItem {
  id: string
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  errorMessage?: string
}

interface ImageDropzoneProps {
  vehicleId: string
}

export function ImageDropzone({ vehicleId }: ImageDropzoneProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])

  const singleUpload = useUploadVehicleImage(vehicleId)
  const bulkUpload = useBulkUploadVehicleImages(vehicleId)

  const isUploading = uploads.some((u) => u.status === "uploading")

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const valid: File[] = []

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          toast({
            title: "Geçersiz dosya tipi",
            description: `${file.name}: Sadece JPEG, PNG, WebP ve GIF desteklenir.`,
            variant: "destructive",
          })
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          toast({
            title: "Dosya çok büyük",
            description: `${file.name}: Maksimum dosya boyutu 5MB.`,
            variant: "destructive",
          })
          continue
        }
        valid.push(file)
      }

      if (valid.length > MAX_FILES) {
        toast({
          title: "Çok fazla dosya",
          description: `En fazla ${MAX_FILES} görsel yüklenebilir.`,
          variant: "destructive",
        })
        return valid.slice(0, MAX_FILES)
      }

      return valid
    },
    [toast]
  )

  const handleUpload = useCallback(
    async (files: File[]) => {
      const validFiles = validateFiles(files)
      if (validFiles.length === 0) return

      const uploadItems: UploadItem[] = validFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "uploading" as const,
      }))

      setUploads((prev) => [...prev, ...uploadItems])

      if (validFiles.length === 1) {
        const item = uploadItems[0]
        singleUpload.mutate(
          {
            file: validFiles[0],
            onProgress: (percent) => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === item.id ? { ...u, progress: percent } : u
                )
              )
            },
          },
          {
            onSuccess: () => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === item.id ? { ...u, status: "success", progress: 100 } : u
                )
              )
              setTimeout(() => {
                setUploads((prev) => prev.filter((u) => u.id !== item.id))
              }, 2000)
            },
            onError: (error) => {
              setUploads((prev) =>
                prev.map((u) =>
                  u.id === item.id
                    ? {
                        ...u,
                        status: "error",
                        errorMessage:
                          error instanceof Error ? error.message : "Yükleme hatası",
                      }
                    : u
                )
              )
            },
          }
        )
      } else {
        bulkUpload.mutate(
          {
            files: validFiles,
            onProgress: (percent) => {
              setUploads((prev) =>
                prev.map((u) =>
                  uploadItems.some((item) => item.id === u.id)
                    ? { ...u, progress: percent }
                    : u
                )
              )
            },
          },
          {
            onSuccess: () => {
              setUploads((prev) =>
                prev.map((u) =>
                  uploadItems.some((item) => item.id === u.id)
                    ? { ...u, status: "success", progress: 100 }
                    : u
                )
              )
              setTimeout(() => {
                setUploads((prev) =>
                  prev.filter(
                    (u) => !uploadItems.some((item) => item.id === u.id)
                  )
                )
              }, 2000)
            },
            onError: (error) => {
              setUploads((prev) =>
                prev.map((u) =>
                  uploadItems.some((item) => item.id === u.id)
                    ? {
                        ...u,
                        status: "error",
                        errorMessage:
                          error instanceof Error ? error.message : "Yükleme hatası",
                      }
                    : u
                )
              )
            },
          }
        )
      }
    },
    [validateFiles, singleUpload, bulkUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      handleUpload(files)
    },
    [handleUpload]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      handleUpload(files)
      if (inputRef.current) inputRef.current.value = ""
    },
    [handleUpload]
  )

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        className={`
          relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed
          p-8 text-center transition-colors cursor-pointer
          ${isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }
          ${isUploading ? "pointer-events-none opacity-60" : ""}
        `}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          Görsel yüklemek için sürükleyin
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          veya tıklayarak seçin
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          JPEG, PNG, WebP, GIF — Max 5MB — Max 10 dosya
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((item) => (
            <ImageUploadProgress
              key={item.id}
              file={item.file}
              progress={item.progress}
              status={item.status}
              errorMessage={item.errorMessage}
            />
          ))}
        </div>
      )}
    </div>
  )
}
