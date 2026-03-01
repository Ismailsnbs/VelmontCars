"use client"

import { useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { VehicleImage } from "@/hooks/use-vehicle-images"

interface ImageLightboxProps {
  images: VehicleImage[]
  selectedIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onIndexChange: (index: number) => void
}

export function ImageLightbox({
  images,
  selectedIndex,
  open,
  onOpenChange,
  onIndexChange,
}: ImageLightboxProps) {
  const canPrev = selectedIndex > 0
  const canNext = selectedIndex < images.length - 1
  const currentImage = images[selectedIndex]

  const goNext = useCallback(() => {
    if (canNext) onIndexChange(selectedIndex + 1)
  }, [canNext, selectedIndex, onIndexChange])

  const goPrev = useCallback(() => {
    if (canPrev) onIndexChange(selectedIndex - 1)
  }, [canPrev, selectedIndex, onIndexChange])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, goPrev, goNext])

  if (!currentImage) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 border-0 bg-black/95 [&>button]:hidden">
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image */}
        <div className="relative flex items-center justify-center min-h-[60vh] max-h-[80vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.url}
            alt={`Görsel ${selectedIndex + 1}`}
            className="max-h-[80vh] max-w-full object-contain"
          />

          {/* Nav arrows */}
          {canPrev && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
              onClick={goPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {canNext && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10"
              onClick={goNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {/* Counter */}
        <div className="text-center py-3 text-sm text-white/70">
          {selectedIndex + 1} / {images.length}
        </div>
      </DialogContent>
    </Dialog>
  )
}
