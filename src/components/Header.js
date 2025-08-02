'use client'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ currentSection, onSectionChange, onAuthClick }) {
  const { user, signOut, isOnline } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigation = [
    { id: 'data-entry', name: 'ثبت داده', icon: 'fas fa-edit', public: true },
    { id: 'view-data', name: 'مشاهده داده‌ها', icon: 'fas fa-table', public: true },
    { id: 'charts', name: 'نمودار', icon: 'fas fa-chart-area', protected: true },
    { id: 'analysis', name: 'آنالیز', icon: 'fas fa-search', protected: true },
    { id: 'slideshow', name: 'اسلایدشو', icon: 'fas fa-play', public: true },
    { id: 'database', name: 'دیتابیس', icon: 'fas fa-database', public: true },
    { id: 'settings', name: 'تنظیمات', icon: 'fas fa-cog', public: true },
  ]

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="text-2xl font-bold text-blue-600 flex items-center">
              <i className="fas fa-chart-line mr-3 text-3xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"></i>
              سیستم ثبت داده‌های ویبره
            </div>
            
            {/* Connection Status */}
            <div className={`px-3 py-1 rounded-full text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} mr-1`}></i>
              {isOnline ? 'آنلاین' : 'آفلاین'}
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex space-x-reverse space-x-2 bg-gray-100 rounded-lg p-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  currentSection === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                } ${item.protected && !user ? 'opacity-50' : ''}`}
                title={item.protected && !user ? 'نیاز به ورود' : ''}
              >
                <i className={`${item.icon} mr-2`}></i>
                {item.name}
                {item.protected && !user && <i className="fas fa-lock mr-1 text-xs"></i>}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-reverse space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-reverse space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="font-medium">{user.profile?.full_name || 'کاربر'}</div>
                    <div className="text-sm text-gray-500">{user.profile?.role}</div>
                  </div>
                  <i className="fas fa-chevron-down"></i>
                </button>

                {showUserMenu && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.profile?.full_name}</div>
                      <div className="text-gray-500">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        onSectionChange('settings')
                      }}
                      className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i className="fas fa-cog mr-2"></i>
                      تنظیمات
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      خروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                ورود / ثبت نام
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden pb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`p-3 rounded-lg text-center transition-all ${
                  currentSection === item.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${item.protected && !user ? 'opacity-50' : ''}`}
                disabled={item.protected && !user}
              >
                <i className={`${item.icon} text-lg block mb-1`}></i>
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
} 
