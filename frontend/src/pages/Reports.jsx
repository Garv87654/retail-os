import React, { useEffect, useState } from 'react'
import { FileText, Download, TrendingUp, BarChart2, Briefcase, Award } from 'lucide-react'
import API from '../services/api'

const Reports = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.getReportsSummary()
      .then(res => {
        setSummary(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const downloadReport = (type) => {
    window.open(`http://localhost:8000/api/reports/export/pdf?report_type=${type}`, '_blank')
  }

  const reportsList = [
    { title: 'Inventory Levels Report', desc: 'Detailed listing of items in stock, min/max thresholds, and total capital investments.', type: 'inventory', icon: Briefcase },
    { title: 'Supplier Performance Review', desc: 'Average delivery delays, lead times, PO quantities, and compliance ratings.', type: 'supplier', icon: Award },
    { title: 'Sales & Revenue Summary', desc: 'Customer invoice collections, tax summaries, sales counts, and monthly revenue performance.', type: 'sales', icon: TrendingUp },
    { title: 'Executive Supply Overview', desc: 'Consolidated overview of warehouses, inventories, suppliers, and operational KPIs.', type: 'summary', icon: BarChart2 }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Business Reports</h1>
        <p className="text-sm text-slate-400 mt-1">Generate PDF and CSV executive briefings for operational audit compliance.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Inventory Assets</span>
          <p className="text-2xl font-bold">${(summary?.inventory?.total_stock_value ?? 0.00).toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Net Revenue Collections</span>
          <p className="text-2xl font-bold text-emerald-500">${(summary?.sales?.total_revenue ?? 0.00).toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Suppliers</span>
          <p className="text-2xl font-bold">{summary?.suppliers?.total_suppliers ?? 0} Active</p>
        </div>
      </div>

      {/* Reports Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsList.map(rep => {
          const Icon = rep.icon
          return (
            <div key={rep.type} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-4 hover:shadow-md transition-all duration-200">
              <div className="bg-brand-50 dark:bg-brand-950/20 p-3 rounded-xl text-brand-500 shrink-0">
                <Icon size={20} />
              </div>
              <div className="flex-1 space-y-1.5">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{rep.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{rep.desc}</p>
                <div className="pt-4">
                  <button
                    onClick={() => downloadReport(rep.type)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/60 font-semibold text-[10px] rounded-lg transition-all duration-200"
                  >
                    <Download size={12} /> Download PDF Report
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Reports
