import { useQuery, useMutation } from "@tanstack/react-query"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { AxiosError } from "axios"

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ApiErrorResponse {
  success: boolean
  message: string
  error?: string
}

export function useApiQuery<T>(
  key: string[],
  url: string,
  params?: Record<string, any>,
  options?: any
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<T>>(url, { params })
      return data.data
    },
    ...options,
  })
}

interface UseMutationOptions<T, V> {
  onSuccess?: (data: ApiResponse<T>, variables: V) => void
  onError?: (error: AxiosError<ApiErrorResponse>) => void
  [key: string]: any
}

export function useApiMutation<T, V>(
  url: string,
  method: "post" | "put" | "delete" = "post",
  options?: UseMutationOptions<T, V>
) {
  const { toast } = useToast()

  // Spread options FIRST so built-in onSuccess/onError are never overwritten
  const { onSuccess: userOnSuccess, onError: userOnError, ...restOptions } = options ?? {}

  return useMutation({
    ...restOptions,
    mutationFn: async (variables: V) => {
      let response
      switch (method) {
        case "post":
          response = await api.post<ApiResponse<T>>(url, variables)
          break
        case "put":
          response = await api.put<ApiResponse<T>>(url, variables)
          break
        case "delete":
          response = await api.delete<ApiResponse<T>>(url)
          break
      }
      return response.data
    },
    onSuccess: (data: ApiResponse<T>, variables: V) => {
      toast({
        title: "Başarılı",
        description: data.message || "İşlem başarıyla tamamlandı",
        variant: "default",
      })
      userOnSuccess?.(data, variables)
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Bir hata oluştu"
      toast({
        title: "Hata",
        description: message,
        variant: "destructive",
      })
      userOnError?.(error)
    },
  })
}

// Specialized hooks for common patterns
export function useFetch<T>(url: string, params?: Record<string, any>) {
  const queryKey = params ? [url, JSON.stringify(params)] : [url]
  return useApiQuery<T>(
    queryKey as string[],
    url,
    params,
    { staleTime: 5 * 60 * 1000 }
  )
}

export function useCreate<T, V>(url: string) {
  return useApiMutation<T, V>(url, "post")
}

export function useUpdate<T, V>(url: string) {
  return useApiMutation<T, V>(url, "put")
}

export function useDelete<T>(url: string) {
  return useApiMutation<T, undefined>(url, "delete")
}
