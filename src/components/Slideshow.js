'use client'
import { useState, useEffect, useRef } from 'react'
import { dataService } from '../services/dataService'
import { APP_CONFIG } from '../utils/constants'

export default function Slideshow() {
  const [slideshowState, setSlideshowState] = useState({
    isRunning: false,
    isPaused: false,
    currentData: null,
    currentEquipmentIndex: 0,
    currentParameterIndex: 0,
    date: new Date().toISOString().split('T')[0],
    unit: 'DRI1',
    speed: 3000,
    isFullscreen: false
  })
  
  const [data, setData] = useState({})
  const intervalRef = useRef(null)
  const fullscreenRef = useRef(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const loadSlideshowData = async () => {
    try {
      const result = await dataService.getVibrateData({
        date: slideshowState.date
      })

      if (result.success) {
        const groupedData = {}
        result.data.forEach(item => {
          const key = `${item.equipment}_${item.unit}`
          groupedData[key] = item.parameters
        })
        setData(groupedData)
      }
    } catch (error) {
      console.error('خطا در بارگیری داده‌های اسلایدشو:', error)
    }
  }

  const startSlideshow = async () => {
    if (!slideshowState.date) {
      alert('لطفاً تاریخ را انتخاب کنید')
      return
    }

    await loadSlideshowData()
    
    setSlideshowState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentEquipmentIndex: 0,
      currentParameterIndex: 0
    }))

    startSlideshowInterval()
  }

  const startSlideshowInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      showNextSlide()
    }, slideshowState.speed)

    showNextSlide()
  }

  const showNextSlide = () => {
    const equipmentsByUnit = getEquipmentsByUnit()
    const parameters = APP_CONFIG.parameters

    if (slideshowState.currentEquipmentIndex >= equipmentsByUnit.length) {
      stopSlideshow()
      return
    }

    const currentEquipment = equipmentsByUnit[slideshowState.currentEquipmentIndex]
    const currentParameter = parameters[slideshowState.currentParameterIndex]

    setSlideshowState(prev => ({
      ...prev,
      currentData: {
        equipment: currentEquipment,
        parameter: currentParameter,
        value: data[`${currentEquipment.id}_${slideshowState.unit}`]?.[currentParameter.id] || '--'
      }
    }))

    setSlideshowState(prev => ({
      ...prev,
      currentParameterIndex: prev.currentParameterIndex + 1
    }))

    if (slideshowState.currentParameterIndex + 1 >= parameters.length) {
      setSlideshowState(prev => ({
        ...prev,
        currentParameterIndex: 0,
        currentEquipmentIndex: prev.currentEquipmentIndex + 1
      }))
    }
  }

  const getEquipmentsByUnit = () => {
    // فیلتر تجهیزات بر اساس واحد انتخابی
    return APP_CONFIG.equipments
  }

  const pauseSlideshow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setSlideshowState(prev => ({ ...prev, isPaused: true }))
  }

  const resumeSlideshow = () => {
    setSlideshowState(prev => ({ ...prev, isPaused: false }))
    startSlideshowInterval()
  }

  const stopSlideshow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setSlideshowState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentData: null,
      currentEquipmentIndex: 0,
      currentParameterIndex: 0
    }))
  }

  const toggleFullscreen = () => {
    setSlideshowState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))
  }

  const updateSpeed = (newSpeed) => {
    setSlideshowState(prev => ({ ...prev, speed: newSpeed * 1000 }))
    
    if (slideshowState.isRunning && !slideshowState.isPaused) {
      startSlideshowInterval()
    }
  }

  const SlideshowDisplay = ({ isFullscreen = false }) => {
    const { currentData } = slideshowState
    const unit = APP_CONFIG.units.find(u => u.id === slideshowState.unit)

    return (
      <div className={`text-center ${isFullscreen ? 'text-white h-screen flex flex-col justify-center' : 'py-12'}`}>
        <div className={`${isFullscreen ? 'text-2xl' : 'text-lg'} font-semibold mb-4`}>
          <i className="fas fa-industry mr-2" style={{ color: unit?.color }}></i>
          {unit?.name}
        </div>
        
        {currentData ? (
          <>
            <div className={`${isFullscreen ? 'text-4xl' : 'text-2xl'} font-bold mb-4`}>
              <i className={currentData.equipment.icon} style={{ color: currentData.equipment.color }} className="mr-3"></i>
              {currentData.equipment.name}
            </div>
            
            <div className={`${isFullscreen ? 'text-2xl' : 'text-xl'} mb-6`}>
              <i className={currentData.parameter.icon} style={{ color: currentData.parameter.color }} className="mr-2"></i>
              {currentData.parameter.name} ({currentData.parameter.code})
            </div>
            
            <div 
              className={`${isFullscreen ? 'text-8xl' : 'text-6xl'} font-bold`}
              style={{ 
                color: currentData.parameter.color,
                textShadow: `0 0 20px ${currentData.parameter.color}50`
              }}
            >
              {currentData.value}
            </div>
          </>
        ) : (
          <div className={`${isFullscreen ? 'text-4xl' : 'text-2xl'} text-gray-500`}>
            اسلایدشو را شروع کنید
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          <i className="fas fa-play mr-3"></i>
          اسلایدشو داده‌ها
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ:</label>
            <input
              type="date"
              value={slideshowState.date}
              onChange={(e) => setSlideshowState(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">واحد:</label>
            <select
              value={slideshowState.unit}
              onChange={(e) => setSlideshowState(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {APP_CONFIG.units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">سرعت (ثانیه):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={slideshowState.speed / 1000}
              onChange={(e) => updateSpeed(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-reverse space-x-4">
          <button
            onClick={startSlideshow}
            disabled={slideshowState.isRunning}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-play mr-2"></i>
            شروع
          </button>

          <button
            onClick={slideshowState.isPaused ? resumeSlideshow : pauseSlideshow}
            disabled={!slideshowState.isRunning}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`fas ${slideshowState.isPaused ? 'fa-play' : 'fa-pause'} mr-2`}></i>
            {slideshowState.isPaused ? 'ادامه' : 'توقف'}
          </button>

          <button
            onClick={stopSlideshow}
            disabled={!slideshowState.isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-stop mr-2"></i>
            پایان
          </button>

          <button
            onClick={toggleFullscreen}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <i className="fas fa-expand mr-2"></i>
            تمام صفحه
          </button>
        </div>
      </div>

      {/* Slideshow Display */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <SlideshowDisplay />
      </div>

      {/* Fullscreen Slideshow */}
      {slideshowState.isFullscreen && (
        <div 
          ref={fullscreenRef}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg z-60"
          >
            <i className="fas fa-times mr-2"></i>
            خروج
          </button>
          
          <SlideshowDisplay isFullscreen={true} />
        </div>
      )}

      {/* Progress Indicator */}
      {slideshowState.isRunning && (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">پیشرفت اسلایدشو:</span>
            <span className="text-sm text-gray-600">
              تجهیز {slideshowState.currentEquipmentIndex + 1} از {APP_CONFIG.equipments.length}
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ 
                width: `${((slideshowState.currentEquipmentIndex * APP_CONFIG.parameters.length + slideshowState.currentParameterIndex) / (APP_CONFIG.equipments.length * APP_CONFIG.parameters.length)) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
} 
