"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, RotateCcw, Save } from "lucide-react"

export default function TimerWidget({ 
  onComplete,
  onSyncTime 
}: { 
  onComplete?: () => void,
  onSyncTime?: (minutes: number) => void
}) {
  // Configurable options: 15, 25, 45, 60 minutes
  const [targetMinutes, setTargetMinutes] = useState(25)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  
  // Track actual elapsed time for sync
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const lastSyncTimeRef = useRef(0)

  useEffect(() => {
    setTimeLeft(targetMinutes * 60)
    setIsRunning(false)
    setElapsedSeconds(0)
    lastSyncTimeRef.current = 0
  }, [targetMinutes])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
        setElapsedSeconds((prev) => {
          const newElapsed = prev + 1
          // Auto-sync every 60 elapsed seconds
          if (newElapsed - lastSyncTimeRef.current >= 60) {
            onSyncTime?.(1) // Sync 1 minute
            lastSyncTimeRef.current = newElapsed
          }
          return newElapsed
        })
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
      // Check if we have un-synced time
      const unSyncedSeconds = elapsedSeconds - lastSyncTimeRef.current
      if (unSyncedSeconds > 30) {
        onSyncTime?.(1) // Sync final remaining time if over 30s
      }
      onComplete?.()
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, elapsedSeconds, onSyncTime, onComplete])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => setIsRunning(!isRunning)
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(targetMinutes * 60)
    setElapsedSeconds(0)
    lastSyncTimeRef.current = 0
  }

  const cycleTime = () => {
    if (isRunning) return
    const times = [15, 25, 45, 60]
    const next = times[(times.indexOf(targetMinutes) + 1) % times.length]
    setTargetMinutes(next)
  }

  return (
    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md w-fit">
      <button
        onClick={toggleTimer}
        className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
      >
        {isRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
      </button>
      <button 
        onClick={cycleTime} 
        className={`font-mono text-xs font-semibold w-10 text-center transition-colors ${isRunning ? 'text-white cursor-default' : 'text-muted-foreground hover:text-primary cursor-pointer'}`}
        disabled={isRunning} 
        title={isRunning ? "Time remaining" : "Click to change target time"}
      >
        {formatTime(timeLeft)}
      </button>
      <button
        onClick={resetTimer}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        title="Reset Timer"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  )
}
