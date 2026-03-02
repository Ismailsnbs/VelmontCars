"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Settings, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"

interface SettingDef {
  label: string
  description: string
  type: "number" | "text"
  suffix?: string
  min?: number
  max?: number
  defaultValue: string
}

const SETTING_DEFINITIONS: Record<string, SettingDef> = {
  stockAgeWarningDays: {
    label: "Stok Yasi Uyari Suresi",
    description: "Arac bu sureyi asinca kart uzerinde uyari rozeti gosterilir",
    type: "number",
    suffix: "gun",
    min: 1,
    max: 365,
    defaultValue: "30",
  },
}

interface SystemSetting {
  key: string
  value: string
}

interface SettingsResponse {
  success: boolean
  data: SystemSetting[]
}

export default function SystemSettingsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [localValues, setLocalValues] = React.useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = React.useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const response = await api.get<SettingsResponse>("/system-settings")
      return response.data
    },
  })

  // Build a map from fetched settings
  const settingsMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    if (data?.data) {
      for (const s of data.data) {
        map[s.key] = s.value
      }
    }
    return map
  }, [data])

  // Initialize local values from fetched data
  React.useEffect(() => {
    const initial: Record<string, string> = {}
    for (const [key, def] of Object.entries(SETTING_DEFINITIONS)) {
      initial[key] = settingsMap[key] ?? def.defaultValue
    }
    setLocalValues(initial)
  }, [settingsMap])

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await api.put(`/system-settings/${key}`, { value })
      return response.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] })
      toast({
        title: "Basarili",
        description: `${SETTING_DEFINITIONS[variables.key]?.label || variables.key} guncellendi`,
      })
      setSavingKey(null)
    },
    onError: (_error, variables) => {
      toast({
        title: "Hata",
        description: `${SETTING_DEFINITIONS[variables.key]?.label || variables.key} guncellenirken hata olustu`,
        variant: "destructive",
      })
      setSavingKey(null)
    },
  })

  const handleSave = (key: string) => {
    const def = SETTING_DEFINITIONS[key]
    const value = localValues[key] ?? def.defaultValue

    if (def.type === "number") {
      const num = Number(value)
      if (isNaN(num) || (def.min !== undefined && num < def.min) || (def.max !== undefined && num > def.max)) {
        toast({
          title: "Gecersiz deger",
          description: `Deger ${def.min ?? 0} ile ${def.max ?? "..."} arasinda olmalidir`,
          variant: "destructive",
        })
        return
      }
    }

    setSavingKey(key)
    updateMutation.mutate({ key, value })
  }

  const currentValue = (key: string) => settingsMap[key] ?? SETTING_DEFINITIONS[key].defaultValue
  const hasChanged = (key: string) => (localValues[key] ?? "") !== currentValue(key)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarlari</h1>
          <p className="text-muted-foreground mt-1">Platform genelindeki ayarlari yonetin</p>
        </div>
        <div className="grid gap-4">
          {Object.keys(SETTING_DEFINITIONS).map((key) => (
            <Card key={key}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full max-w-xs" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistem Ayarlari</h1>
        <p className="text-muted-foreground mt-1">Platform genelindeki ayarlari yonetin</p>
      </div>

      <div className="grid gap-4">
        {Object.entries(SETTING_DEFINITIONS).map(([key, def]) => {
          const isSaving = savingKey === key
          const changed = hasChanged(key)

          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-lg">{def.label}</CardTitle>
                <CardDescription>{def.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 max-w-xs">
                    <Label htmlFor={key} className="sr-only">{def.label}</Label>
                    <div className="relative">
                      <Input
                        id={key}
                        type={def.type}
                        min={def.min}
                        max={def.max}
                        value={localValues[key] ?? def.defaultValue}
                        onChange={(e) =>
                          setLocalValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                      {def.suffix && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                          {def.suffix}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={isSaving || !changed}
                    size="sm"
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(SETTING_DEFINITIONS).length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Henuz ayar tanimlanmamis</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sistem ayarlari eklendiginde burada gorunecektir
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
