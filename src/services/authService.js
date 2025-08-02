import { supabase } from './supabaseClient'

class AuthService {
  constructor() {
    this.currentUser = null
    this.authStateCallbacks = []
  }

  // ثبت نام با لینک یکبار مصرف
  async signUpWithInvite(inviteToken, email, password, userData) {
    try {
      // بررسی اعتبار توکن دعوت
      const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', inviteToken)
        .eq('used', false)
        .single()

      if (!invite) {
        throw new Error('لینک دعوت نامعتبر یا منقضی شده است')
      }

      // ثبت نام کاربر
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            role: userData.role,
            unit: userData.unit
          }
        }
      })

      if (authError) throw authError

      // ایجاد پروفایل کاربر
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.fullName,
          role: userData.role,
          unit: userData.unit,
          avatar_url: userData.avatarUrl || null
        })

      if (profileError) throw profileError

      // علامت‌گذاری توکن به عنوان استفاده شده
      await supabase
        .from('invitations')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('id', invite.id)

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('خطا در ثبت نام:', error)
      return { success: false, error: error.message }
    }
  }

  // ورود
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // بارگیری تنظیمات کاربر
      await this.loadUserSettings(data.user.id)
      
      this.currentUser = data.user
      this.notifyAuthStateChange(data.user)

      return { success: true, user: data.user }
    } catch (error) {
      console.error('خطا در ورود:', error)
      return { success: false, error: error.message }
    }
  }

  // خروج
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      this.currentUser = null
      this.notifyAuthStateChange(null)
      
      return { success: true }
    } catch (error) {
      console.error('خطا در خروج:', error)
      return { success: false, error: error.message }
    }
  }

  // بررسی وضعیت ورود
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // بارگیری اطلاعات کامل کاربر
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        this.currentUser = { ...user, profile }
        return this.currentUser
      }
      
      return null
    } catch (error) {
      console.error('خطا در دریافت کاربر:', error)
      return null
    }
  }

  // بارگیری تنظیمات کاربر
  async loadUserSettings(userId) {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)

      const settings = {}
      data?.forEach(setting => {
        settings[setting.key] = setting.value
      })

      return settings
    } catch (error) {
      console.error('خطا در بارگیری تنظیمات:', error)
      return {}
    }
  }

  // ثبت callback برای تغییرات وضعیت احراز هویت
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback)
    
    // ثبت listener برای supabase
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null
      this.notifyAuthStateChange(this.currentUser)
    })
  }

  notifyAuthStateChange(user) {
    this.authStateCallbacks.forEach(callback => callback(user))
  }

  // بررسی اعتبار نشست (هر 5 دقیقه)
  startSessionCheck() {
    setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session && this.currentUser) {
        // نشست منقضی شده
        this.currentUser = null
        this.notifyAuthStateChange(null)
      }
    }, 5 * 60 * 1000) // 5 دقیقه
  }
}

export const authService = new AuthService()