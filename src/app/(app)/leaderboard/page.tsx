import { createServerClient } from "@/lib/supabase-server"
import { Trophy, Medal, Clock, Award, Flame, Zap, Star } from "lucide-react"

const LEVEL_NAMES = ["", "Spark", "Apprentice", "Scholar", "Analyst", "Sage", "Expert", "Master", "Virtuoso", "Grand Master", "Legend"]
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1600, 2500, 4000, 6000, 9000, Infinity]

const LEVEL_BADGE_COLORS: Record<number, string> = {
  1: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  2: "bg-gray-400/20 text-gray-300 border-gray-400/30",
  3: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  4: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  5: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  6: "bg-purple-400/20 text-purple-300 border-purple-400/30",
  7: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  8: "bg-orange-400/20 text-orange-300 border-orange-400/30",
  9: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  10: "bg-gradient-to-r from-yellow-500/30 to-red-500/30 text-yellow-300 border-yellow-500/40",
}

function getLevel(xp: number) {
  for (let i = XP_THRESHOLDS.length - 2; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1
  }
  return 1
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const RANK_COLORS = [
  "border-yellow-500/40 bg-yellow-500/5 shadow-yellow-500/10",
  "border-zinc-400/40 bg-zinc-400/5 shadow-zinc-400/10",
  "border-orange-600/40 bg-orange-600/5 shadow-orange-600/10",
]

const RANK_ICONS = [
  <Trophy key={0} className="w-6 h-6 text-yellow-400" />,
  <Medal key={1} className="w-6 h-6 text-zinc-300" />,
  <Medal key={2} className="w-6 h-6 text-orange-500" />,
]

export default async function LeaderboardPage() {
  const supabase = await createServerClient()

  const [profilesRes, userRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, total_learning_minutes, xp_points, current_streak_days")
      .order("xp_points", { ascending: false })
      .limit(50),
    supabase.auth.getUser(),
  ])

  const profiles = profilesRes.data ?? []
  const currentUserId = userRes.data.user?.id

  const podium = profiles.slice(0, 3)
  const rest = profiles.slice(3)

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-2">
          <Trophy className="w-4 h-4" /> Global Leaderboard
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
          Scholar Rankings
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Earn XP by studying, maintain daily streaks, and rise through the ranks. Every minute of learning counts.
        </p>
      </div>

      {/* XP Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {LEVEL_NAMES.slice(1).map((name, i) => (
          <span key={name} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${LEVEL_BADGE_COLORS[i + 1]}`}>
            Lv.{i + 1} {name}
          </span>
        ))}
      </div>

      {/* Podium - Top 3 */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {podium.map((profile, idx) => {
            const level = getLevel(profile.xp_points ?? 0)
            const isMe = profile.id === currentUserId
            return (
              <div
                key={profile.id}
                className={`relative p-6 rounded-3xl border backdrop-blur-sm flex flex-col items-center gap-3 shadow-xl transition-transform hover:-translate-y-1 ${RANK_COLORS[idx]} ${idx === 0 ? "md:-translate-y-4" : ""} ${isMe ? "ring-2 ring-[#C8502A]/50" : ""}`}
              >
                <div className="absolute -top-5 p-2.5 rounded-full bg-card border border-white/10">
                  {RANK_ICONS[idx]}
                </div>

                <div className="mt-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#C8502A]/40 to-purple-500/40 flex items-center justify-center text-white font-bold text-xl shadow-inner border border-white/10">
                  {profile.display_name?.charAt(0).toUpperCase()}
                </div>

                <div className="text-center">
                  <h3 className="font-bold text-lg text-white">{profile.display_name}</h3>
                  {isMe && <span className="text-xs bg-[#C8502A]/20 text-[#C8502A] px-2 py-0.5 rounded-full">You</span>}
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${LEVEL_BADGE_COLORS[level]}`}>
                  Lv.{level} {LEVEL_NAMES[level]}
                </span>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-400 font-bold">{profile.xp_points ?? 0}</span>
                    <span className="text-muted-foreground">XP</span>
                  </div>
                  {(profile.current_streak_days ?? 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-orange-400 font-bold">{profile.current_streak_days}d</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(profile.total_learning_minutes ?? 0)} learned
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-card/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="grid grid-cols-12 p-4 text-xs font-semibold text-muted-foreground border-b border-white/10 uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Scholar</div>
          <div className="col-span-3 text-center">Level</div>
          <div className="col-span-2 text-center">Streak</div>
          <div className="col-span-2 text-right pr-4">XP</div>
        </div>

        <div className="divide-y divide-white/5">
          {profiles.map((profile, i) => {
            const level = getLevel(profile.xp_points ?? 0)
            const isMe = profile.id === currentUserId
            const streak = profile.current_streak_days ?? 0

            return (
              <div
                key={profile.id}
                className={`grid grid-cols-12 p-4 items-center transition-colors hover:bg-white/5 ${isMe ? "bg-[#C8502A]/10 border-l-4 border-[#C8502A]" : ""}`}
              >
                <div className="col-span-1 text-center font-mono font-bold text-muted-foreground">
                  {i < 3 ? (
                    <span className={i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : "text-orange-500"}>
                      #{i + 1}
                    </span>
                  ) : `#${i + 1}`}
                </div>

                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8502A]/40 to-purple-500/40 flex items-center justify-center text-white font-bold text-sm shadow-inner border border-white/10 shrink-0">
                    {profile.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-white truncate">{profile.display_name}</span>
                      {isMe && <span className="text-xs bg-[#C8502A]/20 text-[#C8502A] px-1.5 py-0.5 rounded-full shrink-0">You</span>}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {formatTime(profile.total_learning_minutes ?? 0)}
                    </div>
                  </div>
                </div>

                <div className="col-span-3 flex justify-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${LEVEL_BADGE_COLORS[level]}`}>
                    Lv.{level} {LEVEL_NAMES[level]}
                  </span>
                </div>

                <div className="col-span-2 flex justify-center items-center gap-1">
                  {streak > 0 ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-orange-400 font-semibold text-sm">{streak}d</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </div>

                <div className="col-span-2 text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="font-bold text-yellow-400 text-sm">{profile.xp_points ?? 0}</span>
                  </div>
                </div>
              </div>
            )
          })}

          {profiles.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No scholars yet. Be the first to start learning!</p>
            </div>
          )}
        </div>
      </div>

      {/* How XP works */}
      <div className="bg-card/40 border border-white/10 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" /> How XP Works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-white font-medium">2 XP per minute</div>
              <div className="text-muted-foreground text-xs">Earned for every minute of active study time</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-white font-medium">Daily streaks</div>
              <div className="text-muted-foreground text-xs">Study every day to build your consecutive streak</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-white font-medium">10 levels to climb</div>
              <div className="text-muted-foreground text-xs">From Spark to Legend — rank up by accumulating XP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
