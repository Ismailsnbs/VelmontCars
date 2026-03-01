"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/authStore"
import { Building2, User, Bell, Settings } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [notificationSettings, setNotificationSettings] = React.useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  })

  // Get gallery name from user object or fallback
  const galleryName = user?.galleryName || "Galerisi"

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Ayarlar
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Galeri bilgilerini ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Gallery Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Galeri Bilgileri
          </CardTitle>
          <CardDescription>
            Galeri bilgileriniz (salt okunur)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Gallery Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Galeri Adı
              </Label>
              <div className="p-2.5 rounded border bg-gray-50 text-sm">
                {galleryName}
              </div>
            </div>

            {/* Gallery ID */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">
                Galeri ID
              </Label>
              <div className="p-2.5 rounded border bg-gray-50 text-sm font-mono text-gray-600">
                {user?.galleryId || "-"}
              </div>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-gray-500">
            Galeri bilgilerini düzenlemek için sistem yöneticisine başvurun.
          </p>
        </CardContent>
      </Card>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Kullanıcı Profili
          </CardTitle>
          <CardDescription>
            Hesap bilgileriniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-gray-600">
                Ad Soyad
              </Label>
              <Input
                id="name"
                value={user?.name || "-"}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-600">
                E-posta
              </Label>
              <Input
                id="email"
                value={user?.email || "-"}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold text-gray-600">
                Rol
              </Label>
              <div className="flex items-center gap-2 p-2.5 rounded border bg-gray-50">
                <Badge variant="outline" className="text-xs">
                  {user?.role || "-"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-gray-500">
            Profil bilgilerinizi güncellemek için parola değiştir bölümünü kullanın.
          </p>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirim Tercihleri
          </CardTitle>
          <CardDescription>
            Bildirim ayarlarınızı yönetin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-3 rounded border bg-gray-50">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">E-posta Bildirimleri</Label>
              <p className="text-xs text-gray-500">
                Önemli güncellemeleri e-posta ile alın
              </p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={() => handleNotificationChange("emailNotifications")}
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-3 rounded border bg-gray-50">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">SMS Bildirimleri</Label>
              <p className="text-xs text-gray-500">
                Acil durumlar hakkında SMS ile bilgilendirilme
              </p>
            </div>
            <Switch
              checked={notificationSettings.smsNotifications}
              onCheckedChange={() => handleNotificationChange("smsNotifications")}
            />
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-3 rounded border bg-gray-50">
            <div className="flex flex-col gap-1">
              <Label className="text-sm font-medium">Push Bildirimleri</Label>
              <p className="text-xs text-gray-500">
                Tarayıcı push bildirimleri al
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={() => handleNotificationChange("pushNotifications")}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              İptal
            </Button>
            <Button size="sm">
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
