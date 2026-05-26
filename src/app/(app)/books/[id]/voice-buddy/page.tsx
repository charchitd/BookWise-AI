"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase"
import { ChevronLeft, Mic, MicOff, Loader2, Volume2, FileText } from "lucide-react"

export default function VoiceBuddyPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [bookTitle, setBookTitle] = useState("")
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [femaleVoice, setFemaleVoice] = useState<SpeechSynthesisVoice | null>(null)

  // PDF Split screen state
  const [splitScreen, setSplitScreen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialization
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("books")
        .select("title, storage_url")
        .eq("id", id)
        .single()

      if (data) {
        setBookTitle(data.title)
        
        // Initial intro from Neo in an energetic anime persona
        setMessages([
          { 
            role: "assistant", 
            content: `Hi there! I'm Neo, your anime study partner! ✨ Let's brainstorm your amazing book, "${data.title || 'this book'}" together! What cool concepts would you like to chat about first? 🌸` 
          }
        ])

        // If storage_url exists, create signed URL for the PDF
        if (data.storage_url) {
          try {
            const { data: signedData, error: signedError } = await supabase.storage
              .from("books")
              .createSignedUrl(data.storage_url, 3600)
            if (signedData?.signedUrl) {
              setPdfUrl(signedData.signedUrl)
            }
          } catch (err) {
            console.error("Error creating signed URL for PDF:", err)
          }
        }
      } else {
        // Fallback intro
        setMessages([
          { 
            role: "assistant", 
            content: `Hi there! I'm Neo, your anime study partner! ✨ Let's brainstorm this book together! What would you like to chat about first? 🌸` 
          }
        ])
      }
    }
    load()
  }, [id, supabase])

  // Setup Speech
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || []
        
        // Prioritize cute/clear female voices for an anime character feel
        const prioritized = [
          "Google US English",
          "Microsoft Zira Desktop",
          "Microsoft Zira",
          "Samantha",
          "Google UK English Female",
          "Victoria",
          "Karen",
          "Moira"
        ]
        
        let selected: SpeechSynthesisVoice | null = null
        for (const name of prioritized) {
          const found = voices.find(v => v.name.includes(name))
          if (found) {
            selected = found
            break
          }
        }
        
        if (!selected) {
          selected = voices.find(v => 
            v.name.toLowerCase().includes("female") || 
            v.name.toLowerCase().includes("zira") || 
            v.name.toLowerCase().includes("samantha") ||
            v.name.toLowerCase().includes("girl")
          ) || voices[0]
        }
        
        setFemaleVoice(selected || null)
      }
      
      loadVoices()
      if (synthRef.current?.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }
          setTranscript(finalTranscript || interimTranscript)
          
          if (finalTranscript) {
            handleUserMessage(finalTranscript)
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
    
    return () => {
      synthRef.current?.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      synthRef.current?.cancel() // stop current speech
      setTranscript("")
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const speakText = (text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    // Clean emojis and special symbols so TTS engine doesn't speak them literally
    const cleanText = text
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
      .replace(/\*+/g, '') // remove markdown bold/italic asterisks
      .trim()
      
    const utterance = new SpeechSynthesisUtterance(cleanText || text)
    if (femaleVoice) {
      utterance.voice = femaleVoice
    }
    // High-pitched, enthusiastic settings to resemble an anime character
    utterance.pitch = 1.35 
    utterance.rate = 1.1
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthRef.current.speak(utterance)
  }

  const handleUserMessage = async (text: string) => {
    if (!text.trim() || isThinking) return
    const userMsg = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setTranscript("")
    setIsThinking(true)

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: id,
          messages: [...messages, userMsg],
          persona: "neo",
        }),
      })
      
      if (!res.body) throw new Error("No response body")
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let completeResponse = ""
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }])
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        completeResponse += chunk
        setMessages(prev => { 
          const u = [...prev]
          u[u.length - 1] = { role: "assistant", content: completeResponse }
          return u 
        })
      }
      
      speakText(completeResponse)
      
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting." }])
    } finally {
      setIsThinking(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, transcript])

  // Start with greeting if haven't spoken yet
  useEffect(() => {
    if (messages.length === 1 && !isSpeaking && synthRef.current) {
      // Small timeout to let voices load
      setTimeout(() => {
        speakText(messages[0].content)
      }, 1000)
    }
  }, [messages.length])

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/10 via-purple-900/10 to-black z-0 pointer-events-none" />
      
      <div className="p-6 relative z-10 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <Link href={`/books/${id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
            Neo - Voice Buddy
          </h1>
          <p className="text-xs text-gray-500 truncate max-w-[200px]">{bookTitle}</p>
        </div>
        
        {/* Toggle Split Screen */}
        <button
          onClick={() => setSplitScreen(!splitScreen)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
            splitScreen 
              ? "bg-pink-500/20 text-pink-400 border-pink-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]" 
              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          {splitScreen ? "Disable Split Screen" : "Split Screen (PDF)"}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden">
        {splitScreen && (
          <div className="w-full lg:w-1/2 h-[45vh] lg:h-full p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col relative z-20 animate-in slide-in-from-left duration-300">
            {pdfUrl ? (
              <div className="flex-1 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl">
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="Book PDF"
                />
              </div>
            ) : (
              <div className="flex-1 bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <FileText className="w-12 h-12 mb-3 text-pink-500/50" />
                <p className="font-semibold text-white">No PDF File Found</p>
                <p className="text-sm mt-1">Upload a PDF for this book to view it in split screen mode.</p>
              </div>
            )}
          </div>
        )}

        <div className={`flex-1 flex flex-col items-center justify-center p-6 lg:p-8 overflow-y-auto ${splitScreen ? "w-full lg:w-1/2" : "w-full"}`}>
          
          {/* Orb */}
          <div className={`relative flex items-center justify-center ${splitScreen ? "mb-6" : "mb-12"}`}>
            {/* Outer glow depending on state */}
            <div className={`absolute rounded-full blur-3xl transition-all duration-1000 ${
              splitScreen ? "w-48 h-48" : "w-64 h-64"
            } ${
              isSpeaking ? "bg-pink-500/30 scale-110 animate-pulse" : 
              isListening ? "bg-rose-500/20 scale-100" :
              isThinking ? "bg-purple-500/20 scale-105 animate-spin" :
              "bg-pink-500/10 scale-90"
            }`} />
            
            <div className={`rounded-full flex items-center justify-center relative z-10 transition-all duration-500 border-2 ${
              splitScreen ? "w-24 h-24" : "w-32 h-32"
            } ${
              isSpeaking ? "bg-gradient-to-tr from-pink-500 to-rose-400 border-pink-300 shadow-[0_0_50px_rgba(244,63,94,0.5)] scale-110" :
              isListening ? "bg-gradient-to-tr from-rose-600 to-red-500 border-rose-400 shadow-[0_0_30px_rgba(225,29,72,0.4)]" :
              isThinking ? "bg-gradient-to-tr from-purple-600 to-indigo-500 border-purple-400 shadow-[0_0_30px_rgba(147,51,234,0.4)] animate-pulse" :
              "bg-black border-pink-900/50"
            }`}>
              {isThinking ? (
                <Loader2 className={`${splitScreen ? "w-8 h-8" : "w-10 h-10"} text-white animate-spin`} />
              ) : isSpeaking ? (
                <Volume2 className={`${splitScreen ? "w-8 h-8" : "w-12 h-12"} text-white animate-bounce`} />
              ) : isListening ? (
                <Mic className={`${splitScreen ? "w-8 h-8" : "w-12 h-12"} text-white animate-pulse`} />
              ) : (
                <div className={`font-bold text-pink-500 ${splitScreen ? "text-xl" : "text-2xl"}`}>NEO</div>
              )}
            </div>
          </div>

          {/* Transcript / Conversation */}
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 h-64 overflow-y-auto backdrop-blur-sm relative shadow-2xl">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user" ? "bg-white/10 text-white" : "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-100 border border-pink-500/20"
                  }`}>
                    <div className="text-xs opacity-50 mb-1 font-semibold uppercase tracking-wider">{msg.role === "user" ? "You" : "Neo"}</div>
                    {msg.content}
                  </div>
                </div>
              ))}
              {transcript && (
                <div className="flex justify-end opacity-70">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white/5 text-white italic border border-white/10">
                    {transcript}...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-10">
            <button 
              onClick={toggleListening}
              disabled={isThinking}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                  : "bg-white/10 hover:bg-white/20 border border-white/20"
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            {isListening ? "Listening... (Tap to stop)" : "Tap microphone to speak"}
          </p>

        </div>
      </div>
    </div>
  )
}
