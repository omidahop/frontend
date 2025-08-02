'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { dataService } from '../services/dataService'
import { APP_CONFIG } from '../utils/constants'

export default function DataEntry() {
  const { user, isOnline } = useAuth()
  const [entryState, setEntryState] = useState({
    mode: 'new',
    selectedUnit: null,
    currentEquipmentIndex: 0,
    currentParameterIndex: 0,
    currentData: {},
    dateData: {},
    editSelectedUnit: null,
    editSelectedEquipment: null,
    editSelectedParameter: null,
    editCurrentValue: null,
    currentEquipmentNote: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const getCurrentDate = () => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 3000)
  }

  const validateValue = (value, parameterId) => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return false
    
    const parameter = APP_CONFIG.parameters.find(p => p.id === parameterId)
    if (!parameter) return false
    
    const maxValue = parameter.type === 'velocity' ? 20 : 2
    const decimalPlaces = (num.toString().split('.')[1] || '').length
    
    return decimalPlaces <= 2 && num <= maxValue
  }

  const selectUnit = async (unitId) => {
    setLoading(true)
    try {
      const today = getCurrentDate()
      
      // بررسی داده‌های موجود
      const result = await dataService.getVibrateData({ 
        unit: unitId, 
        date: today 
      })

      if (result.success) {
        const dateData = {}
        result.data.forEach(item => {
          dateData[item.equipment] = { ...item.parameters }
        })

        setEntryState({
          ...entryState,
          selectedUnit: unitId,
          dateData,
          currentEquipmentIndex: 0,
          currentParameterIndex: 0
        })
      } else {
        showMessage('خطا در بارگیری داده‌ها', 'error')
      }
    } catch (error) {
      console.error('خطا در انتخاب واحد:', error)
      showMessage('خطا در انتخاب واحد', 'error')
    }
    setLoading(false)
  }

  const handleDataInput = async () => {
    const input = document.getElementById('dataInput')
    if (!input) return

    const value = input.value.trim()
    const equipments = APP_CONFIG.equipments
    const parameters = APP_CONFIG.parameters
    const currentParameter = parameters[entryState.currentParameterIndex]
    const currentEquipment = equipments[entryState.currentEquipmentIndex]

    if (!value || !validateValue(value, currentParameter.id)) {
      const maxValue = currentParameter.type === 'velocity' ? 20 : 2
      showMessage(`لطفاً مقدار صحیح (0-${maxValue}) وارد کنید`, 'error')
      return
    }

    // ذخیره پارامتر
    const newDateData = { ...entryState.dateData }
    if (!newDateData[currentEquipment.id]) {
      newDateData[currentEquipment.id] = {}
    }
    newDateData[currentEquipment.id][currentParameter.id] = parseFloat(value)

    setEntryState({
      ...entryState,
      dateData: newDateData,
      currentParameterIndex: entryState.currentParameterIndex + 1
    })

    // بررسی پایان پارامترهای تجهیز
    if (entryState.currentParameterIndex + 1 >= parameters.length) {
      await saveEquipmentData(currentEquipment.id, newDateData[currentEquipment.id])
    }

    // پاک کردن input
    input.value = ''
  }

  const saveEquipmentData = async (equipmentId, parametersData) => {
    try {
      const data = {
        unit: entryState.selectedUnit,
        equipment: equipmentId,
        date: getCurrentDate(),
        parameters: parametersData,
        notes: entryState.currentEquipmentNote
      }

      const result = await dataService.saveVibrateData(data)
      
      if (result.success) {
        const equipment = APP_CONFIG.equipments.find(e => e.id === equipmentId)
        showMessage(`${equipment.name} ذخیره شد`, 'success')
        
        // انتقال به تجهیز بعدی
        proceedToNextEquipment()
      } else {
        showMessage('خطا در ذخیره داده‌ها', 'error')
      }
    } catch (error) {
      console.error('خطا در ذخیره:', error)
      showMessage('خطا در ذخیره داده‌ها', 'error')
    }
  }

  const proceedToNextEquipment = () => {
    const equipments = APP_CONFIG.equipments
    const nextIndex = entryState.currentEquipmentIndex + 1

    if (nextIndex >= equipments.length) {
      showMessage('تمام تجهیزات تکمیل شد!', 'success')
      setEntryState({
        ...entryState,
        mode: 'edit',
        currentEquipmentIndex: 0,
        currentParameterIndex: 0
      })
      return
    }

    setEntryState({
      ...entryState,
      currentEquipmentIndex: nextIndex,
      currentParameterIndex: 0,
      currentEquipmentNote: ''
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleDataInput()
    }
  }

  const switchMode = (mode) => {
    setEntryState({
      ...entryState,
      mode,
      selectedUnit: null,
      currentEquipmentIndex: 0,
      currentParameterIndex: 0,
      editSelectedUnit: null,
      editSelectedEquipment: null,
      editSelectedParameter: null
    })
  }

  const renderCurrentStatus = () => {
    if (!entryState.selectedUnit || entryState.mode !== 'new') return null

    const equipment = APP_CONFIG.equipments[entryState.currentEquipmentIndex]
    const parameter = APP_CONFIG.parameters[entryState.currentParameterIndex]
    const unit = APP_CONFIG.units.find(u => u.id === entryState.selectedUnit)

    if (!equipment || !parameter) return null

    const totalParams = APP_CONFIG.equipments.length * APP_CONFIG.parameters.length
    const currentProgress = (entryState.currentEquipmentIndex * APP_CONFIG.parameters.length) + entryState.currentParameterIndex
    const progressPercent = Math.round((currentProgress / totalParams) * 100)

    return (
      <div className={`bg-gradient-to-r ${entryState.selectedUnit === 'DRI1' ? 'from-blue-50 to-blue-100' : 'from-red-50 to-red-100'} rounded-xl p-6 mb-6`}>
        <div className="text-center">
          <div className={`text-lg font-semibold mb-2 ${entryState.selectedUnit === 'DRI1' ? 'text-blue-700' : 'text-red-700'}`}>
            <i className="fas fa-industry mr-2"></i>
            {unit?.name}
          </div>
          <div className="text-gray-600 mb-2">
            <i className="fas fa-calendar mr-2"></i>
            {new Date().toLocaleDateString('fa-IR')}
          </div>
          <div className="text-xl font-bold text-gray-800 mb-2">
            <i className={`${equipment.icon} mr-2`} style={{ color: equipment.color }}></i>
            {equipment.name}
          </div>
          <div className={`text-lg ${parameter.type === 'velocity' ? 'text-pink-600' : 'text-amber-600'}`}>
            <i className={`${parameter.icon} mr-2`}></i>
            {parameter.name} ({parameter.code})
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-white rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-500 ${entryState.selectedUnit === 'DRI1' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              پیشرفت: {progressPercent}% ({currentProgress} از {totalParams})
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDataInput = () => {
    if (!entryState.selectedUnit || entryState.mode !== 'new') return null

    const parameter = APP_CONFIG.parameters[entryState.currentParameterIndex]
    if (!parameter) return null

    const maxValue = parameter.type === 'velocity' ? 20 : 2

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="text-center mb-6">
          <input
            id="dataInput"
            type="number"
            className={`text-4xl font-bold text-center border-2 rounded-xl px-4 py-3 w-full max-w-md mx-auto focus:outline-none focus:ring-4 ${
              parameter.type === 'velocity' 
                ? 'border-pink-300 focus:border-pink-500 focus:ring-pink-100' 
                : 'border-amber-300 focus:border-amber-500 focus:ring-amber-100'
            }`}
            placeholder="مقدار را وارد کنید"
            min="0"
            max={maxValue}
            step="0.01"
            onKeyPress={handleKeyPress}
          />
          <div className={`mt-2 text-sm ${parameter.type === 'velocity' ? 'text-pink-600' : 'text-amber-600'}`}>
            <i className="fas fa-info-circle mr-1"></i>
            حداکثر مقدار: {maxValue} | Enter برای ثبت
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={handleDataInput}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-save mr-2"></i>
            ذخیره
          </button>
          <button
            onClick={() => {
              setEntryState({
                ...entryState,
                currentEquipmentIndex: 0,
                currentParameterIndex: 0
              })
              document.getElementById('dataInput').value = ''
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-refresh mr-2"></i>
            شروع مجدد
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* User Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
              {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'G'}
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {user?.profile?.full_name || 'کاربر میهمان'}
              </div>
              <div className="text-gray-600 text-sm">
                {user?.profile?.role || 'اپراتور تجهیزات'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">وضعیت اتصال:</div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <i className={`fas ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} mr-1`}></i>
              {isOnline ? 'آنلاین' : 'آفلاین'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <i className={`fas ${
            message.type === 'success' ? 'fa-check-circle' :
            message.type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          } mr-2`}></i>
          {message.text}
        </div>
      )}

      {/* Mode Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          <i className="fas fa-edit mr-3"></i>
          ثبت داده‌های ویبره - روز جاری
        </h2>
        
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => switchMode('new')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              entryState.mode === 'new'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-plus mr-2"></i>
            ثبت جدید
          </button>
          <button
            onClick={() => switchMode('edit')}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-all ${
              entryState.mode === 'edit'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="fas fa-edit mr-2"></i>
            ویرایش
          </button>
        </div>

        {/* Unit Selection */}
        {!entryState.selectedUnit && entryState.mode === 'new' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">انتخاب واحد:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {APP_CONFIG.units.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => selectUnit(unit.id)}
                  disabled={loading}
                  className={`p-6 rounded-xl border-2 transition-all hover:scale-105 ${
                    unit.id === 'DRI1'
                      ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                      : 'border-red-200 hover:border-red-400 hover:bg-red-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <i className={`fas fa-industry text-3xl mb-3 ${
                    unit.id === 'DRI1' ? 'text-blue-600' : 'text-red-600'
                  }`}></i>
                  <div className="font-semibold text-lg text-gray-800">
                    {unit.name}
                  </div>
                  <div className="text-gray-600 text-sm">
                    ({unit.code})
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Status */}
      {renderCurrentStatus()}

      {/* Data Input */}
      {renderDataInput()}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-8">
          <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          <p className="mt-4 text-gray-600">در حال پردازش...</p>
        </div>
      )}
    </div>
  )
} 
