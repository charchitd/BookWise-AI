export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0E0C09] flex flex-col justify-center items-center relative p-4">
      <div className="absolute top-6 left-6 text-[#C8502A] text-2xl font-bold tracking-tight">
        BookWise AI
      </div>
      {children}
    </div>
  )
}
