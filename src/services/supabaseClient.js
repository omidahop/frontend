import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export const createSupabaseClient = () => createClientComponentClient()

// دیتابیس آفلاین برای زمان عدم اتصال
import Dexie from 'dexie'

export class OfflineDB extends Dexie {
  constructor() {
    super('VibrateOfflineDB')
    this.version(1).stores({
      vibrateData: '++id, unit, equipment, date, parameters, timestamp, userName, notes, synced',
      settings: '++id, key, value, userId',
      users: '++id, name, role, avatar, createdAt'
    })
  }
}

export const offlineDB = new OfflineDB()