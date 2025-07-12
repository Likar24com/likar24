import { createClient } from '@supabase/supabase-js'

// --- ЗАМІНІТЬ на свої дані:
const SUPABASE_URL = 'https://ewlgummqacagkdumjysj.supabase.co'     // Ваш домен проекту
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bGd1bW1xYWNhZ2tkdW1qeXNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTczMjI4NiwiZXhwIjoyMDY3MzA4Mjg2fQ.R9zigkeQmG6ywX5Dkn571G_hJxbYibybRZcPb2_57sE'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// --- Список UUID для видалення (вставте всі потрібні айді)
const USER_IDS_TO_DELETE = [
  '5fb12a2a-8272-40a6-90fb-4f3cda6a23e7',

  // ... (всі ваші uuid з вашого списку)
]

async function main() {
  for (const id of USER_IDS_TO_DELETE) {
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) {
      console.error(`Помилка видалення ${id}:`, error.message)
    } else {
      console.log(`Користувача ${id} видалено успішно.`)
    }
  }
}

main()
