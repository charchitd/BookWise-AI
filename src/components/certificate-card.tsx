"use client"

import { useState } from "react"
import { Award, Calendar, Zap, Check, Copy } from "lucide-react"

const BADGE_THEMES = [
  { from: "from-yellow-500", to: "to-orange-600", glow: "shadow-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400" },
  { from: "from-purple-500", to: "to-indigo-600", glow: "shadow-purple-500/20", border: "border-purple-500/40", text: "text-purple-400" },
  { from: "from-emerald-500", to: "to-teal-600", glow: "shadow-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400" },
  { from: "from-rose-500", to: "to-pink-600", glow: "shadow-rose-500/20", border: "border-rose-500/40", text: "text-rose-400" },
  { from: "from-cyan-500", to: "to-blue-600", glow: "shadow-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-400" },
]

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

interface Certificate {
  id: string
  book_title: string
  display_name: string
  top_concepts: string[]
  issued_at: string
}

interface Props {
  cert: Certificate
  index: number
}

export default function CertificateCard({ cert, index }: Props) {
  const theme = BADGE_THEMES[index % BADGE_THEMES.length]
  const [copied, setCopied] = useState(false)

  const shareText = `🎓 I just earned a Certificate of Completion in "${cert.book_title}" on BookWise AI!\n\nMastered concepts: ${cert.top_concepts.slice(0, 3).join(", ")}.\n\nTurn any PDF into a course → bookwise.ai`

  const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(`Certificate: ${cert.book_title}`)}&summary=${encodeURIComponent(shareText)}&url=${encodeURIComponent("https://bookwise.ai")}`

  const redditUrl = `https://www.reddit.com/submit?title=${encodeURIComponent(`I just completed "${cert.book_title}" on BookWise AI 🎓`)}&text=${encodeURIComponent(shareText)}`

  const githubMarkdown = `## 🎓 Certified: ${cert.book_title}\n\n> Earned via [BookWise AI](https://bookwise.ai) — AI-powered course from PDF\n\n**Mastered:** ${cert.top_concepts.join(" · ")}\n\n![Certificate](https://img.shields.io/badge/BookWise-Certified-orange?style=for-the-badge&logo=bookstack)`

  const handleCopyGitHub = async () => {
    await navigator.clipboard.writeText(githubMarkdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className={`relative bg-card border ${theme.border} rounded-3xl p-8 shadow-2xl ${theme.glow} overflow-hidden`}>
      {/* Background glow */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${theme.from} ${theme.to} opacity-10 blur-2xl pointer-events-none`} />

      {/* Seal */}
      <div className={`absolute top-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow-lg`}>
        <Award className="w-7 h-7 text-white" />
      </div>

      {/* Certificate content */}
      <div className="relative">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
          Certificate of Completion
        </div>
        <h2 className="text-xl font-extrabold text-white mb-1 pr-16 leading-tight">
          {cert.book_title}
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Awarded to <span className="text-white font-semibold">{cert.display_name}</span>
        </p>

        {cert.top_concepts?.length > 0 && (
          <div className="mb-5">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-2">Mastered Concepts</div>
            <div className="flex flex-wrap gap-1.5">
              {cert.top_concepts.map((concept: string) => (
                <span key={concept} className={`text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 ${theme.text} font-medium`}>
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(cert.issued_at)}
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">+200 XP Bonus</span>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 mr-1">Share:</span>

          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0077B5]/20 text-[#0077B5] hover:bg-[#0077B5]/30 border border-[#0077B5]/30 transition-all"
            title="Share on LinkedIn"
          >
            <LinkedInIcon /> LinkedIn
          </a>

          <a
            href={redditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF4500]/20 text-[#FF4500] hover:bg-[#FF4500]/30 border border-[#FF4500]/30 transition-all"
            title="Share on Reddit"
          >
            <RedditIcon /> Reddit
          </a>

          <button
            onClick={handleCopyGitHub}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              copied
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-white/10 text-white hover:bg-white/20 border-white/20"
            }`}
            title="Copy GitHub README badge"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <GitHubIcon />}
            {copied ? "Copied!" : "GitHub"}
          </button>
        </div>
      </div>
    </div>
  )
}
