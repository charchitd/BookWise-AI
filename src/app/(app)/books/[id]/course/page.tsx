import { createServerClient } from "@/lib/supabase-server"
import { createAdminClient } from "@/lib/supabase"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpen, CheckCircle, Clock, PlayCircle, Target, Calendar, Flame, Zap } from "lucide-react"

function formatEta(days: number) {
  if (days <= 0) return "Complete!"
  if (days === 1) return "1 day"
  if (days < 7) return `${days} days`
  const weeks = Math.ceil(days / 7)
  return weeks === 1 ? "1 week" : `${weeks} weeks`
}

function getCompletionDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function CourseDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const admin = createAdminClient()

  const [{ data: book }, { data: chapters }, { data: profile }] = await Promise.all([
    admin.from("books").select("*").eq("id", id).eq("user_id", user.id).single(),
    admin.from("chapters").select("*, concepts(*)").eq("book_id", id).order("num"),
    admin.from("profiles").select("daily_goal_minutes, total_learning_minutes, current_streak_days, xp_points").eq("id", user.id).single(),
  ])

  if (!book) return notFound()

  // Check if certificate already issued
  const { data: certificate } = await admin
    .from("certificates")
    .select("id, issued_at")
    .eq("user_id", user.id)
    .eq("book_id", id)
    .single()

  const dailyGoalMinutes = profile?.daily_goal_minutes ?? 60

  // Estimate minutes per chapter (2 min per page, min 10)
  const chaptersWithEst = (chapters ?? []).map(ch => ({
    ...ch,
    estMinutes: Math.max(10, ((ch.page_end ?? 0) - (ch.page_start ?? 0) + 1) * 2),
    isCompleted: ch.concepts?.length > 0 && ch.concepts.every((c: any) => c.mastery_state === "mastered"),
  }))

  const totalSessions = chaptersWithEst.length
  const completedSessions = chaptersWithEst.filter(c => c.isCompleted).length
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const remainingMinutes = chaptersWithEst
    .filter(c => !c.isCompleted)
    .reduce((sum, c) => sum + c.estMinutes, 0)
  const daysToComplete = Math.ceil(remainingMinutes / dailyGoalMinutes)

  // Today's learning minutes (from profile, rough estimate)
  const todayProgress = Math.min(100, Math.round(((profile?.total_learning_minutes ?? 0) % dailyGoalMinutes) / dailyGoalMinutes * 100))

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          Interactive Course
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">{book.title || "Untitled Book"}</h1>
        <p className="text-muted-foreground text-base">
          {totalSessions} sessions curated from your PDF · learn at your own pace with AI guidance
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Target className="w-3.5 h-3.5" /> Progress
          </div>
          <div className="text-2xl font-bold">{progressPct}%</div>
          <div className="text-xs text-muted-foreground">{completedSessions}/{totalSessions} sessions</div>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" /> ETA
          </div>
          <div className="text-2xl font-bold">{formatEta(daysToComplete)}</div>
          {daysToComplete > 0 && (
            <div className="text-xs text-muted-foreground">by {getCompletionDate(daysToComplete)}</div>
          )}
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="w-3.5 h-3.5" /> Daily Goal
          </div>
          <div className="text-2xl font-bold">{dailyGoalMinutes}m</div>
          <div className="text-xs text-muted-foreground">per day target</div>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> Streak
          </div>
          <div className="text-2xl font-bold text-orange-400">{profile?.current_streak_days ?? 0}d</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> {profile?.xp_points ?? 0} XP total
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {totalSessions > 0 && (
        <div className="bg-card border border-white/10 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-muted-foreground font-medium">Course Progress</span>
            <span className="text-foreground font-semibold">{progressPct}%</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C8502A] to-purple-500 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {progressPct === 100 && (
            <p className="text-sm text-green-400 mt-3 flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4" /> Course complete! Congratulations.
            </p>
          )}
        </div>
      )}

      {/* Session List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Sessions</h2>

        {chaptersWithEst.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/books/${book.id}/session/${chapter.id}`}
            className="block group"
          >
            <div className={`bg-card hover:bg-muted/50 border rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${chapter.isCompleted ? "border-green-500/30 bg-green-500/5" : "border-white/10"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-md ${chapter.isCompleted ? "bg-green-500/20 text-green-500" : "bg-white/5 text-muted-foreground"}`}>
                      SESSION {chapter.num}
                    </span>
                    {chapter.isCompleted ? (
                      <span className="flex items-center text-xs text-green-500 gap-1 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-muted-foreground gap-1">
                        <Clock className="w-3.5 h-3.5" /> ~{chapter.estMinutes} min
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {chapter.title || `Chapter ${chapter.num}`}
                  </h3>
                  <p className="text-muted-foreground line-clamp-2">
                    {chapter.summary || "No summary available for this chapter."}
                  </p>

                  {chapter.concepts && chapter.concepts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {chapter.concepts.slice(0, 3).map((concept: any) => (
                        <span key={concept.id} className={`text-xs px-2 py-1 rounded transition-colors ${concept.mastery_state === "mastered" ? "bg-green-500/20 text-green-400" : "bg-secondary text-secondary-foreground"}`}>
                          {concept.mastery_state === "mastered" ? "✓ " : ""}{concept.name}
                        </span>
                      ))}
                      {chapter.concepts.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded bg-secondary/50 text-muted-foreground">
                          +{chapter.concepts.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex flex-col items-center justify-center pt-2">
                  <button className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <PlayCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {(!chapters || chapters.length === 0) && (
          <div className="text-center p-12 border border-dashed border-white/20 rounded-2xl">
            <p className="text-muted-foreground">No sessions yet. The PDF might still be processing.</p>
          </div>
        )}
      </div>
    </div>
  )
}
