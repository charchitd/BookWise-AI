"use client"

import { useState, useEffect, useRef } from "react"
import { POLICIES, POLICY_VERSION } from "@/lib/policies"
import { Check, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactMarkdown from 'react-markdown' // Let's use simple markdown, or just pre-wrap if not installed.

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

export function PolicyModal({ isOpen, onClose, onAccept }: PolicyModalProps) {
  const [activeTab, setActiveTab] = useState(POLICIES[0].id)
  const [readPolicies, setReadPolicies] = useState<Set<string>>(new Set())
  const [scrollProgress, setScrollProgress] = useState<Record<string, number>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    // Check if the current tab doesn't need scrolling
    const el = scrollRef.current
    if (el) {
      // Small timeout to ensure DOM is updated after activeTab change
      setTimeout(() => {
        if (el.scrollHeight <= el.clientHeight + 10) {
          setReadPolicies(prev => new Set(prev).add(activeTab))
          setScrollProgress(prev => ({ ...prev, [activeTab]: 100 }))
        } else {
          // ensure progress exists
          if (scrollProgress[activeTab] === undefined) {
            setScrollProgress(prev => ({ ...prev, [activeTab]: 0 }))
          }
        }
      }, 50)
    }
  }, [activeTab, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100))
    
    setScrollProgress(prev => ({ ...prev, [activeTab]: progress }))
    
    if (scrollHeight - scrollTop - clientHeight < 20) {
      setReadPolicies(prev => new Set(prev).add(activeTab))
    }
  }

  const activeContent = POLICIES.find(p => p.id === activeTab)?.content || ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[680px] max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Legal Agreements</h2>
            <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-md">
              {POLICY_VERSION}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flex Container for Tabs and Content */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Tabs Sidebar */}
          <div className="w-48 bg-gray-50 border-r overflow-y-auto">
            {POLICIES.map((policy) => {
              const Icon = policy.icon
              const isRead = readPolicies.has(policy.id)
              const isActive = activeTab === policy.id
              
              return (
                <button
                  key={policy.id}
                  onClick={() => setActiveTab(policy.id)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                    isActive ? "bg-white border-l-4 border-l-[#C8502A]" : "hover:bg-gray-100 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className={`flex items-center gap-2 ${isActive ? "text-[#C8502A]" : "text-gray-600"}`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{policy.title}</span>
                  </div>
                  {isRead && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-white relative">
            {/* Scroll Progress Bar at the top of content */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-10">
              <div 
                className="h-full bg-[#C8502A] transition-all duration-150 ease-out"
                style={{ width: `${scrollProgress[activeTab] || 0}%` }}
              />
            </div>
            
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 scroll-smooth"
            >
              {/* Using standard markdown formatting classes via Tailwind Typography or basic HTML */}
              <div className="prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-headings:font-bold prose-h2:text-lg prose-h2:mt-6 prose-p:leading-relaxed">
                {activeContent.split('\\n\\n').map((paragraph, i) => {
                  if (paragraph.startsWith('## ')) {
                    return <h2 key={i}>{paragraph.replace('## ', '')}</h2>
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={i} className="list-disc pl-5 mt-2">
                        {paragraph.split('\\n').map((li, j) => (
                          <li key={j}>{li.replace('- ', '').replace(/\\*\\*/g, '')}</li>
                        ))}
                      </ul>
                    )
                  }
                  return <p key={i} className="mt-4">{paragraph}</p>
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-600 font-medium">
            <span className={readPolicies.size === POLICIES.length ? "text-green-600 font-semibold flex items-center gap-1" : ""}>
              {readPolicies.size === POLICIES.length && <Check className="w-4 h-4" />}
              {readPolicies.size} of {POLICIES.length} policies read
            </span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onAccept()
                onClose()
              }}
              disabled={readPolicies.size < POLICIES.length}
              className={`${readPolicies.size === POLICIES.length ? "bg-[#C8502A] hover:bg-[#b04523] text-white" : ""}`}
            >
              Accept All
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
