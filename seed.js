require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase env vars")
  process.exit(1)
}

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seed() {
  const email = `test_course_${Date.now()}@example.com`
  const password = "password123"

  console.log(`Creating user ${email}...`)
  
  // Use admin auth to create a confirmed user immediately
  const { data: userAuth, error: authErr } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authErr) {
    console.error("Auth error:", authErr)
    process.exit(1)
  }

  const userId = userAuth.user.id
  console.log(`User created: ${userId}`)

  console.log("Seeding book data...")
  const { data: book, error: bookErr } = await adminAuthClient.from("books").insert({
    user_id: userId,
    title: "Mastering React",
    author: "AI Author",
    total_pages: 120,
    status: "ready"
  }).select().single()

  if (bookErr) {
    console.error("Book error:", bookErr)
    process.exit(1)
  }

  console.log("Seeding chapters...")
  const { data: chapter, error: chapterErr } = await adminAuthClient.from("chapters").insert({
    book_id: book.id,
    num: 1,
    title: "Introduction to Hooks",
    page_start: 1,
    page_end: 10,
    summary: "React hooks allow you to use state and other React features without writing a class.",
    difficulty: 3
  }).select().single()

  if (chapterErr) {
    console.error("Chapter error:", chapterErr)
    process.exit(1)
  }

  const { data: chapter2, error: chapter2Err } = await adminAuthClient.from("chapters").insert({
    book_id: book.id,
    num: 2,
    title: "Advanced State Management",
    page_start: 11,
    page_end: 25,
    summary: "Managing complex state with useReducer and Context API.",
    difficulty: 4
  }).select().single()

  console.log("Seeding concepts...")
  await adminAuthClient.from("concepts").insert([
    {
      chapter_id: chapter.id,
      book_id: book.id,
      name: "useState",
      mastery_state: "new"
    },
    {
      chapter_id: chapter.id,
      book_id: book.id,
      name: "useEffect",
      mastery_state: "new"
    }
  ])

  console.log(`\n\nSEED SUCCESS!`)
  console.log(`Login Email: ${email}`)
  console.log(`Login Password: ${password}`)
  
  // Save credentials to a temp file for the agent to read
  const fs = require('fs')
  fs.writeFileSync('temp_credentials.txt', `${email}\n${password}`)
}

seed().catch(console.error)
