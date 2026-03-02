"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useApiMutation } from "@/hooks/use-api"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { SaveToVehiclePayload } from "../types"

interface SaveToVehicleDialogProps {
  calculationId: string | undefined
  open: boolean
  onClose: () => void
}

export function SaveToVehicleDialog({
  calculationId,
  open,
  onClose,
}: SaveToVehicleDialogProps) {
  const [vehicleId, setVehicleId] = React.useState("")
  const { toast } = useToast()

  const endpoint = calculationId
    ? `/calculator/${calculationId}/save-to-vehicle`
    : "/calculator/save-to-vehicle"

  const saveMutation = useApiMutation<unknown, SaveToVehiclePayload>(endpoint, "post", {
    onSuccess: () => {
      onClose()
      setVehicleId("")
    },
  })

  const handleSave = () => {
    if (!vehicleId.trim()) {
      toast({
        title: "Hata",
        description: "Lutfen bir arac ID'si giriniz.",
        variant: "destructive",
      })
      return
    }
    saveMutation.mutate({ vehicleId: vehicleId.trim() })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Araca Kaydet</DialogTitle>
          <DialogDescription>
            Hesaplama sonucunu kaydetmek istediginiz aracin ID&apos;sini giriniz.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Input
            placeholder="Arac ID"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            Iptal
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
