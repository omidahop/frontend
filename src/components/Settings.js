'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    theme: 'light',
    primaryColor: '#2563eb',
    dri1Color: '#3b82f6',
    dri2Color: '#ef4444',
    analysisThreshold: 20,
    analysisTimeRange: 7,
    analysisComparisonDays: 1,
    notifications: {
      realTime: true,
      email: false,
      push: true
    }
  })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    // بارگیری تنظیمات از localStorage یا سرور
    try {
      const savedSettings = localStorage.getItem('appSettings')
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) })
      }
    } catch (error) {
      console.error('خطا در بارگیری تنظیمات:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      // ذخیره در localStorage
      localStorage.setItem('appSettings', JSON.stringify(settings))
      
      // ذخیره در سرور (اگر کاربر وارد شده)
      if (user) {
        // API call to save settings
      }

      // اعمال تنظیمات
      applySettings()
      
      alert('تنظیمات ذخیره شد')
    } catch (error) {
      console.error('خطا در ذخیره تنظیمات:', error)
      alert('خطا در ذخیره تنظیمات')
    }
    setLoading(false)
  }

  const applySettings = () => {
    // تم
    document.documentElement.setAttribute('data-theme', settings.theme)
    
    // رنگ‌ها
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor)
    document.documentElement.style.setProperty('--dri1-color', settings.dri1Color)
    document.documentElement.style.setProperty('--dri2-color', settings.dri2Color)
  }

  const resetSettings = () => {
    if (confirm('آیا می‌خواهید تنظیمات را به حالت پیش‌فرض برگردانید؟')) {
      setSettings({
        theme: 'light',
        primaryColor: '#2563eb',
        dri1Color: '#3b82f6',
        dri2Color: '#ef4444',
        analysisThreshold: 20,
        analysisTimeRange: 7,
        analysisComparisonDays: 1,
        notifications: {
          realTime: true,
          email: false,
          push: true
        }
      })
    }
  }

  const updateSetting = (key, value) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setSettings(prev => ({ ...prev, [key]: value }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          <i className="fas fa-cog mr-3"></i>
          تنظیمات
        </h2>

        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              <i className="fas fa-palette mr-2"></i>
              ظاهر و تم
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تم:</label>
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">روشن</option>
                  <option value="dark">تیره</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رنگ اصلی:</label>
                <div className="flex items-center space-x-reverse space-x-3">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{settings.primaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رنگ DRI 1:</label>
                <div className="flex items-center space-x-reverse space-x-3">
                  <input
                    type="color"
                    value={settings.dri1Color}
                    onChange={(e) => updateSetting('dri1Color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{settings.dri1Color}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رنگ DRI 2:</label>
                <div className="flex items-center space-x-reverse space-x-3">
                  <input
                    type="color"
                    value={settings.dri2Color}
                    onChange={(e) => updateSetting('dri2Color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{settings.dri2Color}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              <i className="fas fa-search mr-2"></i>
              تنظیمات آنالیز
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  حد آستانه افزایش (درصد): {settings.analysisThreshold}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.analysisThreshold}
                  onChange={(e) => updateSetting('analysisThreshold', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  بازه زمانی بررسی (روز): {settings.analysisTimeRange} روز
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={settings.analysisTimeRange}
                  onChange={(e) => updateSetting('analysisTimeRange', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 روز</span>
                  <span>30 روز</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مقایسه با (روز قبل): {settings.analysisComparisonDays} روز
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={settings.analysisComparisonDays}
                  onChange={(e) => updateSetting('analysisComparisonDays', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 روز</span>
                  <span>7 روز</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold mb-4">
              <i className="fas fa-bell mr-2"></i>
              تنظیمات اطلاع‌رسانی
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">اطلاع‌رسانی آنی</div>
                  <div className="text-sm text-gray-600">دریافت اطلاع‌رسانی‌های Real-time</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.realTime}
                    onChange={(e) => updateSetting('notifications.realTime', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">اطلاع‌رسانی ایمیل</div>
                  <div className="text-sm text-gray-600">دریافت ایمیل برای تغییرات مهم</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => updateSetting('notifications.email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">اعلان‌های Push</div>
                  <div className="text-sm text-gray-600">اعلان‌های مرورگر و موبایل</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => updateSetting('notifications.push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* User Profile Settings */}
          {user && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">
                <i className="fas fa-user mr-2"></i>
                پروفایل کاربری
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-reverse space-x-4 mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{user.profile?.full_name}</div>
                    <div className="text-gray-600">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.profile?.role}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">واحد: </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${user.profile?.unit === 'DRI1' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                      {user.profile?.unit}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">تاریخ عضویت: </span>
                    <span>{new Date(user.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              <i className="fas fa-database mr-2"></i>
              مدیریت داده‌ها
            </h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                <div className="text-sm text-yellow-800">
                  عملیات‌های زیر قابل بازگشت نیستند. با احتیاط عمل کنید.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (confirm('آیا می‌خواهید کش محلی را پاک کنید؟')) {
                    localStorage.clear()
                    location.reload()
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-trash mr-2"></i>
                پاک کردن کش محلی
              </button>

              <button
                onClick={() => {
                  if (confirm('آیا می‌خواهید تنظیمات را به حالت اولیه برگردانید؟')) {
                    resetSettings()
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-undo mr-2"></i>
                بازنشانی تنظیمات
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-8 pt-6 border-t">
          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                در حال ذخیره...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                ذخیره تنظیمات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}