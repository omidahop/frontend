import { supabase, offlineDB } from './supabaseClient'
import { authService } from './authService'

class DataService {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupNetworkListeners()
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineData()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // ذخیره داده ویبره
  async saveVibrateData(data) {
    try {
      const user = await authService.getCurrentUser()
      
      const vibrateRecord = {
        ...data,
        user_id: user?.id || null,
        user_name: user?.profile?.full_name || 'کاربر میهمان',
        timestamp: new Date().toISOString(),
        synced: false
      }

      if (this.isOnline && user) {
        // ذخیره آنلاین
        const { data: savedData, error } = await supabase
          .from('vibrate_data')
          .insert(vibrateRecord)
          .select()
          .single()

        if (error) throw error

        // ذخیره در کش آفلاین نیز
        await offlineDB.vibrateData.add({ ...vibrateRecord, synced: true })
        
        return { success: true, data: savedData }
      } else {
        // ذخیره آفلاین
        const id = await offlineDB.vibrateData.add(vibrateRecord)
        
        return { success: true, data: { ...vibrateRecord, id }, offline: true }
      }
    } catch (error) {
      console.error('خطا در ذخیره داده:', error)
      return { success: false, error: error.message }
    }
  }

  // دریافت داده‌های ویبره
  async getVibrateData(filters = {}) {
    try {
      const user = await authService.getCurrentUser()
      
      if (this.isOnline && user) {
        // دریافت از سرور
        let query = supabase
          .from('vibrate_data')
          .select('*, profiles(full_name, role)')
          .order('created_at', { ascending: false })

        // اعمال فیلترها
        if (filters.unit) {
          query = query.eq('unit', filters.unit)
        }
        if (filters.equipment) {
          query = query.eq('equipment', filters.equipment)
        }
        if (filters.date) {
          query = query.eq('date', filters.date)
        }
        if (filters.dateFrom && filters.dateTo) {
          query = query.gte('date', filters.dateFrom).lte('date', filters.dateTo)
        }

        const { data, error } = await query

        if (error) throw error

        return { success: true, data: data || [] }
      } else {
        // دریافت از آفلاین
        let data = await offlineDB.vibrateData.toArray()
        
        // اعمال فیلترها
        if (filters.unit) {
          data = data.filter(d => d.unit === filters.unit)
        }
        if (filters.equipment) {
          data = data.filter(d => d.equipment === filters.equipment)
        }
        if (filters.date) {
          data = data.filter(d => d.date === filters.date)
        }
        if (filters.dateFrom && filters.dateTo) {
          data = data.filter(d => d.date >= filters.dateFrom && d.date <= filters.dateTo)
        }

        return { success: true, data: data.reverse() }
      }
    } catch (error) {
      console.error('خطا در دریافت داده:', error)
      return { success: false, error: error.message }
    }
  }

  // همگام‌سازی داده‌های آفلاین
  async syncOfflineData() {
    try {
      const user = await authService.getCurrentUser()
      if (!user) return

      console.log('شروع همگام‌سازی داده‌های آفلاین...')

      // دریافت داده‌های همگام‌نشده
      const unsyncedData = await offlineDB.vibrateData
        .where('synced')
        .equals(false)
        .toArray()

      if (unsyncedData.length === 0) {
        console.log('داده‌ای برای همگام‌سازی وجود ندارد')
        return
      }

      // ارسال داده‌ها به سرور
      for (const data of unsyncedData) {
        try {
          const { error } = await supabase
            .from('vibrate_data')
            .insert({
              ...data,
              user_id: user.id,
              user_name: user.profile?.full_name
            })

          if (!error) {
            // علامت‌گذاری به عنوان همگام‌شده
            await offlineDB.vibrateData.update(data.id, { synced: true })
          }
        } catch (itemError) {
          console.error('خطا در همگام‌سازی آیتم:', itemError)
        }
      }

      console.log(`${unsyncedData.length} داده همگام‌سازی شد`)
      
      // اطلاع‌رسانی Real-time
      this.notifyRealTimeUpdate('SYNC_COMPLETED', {
        count: unsyncedData.length,
        userId: user.id
      })

    } catch (error) {
      console.error('خطا در همگام‌سازی:', error)
    }
  }

  // دریافت آمار واحدها
  async getUnitsStats() {
    try {
      const user = await authService.getCurrentUser()
      
      if (!this.isOnline || !user) {
        return { success: false, error: 'دسترسی به آمار نیازمند ورود و اتصال اینترنت است' }
      }

      const { data, error } = await supabase
        .rpc('get_units_statistics')

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('خطا در دریافت آمار واحدها:', error)
      return { success: false, error: error.message }
    }
  }

  // دریافت 10 داده آخر با جزئیات کاربر
  async getLatestDataWithUsers(limit = 10) {
    try {
      const user = await authService.getCurrentUser()
      
      if (!this.isOnline || !user) {
        return { success: false, error: 'دسترسی به این بخش نیازمند ورود و اتصال اینترنت است' }
      }

      const { data, error } = await supabase
        .from('vibrate_data')
        .select(`
          *,
          profiles(
            full_name,
            role,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('خطا در دریافت آخرین داده‌ها:', error)
      return { success: false, error: error.message }
    }
  }

  // Real-time subscriptions
  subscribeToDataChanges(callback) {
    return supabase
      .channel('vibrate_data_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vibrate_data' 
      }, callback)
      .subscribe()
  }

  // اطلاع‌رسانی Real-time
  notifyRealTimeUpdate(event, data) {
    supabase.channel('app_notifications')
      .send({
        type: 'broadcast',
        event: event,
        payload: data
      })
  }

  // آنالیز افزایش‌های غیرعادی
  async getAnomaliesAnalysis(settings = {}) {
    try {
      const user = await authService.getCurrentUser()
      
      if (!this.isOnline || !user) {
        return { success: false, error: 'آنالیز نیازمند ورود و اتصال اینترنت است' }
      }

      const { data, error } = await supabase
        .rpc('analyze_vibration_anomalies', {
          threshold_percent: settings.threshold || 20,
          days_range: settings.timeRange || 7,
          comparison_days: settings.comparisonDays || 1
        })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('خطا در آنالیز:', error)
      return { success: false, error: error.message }
    }
  }
}

export const dataService = new DataService()