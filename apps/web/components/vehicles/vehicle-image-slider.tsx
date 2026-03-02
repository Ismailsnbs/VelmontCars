"use client"

import * as React from "react"
import Image from "next/image"
import { Car } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VehicleStatus } from "@/lib/design-tokens"
import { VEHICLE_CARD } from "@/lib/design-tokens"

interface VehicleImage {
  id: string
  url: string
  isMain: boolean
}

interface VehicleImageSliderProps {
  images: VehicleImage[]
  alt: string
  status: VehicleStatus
  className?: string
}

export function VehicleImageSlider({ images, alt, status, className }: VehicleImageSliderProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)

  const handleMouseLeave = () => {
    setIsHovered(false)
    setActiveIndex(0)
  }

  const hasImages = images.length > 0
  const currentImage = hasImages ? images[activeIndex]?.url : null

  return (
    <div
      className={cn("relative aspect-video overflow-hidden bg-gray-100", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image or placeholder */}
      {currentImage ? (
        <Image
          src={currentImage}
          alt={alt}
          fill
          className="object-cover transition-all duration-300"
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Car className="h-12 w-12 text-gray-300" />
        </div>
      )}

      {/* TRANSIT overlay */}
      {status === "TRANSIT" && (
        <div className={cn("absolute inset-0 z-10", VEHICLE_CARD.transitOverlay)} />
      )}

      {/* SOLD watermark */}
      {status === "SOLD" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          <span
            className={cn(
              "select-none text-5xl font-black tracking-widest uppercase",
              VEHICLE_CARD.soldWatermark
            )}
            style={{ transform: "rotate(-30deg)" }}
          >
            SATILDI
          </span>
        </div>
      )}

      {/* Dot navigation — only on hover and when multiple images */}
      {isHovered && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setActiveIndex(index)
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                index === activeIndex
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/60 hover:bg-white/80"
              )}
              aria-label={`Resim ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
