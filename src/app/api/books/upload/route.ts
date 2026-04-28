import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Use /api/books/ingest instead" }, { status: 400 })
}
