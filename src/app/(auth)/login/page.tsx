"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-gray-400 text-sm mb-8">Sign in to your BookWise AI account</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8502A] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8502A] transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#C8502A] hover:bg-[#b04523] disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{" "}
        <Link href="/signup" className="text-[#C8502A] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
