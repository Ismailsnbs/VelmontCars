"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FORM_COLORS } from "@/lib/design-tokens"

// ---- Types ----------------------------------------------------------------

export type NotificationType = "TAX_CHANGE" | "CURRENCY_ALERT" | "GENERAL_ANNOUNCEMENT" | "SYSTEM_MAINTENANCE"
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT"
export type TargetType = "ALL" | "GALLERY" | "SUBSCRIPTION"

export interface PlatformNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority: NotificationPriority
  targetType: TargetType
  targetIds: string[]
  sentBy: string
  sentAt: string
  createdAt: string
  updatedAt: string
}

// ---- Zod schema -----------------------------------------------------------

const notificationSchema = z.object({
  type: z.enum(["TAX_CHANGE", "CURRENCY_ALERT", "GENERAL_ANNOUNCEMENT", "SYSTEM_MAINTENANCE"], {
    required_error: "Tip zorunludur",
  }),
  title: z.string().min(1, "Başlık zorunludur").max(200, "Başlık en fazla 200 karakter olabilir"),
  message: z.string().min(1, "Mesaj zorunludur").max(2000, "Mesaj en fazla 2000 karakter olabilir"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  targetType: z.enum(["ALL", "GALLERY", "SUBSCRIPTION"]).default("ALL"),
  targetIds: z.string().optional().default(""),
})

type NotificationFormData = z.infer<typeof notificationSchema>

// ---- Component ----

interface NotificationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationForm({ open, onOpenChange }: NotificationFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: "GENERAL_ANNOUNCEMENT",
      title: "",
      message: "",
      priority: "NORMAL",
      targetType: "ALL",
      targetIds: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const targetIds = data.targetType === "ALL"
        ? []
        : data.targetIds.split(",").map((id) => id.trim()).filter(Boolean)

      const { data: response } = await api.post<{ success: boolean; data: PlatformNotification }>(
        "/notifications",
        {
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          targetType: data.targetType,
          targetIds,
        }
      )
      return response
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Bildirim başarıyla oluşturuldu.",
        variant: "default",
      })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      form.reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error?.response?.data?.message || "Bildirim oluşturalamadı.",
        variant: "destructive",
      })
    },
  })

  const targetType = form.watch("targetType")

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Bildirim</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tip</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(value) => form.setValue("type", value as NotificationType)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Tip seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TAX_CHANGE">Vergi Değişikliği</SelectItem>
                <SelectItem value="CURRENCY_ALERT">Döviz Uyarısı</SelectItem>
                <SelectItem value="GENERAL_ANNOUNCEMENT">Genel Duyuru</SelectItem>
                <SelectItem value="SYSTEM_MAINTENANCE">Sistem Bakımı</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              placeholder="Bildirim başlığı"
              {...form.register("title")}
              disabled={createMutation.isPending}
            />
            {form.formState.errors.title && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj</Label>
            <Textarea
              id="message"
              placeholder="Bildirim mesajı"
              rows={4}
              {...form.register("message")}
              disabled={createMutation.isPending}
            />
            {form.formState.errors.message && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.message.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik</Label>
            <Select
              value={form.watch("priority")}
              onValueChange={(value) => form.setValue("priority", value as NotificationPriority)}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Öncelik seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Düşük</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">Yüksek</SelectItem>
                <SelectItem value="URGENT">Acil</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.priority && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.priority.message}</p>
            )}
          </div>

          {/* Target Type */}
          <div className="space-y-2">
            <Label htmlFor="targetType">Hedef</Label>
            <Select
              value={form.watch("targetType")}
              onValueChange={(value) => form.setValue("targetType", value as TargetType)}
            >
              <SelectTrigger id="targetType">
                <SelectValue placeholder="Hedef tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tümü</SelectItem>
                <SelectItem value="GALLERY">Galeri</SelectItem>
                <SelectItem value="SUBSCRIPTION">Abonelik</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.targetType && (
              <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.targetType.message}</p>
            )}
          </div>

          {/* Target IDs - only show if not ALL */}
          {targetType !== "ALL" && (
            <div className="space-y-2">
              <Label htmlFor="targetIds">Hedef Kimlikler (virgülle ayrılmış)</Label>
              <Input
                id="targetIds"
                placeholder="id1, id2, id3"
                {...form.register("targetIds")}
                disabled={createMutation.isPending}
              />
              {form.formState.errors.targetIds && (
                <p className={`text-sm ${FORM_COLORS.error}`}>{form.formState.errors.targetIds.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
