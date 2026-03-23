"use client"
import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { PolicyModal } from "@/components/legal/PolicyModal"
import { POLICY_VERSION } from "@/lib/policies"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Policy state
  const [policiesAccepted, setPoliciesAccepted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const supabase = createBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    if (user) {
      // 1. Create user_usage row from client directly
      await supabase.from("user_usage").insert([{ 
        user_id: user.id, 
        books_uploaded: 0, 
        tutor_messages_sent: 0, 
        is_paid: false 
      }])

      // 2. Call new API to store consent and update user_usage (bypassing RLS with service role)
      await fetch('/api/auth/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          userAgent: navigator.userAgent
        })
      })

      setSuccess("Check your email to confirm your account")
    }
    
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create an Account</h1>
        <p className="text-sm text-gray-500">Sign up to get started</p>
      </div>
      
      {success ? (
        <div className="p-4 bg-green-50 text-green-700 rounded-md text-center text-sm font-medium">
          {success}
        </div>
      ) : (
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
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="p-4 border rounded-md bg-gray-50 flex items-start gap-3 flex-col sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                disabled 
                checked={policiesAccepted}
                className="w-5 h-5 accent-[#C8502A] cursor-not-allowed"
              />
              <span className="text-sm text-gray-700 font-medium whitespace-nowrap">I accept policies</span>
            </div>
            
            <div className="w-full flex items-center justify-between sm:justify-end gap-3 sm:ml-auto">
              <span className="text-xs text-gray-400">Policy: {POLICY_VERSION}</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                View
              </Button>
            </div>
          </div>

          <Button 
            disabled={isLoading || !policiesAccepted} 
            className="w-full" 
            type="submit"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign up
          </Button>
          
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </form>
      )}
      
      <div className="text-center text-sm">
        <span className="text-gray-500">Already have an account? </span>
        <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
          Sign in
        </Link>
      </div>

      <PolicyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onAccept={() => {
          setPoliciesAccepted(true)
        }}
      />
    </div>
  )
}
