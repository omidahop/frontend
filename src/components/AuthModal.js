'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const { signIn, signUpWithInvite } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'اپراتور تجهیزات',
    unit: 'DRI1',
    inviteToken: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // بررسی توکن دعوت در URL
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('invite')
    if (token) {
      setMode('signup')
      setFormData(prev => ({ ...prev, inviteToken: token }))
    }
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.email || !formData.password) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید')
      setLoading(false)
      return
    }

    const result = await signIn(formData.email, formData.password)
    
    if (result.success) {
      onClose()
      setFormData({ email: '', password: '', confirmPassword: '', fullName: '', role: 'اپراتور تجهیزات', unit: 'DRI1', inviteToken: '' })
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.inviteToken) {
      setError('توکن دعوت مورد نیاز است')
      setLoading(false)
      return
    }

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('لطفاً تمام فیلدها را پر کنید')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند')
      setLoading(false)
      return
    }

    const result = await signUpWithInvite(
      formData.inviteToken,
      formData.email,
      formData.password,
      {
        fullName: formData.fullName,
        role: formData.role,
        unit: formData.unit
      }
    )

    if (result.success) {
      onClose()
      alert('ثبت نام با موفقیت انجام شد. لطفاً ایمیل خود را بررسی کنید.')
    } else {
      setError(result.error)
    }

    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-right shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
          <div className="absolute left-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              {mode === 'signin' ? 'ورود به سیستم' : 'ثبت نام در سیستم'}
            </h2>
            
            {/* Mode Toggle */}
            {!formData.inviteToken && (
              <div className="mt-4 flex justify-center">
                <div className="bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      mode === 'signin' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
                    }`}
                    onClick={() => setMode('signin')}
                  >
                    ورود
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      mode === 'signup' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
                    }`}
                    onClick={() => setMode('signup')}
                  >
                    ثبت نام
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام کامل</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سمت</label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="اپراتور تجهیزات">اپراتور تجهیزات</option>
                        <option value="تکنسین">تکنسین</option>
                        <option value="مهندس">مهندس</option>
                        <option value="سرپرست">سرپرست</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">واحد</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DRI1">DRI 1</option>
                        <option value="DRI2">DRI 2</option>
                        <option value="BOTH">هر دو واحد</option>
                      </select>
                    </div>
                  </div>

                  {formData.inviteToken && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">توکن دعوت</label>
                      <input
                        type="text"
                        name="inviteToken"
                        value={formData.inviteToken}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        readOnly
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تکرار رمز عبور</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  mode === 'signin' ? 'ورود' : 'ثبت نام'
                )}
              </button>
            </form>

            {mode === 'signup' && !formData.inviteToken && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
                <i className="fas fa-info-circle mr-2"></i>
                برای ثبت نام نیاز به لینک دعوت از مدیر سیستم دارید.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
