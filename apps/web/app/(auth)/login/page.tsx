"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Car, Loader2, Shield, Building2, UserCog, ShoppingCart, Calculator, User, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/stores/authStore"

const isDev = process.env.NODE_ENV === "development"

const loginSchema = z.object({
  email: z.string().email("Gecerli bir email girin"),
  password: z.string().min(1, "Sifre gerekli"),
})

type LoginForm = z.infer<typeof loginSchema>

const QUICK_USERS = [
  {
    label: "Master Admin",
    email: "admin@kktcgaleri.com",
    password: "123456",
    role: "MASTER_ADMIN",
    icon: Shield,
    color: "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20",
  },
  {
    label: "Galeri Sahibi",
    email: "owner@demogaleri.com",
    password: "123456",
    role: "GALLERY_OWNER",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20",
  },
  {
    label: "Galeri Muduru",
    email: "manager@demogaleri.com",
    password: "123456",
    role: "GALLERY_MANAGER",
    icon: UserCog,
    color: "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20",
  },
  {
    label: "Satis Danismani",
    email: "sales@demogaleri.com",
    password: "123456",
    role: "SALES",
    icon: ShoppingCart,
    color: "bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20",
  },
  {
    label: "Muhasebeci",
    email: "accountant@demogaleri.com",
    password: "123456",
    role: "ACCOUNTANT",
    icon: Calculator,
    color: "bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20",
  },
  {
    label: "Personel",
    email: "staff@demogaleri.com",
    password: "123456",
    role: "STAFF",
    icon: User,
    color: "bg-gray-500/10 text-gray-600 border-gray-200 hover:bg-gray-500/20",
  },
  {
    label: "Premium Motors (2. Galeri)",
    email: "owner@premiummotors.com",
    password: "123456",
    role: "GALLERY_OWNER_2",
    icon: Crown,
    color: "bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (email: string, password: string) => {
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      if (user?.role === "MASTER_ADMIN") {
        router.push("/master")
      } else {
        router.push("/dashboard")
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error || "Giris basarisiz")
    } finally {
      setIsLoading(false)
      setLoadingUser(null)
    }
  }

  const onSubmit = (data: LoginForm) => handleLogin(data.email, data.password)

  const onQuickLogin = (user: typeof QUICK_USERS[number]) => {
    setLoadingUser(user.role)
    handleLogin(user.email, user.password)
  }

  const loginForm = (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Sifre</Label>
            <Input
              id="password"
              type="password"
              placeholder="******"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && !loadingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Giris Yap
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Hesabiniz yok mu?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Kayit Ol
            </Link>
          </p>
        </CardFooter>
      </form>
    </>
  )

  const quickLoginPanel = (
    <CardContent className="space-y-3 pt-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center mb-2">
        Tek tikla seed kullanicilariyla giris yap
      </p>
      {QUICK_USERS.map((user) => {
        const Icon = user.icon
        const loading = loadingUser === user.role
        return (
          <Button
            key={user.role}
            variant="outline"
            className={`w-full justify-start gap-3 h-auto py-3 ${user.color}`}
            disabled={isLoading}
            onClick={() => onQuickLogin(user)}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
            <div className="text-left">
              <div className="font-medium">{user.label}</div>
              <div className="text-xs opacity-70">{user.email}</div>
            </div>
          </Button>
        )
      })}
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Sifre: 123456
      </p>
    </CardContent>
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Car className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle>Giris Yap</CardTitle>
        <CardDescription>KKTC Galeri Yonetim Sistemi</CardDescription>
      </CardHeader>
      {isDev ? (
        <Tabs defaultValue="quick" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick">Quick Login</TabsTrigger>
              <TabsTrigger value="manual">Manuel Giris</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="quick">{quickLoginPanel}</TabsContent>
          <TabsContent value="manual">{loginForm}</TabsContent>
        </Tabs>
      ) : (
        loginForm
      )}
    </Card>
  )
}
