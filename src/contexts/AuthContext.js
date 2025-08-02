'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // بررسی وضعیت کاربر
    const checkUser = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    checkUser()

    // ثبت listener برای تغییرات احراز هویت
    authService.onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    // شروع بررسی نشست
    authService.startSessionCheck()

    // Network status listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    const result = await authService.signIn(email, password)
    setLoading(false)
    return result
  }

  const signOut = async () => {
    setLoading(true)
    const result = await authService.signOut()
    setLoading(false)
    return result
  }

  const signUpWithInvite = async (inviteToken, email, password, userData) => {
    setLoading(true)
    const result = await authService.signUpWithInvite(inviteToken, email, password, userData)
    setLoading(false)
    return result
  }

  const value = {
    user,
    loading,
    isOnline,
    signIn,
    signOut,
    signUpWithInvite,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}