import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

export interface VehicleImage {
  id: string
  url: string
  isMain: boolean
  order: number
  vehicleId: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    return resp?.data?.message ?? "Bir hata oluştu"
  }
  if (error instanceof Error) return error.message
  return "Bir hata oluştu"
}

export function useVehicleImages(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle-images", vehicleId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<VehicleImage[]>>(
        `/vehicles/${vehicleId}/images`
      )
      return data.data
    },
    enabled: Boolean(vehicleId),
  })
}

export function useUploadVehicleImage(vehicleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File
      onProgress?: (percent: number) => void
    }) => {
      const formData = new FormData()
      formData.append("image", file)

      const { data } = await api.post<ApiResponse<VehicleImage>>(
        `/vehicles/${vehicleId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1)))
          },
        }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-images", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })
}

export function useBulkUploadVehicleImages(vehicleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      files,
      onProgress,
    }: {
      files: File[]
      onProgress?: (percent: number) => void
    }) => {
      const formData = new FormData()
      files.forEach((file) => formData.append("images", file))

      const { data } = await api.post<ApiResponse<VehicleImage[]>>(
        `/vehicles/${vehicleId}/images/bulk`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1)))
          },
        }
      )
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: data.message || "Görseller yüklendi",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicle-images", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })
}

export function useSetMainImage(vehicleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (imageId: string) => {
      const { data } = await api.patch<ApiResponse<VehicleImage>>(
        `/vehicles/${vehicleId}/images/${imageId}/main`
      )
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: data.message || "Ana görsel güncellendi",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicle-images", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })
}

export function useReorderImages(vehicleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (imageIds: string[]) => {
      const { data } = await api.put<ApiResponse<VehicleImage[]>>(
        `/vehicles/${vehicleId}/images/reorder`,
        { imageIds }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-images", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteVehicleImage(vehicleId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (imageId: string) => {
      const { data } = await api.delete<ApiResponse<null>>(
        `/vehicles/${vehicleId}/images/${imageId}`
      )
      return data
    },
    onSuccess: (data) => {
      toast({
        title: "Başarılı",
        description: data.message || "Görsel silindi",
      })
      queryClient.invalidateQueries({ queryKey: ["vehicle-images", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })
    },
    onError: (error: unknown) => {
      toast({
        title: "Hata",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    },
  })
}
