"use client"
import { useState, useCallback } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { Loader2, UploadCloud, FileText } from "lucide-react"

export function UploadDropzone({ onUpload }: { onUpload: (url: string, bookId: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  
  const supabase = createBrowserClient()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile)
      await uploadFile(droppedFile)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected?.type === "application/pdf") {
      setFile(selected)
      await uploadFile(selected)
    }
  }

  const uploadFile = async (selectedFile: File) => {
    setIsUploading(true)
    setProgress(10)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Create book record
    const { data: book, error: bookError } = await supabase.from('books')
      .insert({
        user_id: user.id,
        title: selectedFile.name.replace('.pdf', ''),
        status: 'processing',
      }).select().single()

    if (bookError) {
      console.error(bookError)
      setIsUploading(false)
      return
    }

    setProgress(30)
    const storagePath = `${user.id}/${book.id}.pdf`
    
    // 2. Upload to storage bucket
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('books')
      .upload(storagePath, selectedFile, {
        cacheControl: '3600',
        upsert: true
      })

    setProgress(80)
    
    if (uploadError) {
      console.error(uploadError)
      await supabase.from('books').update({ status: 'failed' }).eq('id', book.id)
      setIsUploading(false)
      return
    }

    // 3. Update book with storage URL
    await supabase.from('books').update({ storage_url: storagePath }).eq('id', book.id)
    
    setProgress(100)
    onUpload(storagePath, book.id)
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors ${
          isDragActive ? "border-[#C8502A] bg-orange-50/50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 text-[#C8502A] animate-spin" />
            <p className="text-gray-600 font-medium">Uploading {file?.name}...</p>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#C8502A] transition-all duration-300" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700">Drag & drop your PDF here</p>
            <p className="text-sm text-gray-500 mb-6">or click to browse from your computer</p>
            
            <label className="cursor-pointer bg-[#C8502A] hover:bg-[#b04523] text-white px-6 py-2 rounded-md font-medium transition-colors">
              Select PDF
              <input 
                type="file" 
                className="hidden" 
                accept="application/pdf"
                onChange={handleChange}
              />
            </label>
            
            {file && (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-md shadow-sm border">
                <FileText className="w-4 h-4 text-[#C8502A]" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
