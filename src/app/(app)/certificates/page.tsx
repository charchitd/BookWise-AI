import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import { Award, BookOpen, Zap } from "lucide-react"
import Link from "next/link"
import CertificateCard from "@/components/certificate-card"

export default async function CertificatesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const [{ data: certificates }, { data: profile }] = await Promise.all([
    admin.from("certificates").select("*").eq("user_id", user.id).order("issued_at", { ascending: false }),
    admin.from("profiles").select("xp_points, total_learning_minutes").eq("id", user.id).single(),
  ])

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-4">
          <Award className="w-4 h-4" /> My Achievements
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3">Certificates & Badges</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Complete every session in a course to earn a certificate. Share it on LinkedIn, Reddit, or drop a badge in your GitHub README.
        </p>
      </div>

      {/* Stats */}
      {profile && (
        <div className="flex justify-center gap-10 mb-12">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">{certificates?.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Certificates Earned</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-yellow-400">{profile.xp_points}</div>
            <div className="text-xs text-gray-500 mt-1">Total XP</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-extrabold text-white">
              {Math.floor((profile.total_learning_minutes ?? 0) / 60)}h
            </div>
            <div className="text-xs text-gray-500 mt-1">Hours Studied</div>
          </div>
        </div>
      )}

      {/* How to share hint */}
      {certificates && certificates.length > 0 && (
        <div className="mb-8 flex items-start gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
          <Zap className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">Share your achievement:</span> LinkedIn posts your cert as an article, Reddit submits a post, and the GitHub button copies a markdown badge you can paste directly into your README.
          </p>
        </div>
      )}

      {/* Certificate Grid */}
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert, i) => (
            <CertificateCard key={cert.id} cert={cert} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5">
            <Award className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No certificates yet</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Complete all sessions in a course to earn your first certificate and share it with the world.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8502A] text-white text-sm font-semibold rounded-xl hover:bg-[#b04523] transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Go to Library
          </Link>
        </div>
      )}
    </div>
  )
}
