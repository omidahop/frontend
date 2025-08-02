 'use client'
import { useState, useEffect } from 'react'
import { dataService } from '../services/dataService'
import { APP_CONFIG } from '../utils/constants'

export default function ViewData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    unit: '',
    equipment: '',
    date: new Date().toISOString().split('T')[0],
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await dataService.getVibrateData(filters)
      
      if (result.success) {
        setData(result.data)
      } else {
        console.error('خطا در بارگیری داده‌ها:', result.error)
      }
    } catch (error) {
      console.error('خطا در بارگیری داده‌ها:', error)
    }
    setLoading(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('داده‌ای برای خروجی وجود ندارد')
      return
    }

    const headers = ['تاریخ', 'واحد', 'تجهیز', 'کاربر', 'یادداشت', 'زمان ثبت']
    APP_CONFIG.parameters.forEach(param => {
      headers.push(`${param.name} (${param.code})`)
    })

    const rows = [headers]
    
    data.forEach(record => {
      const row = [
        record.date,
        record.unit,
        record.equipment,
        record.profiles?.full_name || record.user_name || '',
        record.notes || '',
        new Date(record.created_at).toLocaleString('fa-IR')
      ]
      
      APP_CONFIG.parameters.forEach(param => {
        row.push(record.parameters[param.id] || '')
      })
      
      rows.push(row)
    })

    const csvContent = rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `vibrate_data_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderTable = (unitData, unitId) => {
    const unit = APP_CONFIG.units.find(u => u.id === unitId)
    if (!unitData.length) return null

    return (
      <div key={unitId} className="mb-8">
        <div className={`bg-${unitId === 'DRI1' ? 'blue' : 'red'}-600 text-white p-4 rounded-t-lg`}>
          <h3 className="text-lg font-semibold">
            <i className="fas fa-industry mr-2"></i>
            {unit?.name || unitId} - {filters.date ? new Date(filters.date).toLocaleDateString('fa-IR') : 'همه تاریخ‌ها'}
          </h3>
        </div>
        
        <div className="overflow-x-auto bg-white rounded-b-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 border-b">تجهیزات</th>
                {APP_CONFIG.parameters.map(param => (
                  <th key={param.id} className="px-2 py-3 text-center text-xs font-medium text-gray-900 border-b">
                    <div className="flex flex-col items-center">
                      <i className={param.icon} style={{ color: param.color }}></i>
                      <div className="text-xs mt-1">{param.name}</div>
                      <div className="text-xs text-gray-500">({param.code})</div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                  <i className="fas fa-sticky-note text-amber-500 mr-1"></i>
                  یادداشت
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {''}
              {APP_CONFIG.equipments.map(equipment => {
                const equipmentData = unitData.find(d => d.equipment === equipment.id)
                
                return (
                  <tr key={equipment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 border-r-2 border-blue-500">
                      <div className="flex flex-col items-center">
                        <i className={equipment.icon} style={{ color: equipment.color }} className="text-lg mb-1"></i>
                        <div className="text-sm font-medium text-gray-900">{equipment.name}</div>
                        <div className="text-xs text-gray-500">{equipment.code}</div>
                      </div>
                    </td>
                    {APP_CONFIG.parameters.map(param => (
                      <td key={param.id} className="px-2 py-3 text-center text-sm">
                        {equipmentData?.parameters?.[param.id] !== undefined ? (
                          <span className="font-medium text-gray-900">
                            {equipmentData.parameters[param.id]}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center text-sm">
                      {equipmentData?.notes ? (
                        <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                          <i className="fas fa-comment mr-1"></i>
                          {equipmentData.notes}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          <i className="fas fa-minus"></i>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.unit]) {
      acc[item.unit] = []
    }
    acc[item.unit].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            <i className="fas fa-table mr-3"></i>
            مشاهده داده‌ها
          </h2>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            disabled={data.length === 0}
          >
            <i className="fas fa-download mr-2"></i>
            خروجی CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">واحد:</label>
            <select
              value={filters.unit}
              onChange={(e) => handleFilterChange('unit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">همه واحدها</option>
              {APP_CONFIG.units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تجهیز:</label>
            <select
              value={filters.equipment}
              onChange={(e) => handleFilterChange('equipment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">همه تجهیزات</option>
              {APP_CONFIG.equipments.map(equipment => (
                <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ:</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              <i className="fas fa-search mr-2"></i>
              جستجو
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
            <p className="mt-4 text-gray-600">در حال بارگیری...</p>
          </div>
        )}

        {/* No Data */}
        {!loading && data.length === 0 && (
          <div className="text-center py-8">
            <i className="fas fa-inbox text-6xl text-gray-300"></i>
            <p className="mt-4 text-gray-600">داده‌ای برای نمایش وجود ندارد</p>
          </div>
        )}

        {/* Data Tables - Separated by Unit */}
        {!loading && data.length > 0 && (
          <div>
            {filters.unit === '' ? (
              // Show both units separately
              <>
                {groupedData['DRI1'] && renderTable(groupedData['DRI1'], 'DRI1')}
                {groupedData['DRI2'] && renderTable(groupedData['DRI2'], 'DRI2')}
              </>
            ) : (
              // Show selected unit only
              groupedData[filters.unit] && renderTable(groupedData[filters.unit], filters.unit)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
