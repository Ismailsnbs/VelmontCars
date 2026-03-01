"use client"

import { ImageGalleryManager } from "./image-gallery-manager"

interface VehicleImageSectionProps {
  vehicleId: string
}

export function VehicleImageSection({ vehicleId }: VehicleImageSectionProps) {
  return <ImageGalleryManager vehicleId={vehicleId} />
}
