'use client'
import { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import { useAuth } from '../contexts/AuthContext'

export default function Analysis() {
  const { user, isOnline } = useAuth()
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    threshold: 20,
    timeRange: 7,
    comparisonDays: 1
  })
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user && isOnline) {
      loadAnalysis()
      loadStats()
    }
  }, [settings, user, isOnline])

  const loadAnalysis = async () => {
    setLoading(true)
    try {
      const result = await dataService.getAnomaliesAnalysis(settings)
      
      if (result.success) {
        setAnomalies(result.data)
      } else {
        console.error('خطا در آنالیز:', result.error)
      }
    } catch (error) {
      console.error('خطا در آنالیز:', error)
    }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const result = await dataService.getUnitsStats()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('خطا در بارگیری آمار:', error)
    }
  }

  const getSeverityClass = (percentage) => {
    if (percentage >= 50) return 'bg-red-100 text-red-800 border-red-200'
    if (percentage >= 30) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  const getSeverityIcon = (percentage) => {
    if (percentage >= 50) return 'fas fa-exclamation-triangle'
    if (percentage >= 30) return 'fas fa-exclamation-circle'
    return 'fas fa-info-circle'
  }

  if (!user || !isOnline) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          برای دسترسی به آنالیز نیاز به ورود و اتصال اینترنت دارید
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            <i className="fas fa-search mr-3"></i>
            آنالیز افزایش‌های غیرعادی
          </h2>
          <button
            onClick={loadAnalysis}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <i className="fas fa-sync mr-2"></i>
            بروزرسانی
          </button>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              حد آستانه افزایش (درصد):
            </label>
            <div className="flex items-center space-x-reverse space-x-4">
              <input
                type="range"
                min="1"
                max="100"
                value={settings.threshold}
                onChange={(e) => setSettings(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium min-w-[60px] text-center">
                {settings.threshold}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              بازه زمانی بررسی (روز):
            </label>
            <div className="flex items-center space-x-reverse space-x-4">
              <input
                type="range"
                min="1"
                max="30"
                value={settings.timeRange}
                onChange={(e) => setSettings(prev => ({ ...prev, timeRange: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium min-w-[60px] text-center">
                {settings.timeRange} روز
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مقایسه با (روز قبل):
            </label>
            <div className="flex items-center space-x-reverse space-x-4">
              <input
                type="range"
                min="1"
                max="7"
                value={settings.comparisonDays}
                onChange={(e) => setSettings(prev => ({ ...prev, comparisonDays: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium min-w-[60px] text-center">
                {settings.comparisonDays} روز
              </span>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">خلاصه آمار:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.reduce((sum, unit) => sum + unit.total_records, 0)}</div>
                <div className="text-sm text-gray-600">کل رکوردها</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.reduce((sum, unit) => sum + unit.unique_dates, 0)}</div>
                <div className="text-sm text-gray-600">روزهای فعال</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.reduce((sum, unit) => sum + unit.active_users, 0)}</div>
                <div className="text-sm text-gray-600">کاربران فعال</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{anomalies.length}</div>
                <div className="text-sm text-gray-600">مورد غیرعادی</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          <p className="mt-4 text-gray-600">در حال آنالیز داده‌ها...</p>
        </div>
      )}

      {/* No Anomalies */}
      {!loading && anomalies.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
          <h3 className="text-xl font-bold text-gray-800 mb-2">هیچ افزایش غیرعادی یافت نشد</h3>
          <p className="text-gray-600">تمام پارامترها در محدوده طبیعی قرار دارند</p>
        </div>
      )}

      {/* Anomalies List */}
      {!loading && anomalies.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              موارد غیرعادی یافت شده ({anomalies.length} مورد)
            </h3>
            <div className="grid gap-4">
              {anomalies.map((anomaly, index) => (
                <div key={index} className={`border-2 rounded-xl p-6 transition-all hover:shadow-md ${getSeverityClass(anomaly.increase_percentage)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className="p-2 bg-white rounded-full">
                        <i className={getSeverityIcon(anomaly.increase_percentage)}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{anomaly.equipment}</h4>
                        <p className="text-sm opacity-80">{anomaly.unit} - {anomaly.parameter_key}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">+{anomaly.increase_percentage.toFixed(1)}%</div>
                      <div className="text-sm opacity-80">افزایش</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
                      <div className="text-sm opacity-80">مقدار قبلی</div>
                      <div className="font-bold text-lg">{anomaly.previous_value}</div>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
                      <div className="text-sm opacity-80">مقدار فعلی</div>
                      <div className="font-bold text-lg">{anomaly.current_value}</div>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
                      <div className="text-sm opacity-80">افزایش مطلق</div>
                      <div className="font-bold text-lg">+{(anomaly.current_value - anomaly.previous_value).toFixed(2)}</div>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
                      <div className="text-sm opacity-80">تاریخ</div>
                      <div className="font-bold text-sm">{new Date(anomaly.date).toLocaleDateString('fa-IR')}</div>
                    </div>
                    <div className="bg-white bg-opacity-50 rounded-lg p-3 text-center">
                      <div className="text-sm opacity-80">کاربر ثبت‌کننده</div>
                      <div className="font-bold text-sm">{anomaly.user_name}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-xs opacity-70">
                    <span>آنالیز انجام شده بر اساس {settings.timeRange} روز گذشته</span>
                    <span>مقایسه با {settings.comparisonDays} روز قبل</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
