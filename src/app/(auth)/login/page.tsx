"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-sm text-gray-500">Sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button disabled={isLoading} className="w-full" type="submit">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </form>
      <div className="text-center text-sm">
        <span className="text-gray-500">Don't have an account? </span>
        <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
          Sign up
        </Link>
      </div>
    </div>
  )
}
