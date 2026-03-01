"use client"

import { useState } from "react"
import { Star, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { VehicleImage } from "@/hooks/use-vehicle-images"

interface ImageThumbnailProps {
  image: VehicleImage
  isFirst: boolean
  isLast: boolean
  onSetMain: (imageId: string) => void
  onMoveUp: (imageId: string) => void
  onMoveDown: (imageId: string) => void
  onDelete: (imageId: string) => void
  onClick: () => void
}

export function ImageThumbnail({
  image,
  isFirst,
  isLast,
  onSetMain,
  onMoveUp,
  onMoveDown,
  onDelete,
  onClick,
}: ImageThumbnailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <div className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt="Araç görseli"
          className="h-full w-full object-cover cursor-pointer"
          onClick={onClick}
        />

        {image.isMain && (
          <Badge className="absolute top-1.5 left-1.5 text-xs bg-primary pointer-events-none">
            Ana Görsel
          </Badge>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2 gap-1">
          {!image.isMain && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              title="Ana görsel yap"
              onClick={(e) => {
                e.stopPropagation()
                onSetMain(image.id)
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
          )}

          {!isFirst && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              title="Yukarı taşı"
              onClick={(e) => {
                e.stopPropagation()
                onMoveUp(image.id)
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}

          {!isLast && (
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              title="Aşağı taşı"
              onClick={(e) => {
                e.stopPropagation()
                onMoveDown(image.id)
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            title="Sil"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Görseli Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu görseli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(image.id)}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
