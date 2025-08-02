 
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

// Components
import Header from '../components/Header'
import AuthModal from '../components/AuthModal'
import DataEntry from '../components/DataEntry'
import ViewData from '../components/ViewData'
import Charts from '../components/Charts'
import Analysis from '../components/Analysis'
import Slideshow from '../components/Slideshow'
import Database from '../components/Database'
import Settings from '../components/Settings'

export default function Home() {
  const { user, loading, isOnline } = useAuth()
  const [currentSection, setCurrentSection] = useState('data-entry')
  const [showAuthModal, setShowAuthModal] = useState(false)

  // بررسی نیاز به ورود برای بخش‌های خاص
  const protectedSections = ['charts', 'analysis']
  
  const handleSectionChange = (section) => {
    if (protectedSections.includes(section) && !user) {
      setShowAuthModal(true)
      return
    }
    setCurrentSection(section)
  }

  const renderCurrentSection = () => {
    switch(currentSection) {
      case 'data-entry':
        return <DataEntry />
      case 'view-data':
        return <ViewData />
      case 'charts':
        return user ? <Charts /> : <div className="text-center p-8">برای دسترسی به نمودارها وارد شوید</div>
      case 'analysis':
        return user ? <Analysis /> : <div className="text-center p-8">برای دسترسی به آنالیز وارد شوید</div>
      case 'slideshow':
        return <Slideshow />
      case 'database':
        return <Database />
      case 'settings':
        return <Settings />
      default:
        return <DataEntry />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگیری...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onAuthClick={() => setShowAuthModal(true)}
      />
      
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2">
          <i className="fas fa-wifi-slash mr-2"></i>
          حالت آفلاین - برخی قابلیت‌ها محدود است
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {renderCurrentSection()}
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}