 
'use client'
import { useState, useEffect, useRef } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { dataService } from '../services/dataService'
import { APP_CONFIG } from '../utils/constants'
import { useAuth } from '../contexts/AuthContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Charts() {
  const { user, isOnline } = useAuth()
  const [chartData, setChartData] = useState(null)
  const [filters, setFilters] = useState({
    unit: 'DRI1',
    equipment: APP_CONFIG.equipments[0]?.id || '',
    dateFrom: (() => {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      return date.toISOString().split('T')[0]
    })(),
    dateTo: new Date().toISOString().split('T')[0],
    parameters: ['V1', 'H1']
  })
  const [loading, setLoading] = useState(false)
  const [chartType, setChartType] = useState('line')

  useEffect(() => {
    if (user && isOnline) {
      loadChartData()
    }
  }, [filters, user, isOnline])

  const loadChartData = async () => {
    if (!filters.equipment || filters.parameters.length === 0) return

    setLoading(true)
    try {
      const result = await dataService.getVibrateData({
        unit: filters.unit,
        equipment: filters.equipment,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      })

      if (result.success) {
        processChartData(result.data)
      }
    } catch (error) {
      console.error('خطا در بارگیری داده‌های نمودار:', error)
    }
    setLoading(false)
  }

  const processChartData = (data) => {
    if (!data.length) {
      setChartData(null)
      return
    }

    // Sort data by date
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Extract unique dates
    const dates = [...new Set(sortedData.map(d => d.date))].sort()
    
    // Create datasets for each selected parameter
    const datasets = filters.parameters.map((paramId, index) => {
      const parameter = APP_CONFIG.parameters.find(p => p.id === paramId)
      if (!parameter) return null
      
      const values = dates.map(date => {
        const item = sortedData.find(d => d.date === date)
        return item?.parameters?.[paramId] || null
      })
      
      return {
        label: parameter.name,
        data: values,
        borderColor: parameter.color,
        backgroundColor: parameter.color + '20',
        borderWidth: 2,
        fill: chartType === 'area',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    }).filter(Boolean)
    
    setChartData({
      labels: dates.map(date => new Date(date).toLocaleDateString('fa-IR')),
      datasets
    })
  }

  const handleParameterToggle = (paramId) => {
    setFilters(prev => ({
      ...prev,
      parameters: prev.parameters.includes(paramId)
        ? prev.parameters.filter(p => p !== paramId)
        : [...prev.parameters, paramId]
    }))
  }

  const exportChart = () => {
    const canvas = document.querySelector('#chartCanvas canvas')
    if (!canvas) return
    
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `chart_${filters.equipment}_${new Date().toISOString().split('T')[0]}.png`
    link.href = url
    link.click()
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: 'Vazirmatn'
          }
        }
      },
      title: {
        display: true,
        text: `نمودار ${APP_CONFIG.equipments.find(e => e.id === filters.equipment)?.name} - ${APP_CONFIG.units.find(u => u.id === filters.unit)?.name}`,
        font: {
          family: 'Vazirmatn',
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        titleFont: {
          family: 'Vazirmatn'
        },
        bodyFont: {
          family: 'Vazirmatn'
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'تاریخ',
          font: {
            family: 'Vazirmatn'
          }
        },
        ticks: {
          font: {
            family: 'Vazirmatn'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'مقدار',
          font: {
            family: 'Vazirmatn'
          }
        },
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Vazirmatn'
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  if (!user || !isOnline) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          برای دسترسی به نمودارها نیاز به ورود و اتصال اینترنت دارید
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
            <i className="fas fa-chart-area mr-3"></i>
            نمودارها
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportChart}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={!chartData}
            >
              <i className="fas fa-download mr-2"></i>
              خروجی تصویر
            </button>
            <button
              onClick={loadChartData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <i className="fas fa-sync mr-2"></i>
              بروزرسانی
            </button>
          </div>
        </div>

        {/* Chart Type Selection */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'line', name: 'خطی', icon: 'fas fa-chart-line' },
              { id: 'area', name: 'ناحیه‌ای', icon: 'fas fa-chart-area' },
              { id: 'bar', name: 'ستونی', icon: 'fas fa-chart-bar' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setChartType(type.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  chartType === type.id
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <i className={`${type.icon} mr-2`}></i>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">واحد:</label>
            <select
              value={filters.unit}
              onChange={(e) => setFilters(prev => ({ ...prev, unit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {APP_CONFIG.units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تجهیز:</label>
            <select
              value={filters.equipment}
              onChange={(e) => setFilters(prev => ({ ...prev, equipment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {APP_CONFIG.equipments.map(equipment => (
                <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">از تاریخ:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تا تاریخ:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Parameter Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">انتخاب پارامترها:</label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {APP_CONFIG.parameters.map(parameter => (
              <label
                key={parameter.id}
                className="flex items-center space-x-reverse space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.parameters.includes(parameter.id)}
                  onChange={() => handleParameterToggle(parameter.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-reverse space-x-2">
                  <i className={parameter.icon} style={{ color: parameter.color }}></i>
                  <span className="text-sm font-medium">{parameter.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading && (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
            <p className="mt-4 text-gray-600">در حال بارگیری نمودار...</p>
          </div>
        )}

        {!loading && !chartData && (
          <div className="text-center py-12">
            <i className="fas fa-chart-line text-6xl text-gray-300"></i>
            <p className="mt-4 text-gray-600">داده‌ای برای نمایش نمودار وجود ندارد</p>
            <p className="text-sm text-gray-500">لطفاً تجهیز و پارامترها را انتخاب کنید</p>
          </div>
        )}

        {!loading && chartData && (
          <div id="chartCanvas" className="h-96">
            {chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      {chartData && (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            <i className="fas fa-chart-pie mr-2"></i>
            آمار نمودار
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filters.parameters.map(paramId => {
              const parameter = APP_CONFIG.parameters.find(p => p.id === paramId)
              const dataset = chartData.datasets.find(d => d.label === parameter?.name)
              const values = dataset?.data.filter(v => v !== null) || []
              
              if (values.length === 0) return null
              
              const min = Math.min(...values)
              const max = Math.max(...values)
              const avg = (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)
              
              return (
                <div key={paramId} className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <i className={parameter.icon} style={{ color: parameter.color }} className="mr-2"></i>
                    <span className="font-medium text-sm">{parameter.name}</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>حداکثر: <span className="font-medium">{max}</span></div>
                    <div>حداقل: <span className="font-medium">{min}</span></div>
                    <div>میانگین: <span className="font-medium">{avg}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}