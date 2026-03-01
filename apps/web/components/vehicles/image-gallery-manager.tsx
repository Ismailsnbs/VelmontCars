"use client"

import { useCallback, useState } from "react"
import {
  useVehicleImages,
  useSetMainImage,
  useReorderImages,
  useDeleteVehicleImage,
} from "@/hooks/use-vehicle-images"
import { ImageDropzone } from "./image-dropzone"
import { ImageThumbnail } from "./image-thumbnail"
import { ImageLightbox } from "./image-lightbox"
import { Skeleton } from "@/components/ui/skeleton"

interface ImageGalleryManagerProps {
  vehicleId: string
}

export function ImageGalleryManager({ vehicleId }: ImageGalleryManagerProps) {
  const { data: images, isLoading } = useVehicleImages(vehicleId)
  const setMainMutation = useSetMainImage(vehicleId)
  const reorderMutation = useReorderImages(vehicleId)
  const deleteMutation = useDeleteVehicleImage(vehicleId)

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const sortedImages = (images ?? []).slice().sort((a, b) => a.order - b.order)

  const handleSetMain = useCallback(
    (imageId: string) => {
      setMainMutation.mutate(imageId)
    },
    [setMainMutation]
  )

  const handleMoveUp = useCallback(
    (imageId: string) => {
      const idx = sortedImages.findIndex((img) => img.id === imageId)
      if (idx <= 0) return
      const newOrder = sortedImages.map((img) => img.id)
      ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
      reorderMutation.mutate(newOrder)
    },
    [sortedImages, reorderMutation]
  )

  const handleMoveDown = useCallback(
    (imageId: string) => {
      const idx = sortedImages.findIndex((img) => img.id === imageId)
      if (idx < 0 || idx >= sortedImages.length - 1) return
      const newOrder = sortedImages.map((img) => img.id)
      ;[newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]]
      reorderMutation.mutate(newOrder)
    },
    [sortedImages, reorderMutation]
  )

  const handleDelete = useCallback(
    (imageId: string) => {
      deleteMutation.mutate(imageId)
    },
    [deleteMutation]
  )

  const handleThumbnailClick = useCallback(
    (index: number) => {
      setLightboxIndex(index)
      setLightboxOpen(true)
    },
    []
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ImageDropzone vehicleId={vehicleId} />

      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedImages.map((image, index) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              isFirst={index === 0}
              isLast={index === sortedImages.length - 1}
              onSetMain={handleSetMain}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onDelete={handleDelete}
              onClick={() => handleThumbnailClick(index)}
            />
          ))}
        </div>
      )}

      {sortedImages.length === 0 && (
        <p className="text-center text-muted-foreground py-4 text-sm">
          Henüz görsel eklenmemiş. Yukarıdan yükleyebilirsiniz.
        </p>
      )}

      <ImageLightbox
        images={sortedImages}
        selectedIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
