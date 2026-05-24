"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      router.push("/dashboard")
      router.refresh()
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-[#C8502A]/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📬</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
        <p className="text-gray-400 text-sm">
          We sent a confirmation link to <span className="text-white">{email}</span>. Click it to activate your account.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-[#C8502A] hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-white mb-1">Create an account</h1>
      <p className="text-gray-400 text-sm mb-8">Start learning any book with AI</p>

      <form onSubmit={handleSignup} className="space-y-4">
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
            minLength={6}
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
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-[#C8502A] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
