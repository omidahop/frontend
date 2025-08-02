 
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dataService } from '../services/dataService'
import { offlineDB } from '../services/supabaseClient'

export default function Database() {
  const { user, isOnline } = useAuth()
  const [stats, setStats] = useState({
    totalRecords: 0,
    offlineRecords: 0,
    syncedRecords: 0,
    lastSync: null,
    dbSize: '0 KB'
  })
  const [latestData, setLatestData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDatabaseStats()
    loadLatestData()
  }, [user, isOnline])

  const loadDatabaseStats = async () => {
    try {
      // آمار آفلاین
      const offlineRecords = await offlineDB.vibrateData.count()
      const syncedRecords = await offlineDB.vibrateData.where('synced').equals(true).count()
      const unsyncedRecords = offlineRecords - syncedRecords

      // تخمین حجم
      const allOfflineData = await offlineDB.vibrateData.toArray()
      const dataSize = JSON.stringify(allOfflineData).length
      const dbSizeKB = Math.round(dataSize / 1024)

      setStats(prev => ({
        ...prev,
        offlineRecords,
        syncedRecords: syncedRecords,
        unsyncedRecords,
        dbSize: `${dbSizeKB} KB`
      }))

      // آمار آنلاین
      if (user && isOnline) {
        const result = await dataService.getUnitsStats()
        if (result.success) {
          const totalRecords = result.data.reduce((sum, unit) => sum + parseInt(unit.total_records), 0)
          setStats(prev => ({
            ...prev,
            totalRecords,
            lastSync: new Date().toLocaleString('fa-IR')
          }))
        }
      }
    } catch (error) {
      console.error('خطا در بارگیری آمار:', error)
    }
  }

  const loadLatestData = async () => {
    if (!user || !isOnline) return
    
    try {
      const result = await dataService.getLatestDataWithUsers(10)
      
      if (result.success) {
        setLatestData(result.data)
      }
    } catch (error) {
      console.error('خطا در بارگیری آخرین داده‌ها:', error)
    }
  }

  const syncOfflineData = async () => {
    setLoading(true)
    try {
      await dataService.syncOfflineData()
      await loadDatabaseStats()
      alert('همگام‌سازی با موفقیت انجام شد')
    } catch (error) {
      console.error('خطا در همگام‌سازی:', error)
      alert('خطا در همگام‌سازی')
    }
    setLoading(false)
  }

  const clearOfflineData = async () => {
    if (!confirm('آیا می‌خواهید تمام داده‌های آفلاین را پاک کنید؟')) {
      return
    }

    try {
      await offlineDB.vibrateData.clear()
      await offlineDB.settings.clear()
      await loadDatabaseStats()
      alert('داده‌های آفلاین پاک شدند')
    } catch (error) {
      console.error('خطا در پاک کردن داده‌ها:', error)
      alert('خطا در پاک کردن داده‌ها')
    }
  }

  const exportData = async (format = 'csv') => {
    setLoading(true)
    try {
      const result = await dataService.getVibrateData()
      
      if (!result.success || result.data.length === 0) {
        alert('داده‌ای برای خروجی وجود ندارد')
        setLoading(false)
        return
      }

      const data = result.data
      
      if (format === 'csv') {
        // ایجاد CSV
        const headers = ['تاریخ', 'واحد', 'تجهیز', 'کاربر', 'یادداشت', 'زمان ثبت']
        // اضافه کردن هدرهای پارامترها...
        
        const csvContent = [headers, ...data.map(record => [
          record.date,
          record.unit,
          record.equipment,
          record.profiles?.full_name || record.user_name,
          record.notes || '',
          new Date(record.created_at).toLocaleString('fa-IR')
          // پارامترها...
        ])].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `vibrate_data_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else {
        // ایجاد JSON
        const jsonContent = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `vibrate_data_${new Date().toISOString().split('T')[0]}.json`
        link.click()
      }

      alert(`${data.length} رکورد صادر شد`)
    } catch (error) {
      console.error('خطا در صادر کردن داده‌ها:', error)
      alert('خطا در صادر کردن داده‌ها')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          <i className="fas fa-database mr-3"></i>
          مدیریت دیتابیس
        </h2>

        {/* Connection Status */}
        <div className={`p-4 rounded-lg mb-6 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="flex items-center">
            <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} mr-2 text-lg`}></i>
            <div>
              <div className="font-semibold">
                {isOnline ? 'متصل به سرور' : 'حالت آفلاین'}
              </div>
              <div className="text-sm">
                {isOnline 
                  ? `آخرین همگام‌سازی: ${stats.lastSync || 'هنوز همگام‌سازی نشده'}`
                  : 'برخی قابلیت‌ها محدود است'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Database Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalRecords}
            </div>
            <div className="text-sm text-blue-800 font-medium">
              <i className="fas fa-cloud mr-1"></i>
              رکوردهای آنلاین
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.offlineRecords}
            </div>
            <div className="text-sm text-green-800 font-medium">
              <i className="fas fa-mobile-alt mr-1"></i>
              رکوردهای آفلاین
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.unsyncedRecords || 0}
            </div>
            <div className="text-sm text-purple-800 font-medium">
              <i className="fas fa-sync-alt mr-1"></i>
              در انتظار همگام‌سازی
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-gray-600 mb-2">
              {stats.dbSize}
            </div>
            <div className="text-sm text-gray-800 font-medium">
              <i className="fas fa-hdd mr-1"></i>
              حجم کل
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Export/Import */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-exchange-alt mr-2"></i>
            خروجی و ورودی
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={() => exportData('csv')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-download mr-2"></i>
              خروجی CSV
            </button>
            
            <button
              onClick={() => exportData('json')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-download mr-2"></i>
              خروجی JSON
            </button>
          </div>
        </div>

        {/* Sync & Cleanup */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-sync-alt mr-2"></i>
            همگام‌سازی و پاکسازی
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={syncOfflineData}
              disabled={loading || !user || !isOnline}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              همگام‌سازی دستی
            </button>
            
            <button
              onClick={clearOfflineData}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <i className="fas fa-trash mr-2"></i>
              پاک کردن کش آفلاین
            </button>
          </div>
        </div>
      </div>

      {/* Latest Data */}
      {user && isOnline && latestData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            <i className="fas fa-clock mr-2"></i>
            آخرین 10 داده ثبت شده
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-3 font-medium text-gray-700">تاریخ</th>
                  <th className="text-right p-3 font-medium text-gray-700">واحد</th>
                  <th className="text-right p-3 font-medium text-gray-700">تجهیز</th>
                  <th className="text-right p-3 font-medium text-gray-700">کاربر</th>
                  <th className="text-center p-3 font-medium text-gray-700">زمان ثبت</th>
                </tr>
              </thead>
              <tbody>
                {latestData.map((record, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3">{new Date(record.date).toLocaleDateString('fa-IR')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.unit === 'DRI1' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.unit}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{record.equipment}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                          {record.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{record.profiles?.full_name || record.user_name}</div>
                          <div className="text-xs text-gray-500">{record.profiles?.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-600">
                      {new Date(record.created_at).toLocaleString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-600 mb-4"></i>
            <p className="text-lg font-medium">در حال پردازش...</p>
          </div>
        </div>
      )}
    </div>
  )
}