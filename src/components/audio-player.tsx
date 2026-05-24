"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Square, Volume2, ChevronDown, RotateCcw } from "lucide-react"

interface Props {
  text: string
  title: string
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

export default function AudioPlayer({ text, title }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const [currentWord, setCurrentWord] = useState(0)
  const [supported, setSupported] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordsRef = useRef<string[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const words = text.split(/\s+/).filter(Boolean)

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false)
      return
    }
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      const english = v.filter(voice => voice.lang.startsWith("en"))
      setVoices(english.length > 0 ? english : v)
      if (english.length > 0 && !selectedVoice) {
        const preferred = english.find(v => v.name.includes("Google") || v.name.includes("Natural")) || english[0]
        setSelectedVoice(preferred.name)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { stop() }
  }, [])

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel()
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setCurrentWord(0)
  }, [])

  const speak = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = speed
    utter.pitch = 1

    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) utter.voice = voice

    let wordIndex = 0
    utter.onboundary = (e) => {
      if (e.name === "word") {
        wordIndex++
        setCurrentWord(wordIndex)
        setProgress(Math.round((wordIndex / words.length) * 100))
      }
    }

    utter.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(100)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    utter.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }

    utteranceRef.current = utter
    window.speechSynthesis.speak(utter)
    setIsPlaying(true)
    setIsPaused(false)
  }, [text, speed, selectedVoice, voices, words.length, supported])

  const togglePlay = () => {
    if (!supported) return
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
    } else if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
    } else {
      speak()
    }
  }

  const handleSpeedChange = (s: number) => {
    setSpeed(s)
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setTimeout(() => speak(), 100)
    }
  }

  if (!supported) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center text-sm text-muted-foreground">
        Audio playback is not supported in this browser. Try Chrome or Edge.
      </div>
    )
  }

  // Highlight words in transcript
  const renderTranscript = () => {
    const wordList = text.split(/(\s+)/)
    let wIdx = 0
    return wordList.map((part, i) => {
      if (/\s+/.test(part)) return <span key={i}>{part}</span>
      const idx = wIdx++
      return (
        <span
          key={i}
          className={`transition-colors duration-150 rounded px-0.5 ${
            isPlaying && idx === currentWord
              ? "bg-primary text-primary-foreground"
              : idx < currentWord
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
        >
          {part}
        </span>
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Player Controls */}
      <div className="bg-card border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Volume2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Audio — {title}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            {isPlaying && !isPaused
              ? <Pause className="w-5 h-5 fill-current" />
              : <Play className="w-5 h-5 fill-current ml-0.5" />
            }
          </button>

          {/* Stop */}
          <button
            onClick={stop}
            disabled={!isPlaying && !isPaused}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Restart */}
          <button
            onClick={() => { stop(); setTimeout(speak, 100) }}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1 ml-2 bg-white/5 rounded-full px-1 py-0.5 border border-white/10">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  speed === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Voice selector */}
          {voices.length > 1 && (
            <div className="relative ml-auto">
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 text-xs text-muted-foreground rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name} className="bg-zinc-900">
                    {v.name.replace(/\s*\(.*?\)/g, '')}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {isPlaying && (
          <p className="text-xs text-muted-foreground mt-3">
            {currentWord} / {words.length} words · {Math.ceil((words.length - currentWord) / (words.length / (text.length / (speed * 150))))} min remaining
          </p>
        )}
      </div>

      {/* Scrollable Transcript */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 max-h-64 overflow-y-auto">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-semibold">Transcript</p>
        <div className="text-sm leading-relaxed">
          {renderTranscript()}
        </div>
      </div>
    </div>
  )
}
