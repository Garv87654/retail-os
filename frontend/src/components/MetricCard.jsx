import React from 'react'

const MetricCard = ({ title, value, icon: Icon, change, isNegative = false, subtitle = '' }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{value}</h3>
        {change && (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-bold ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
              {change}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
          </div>
        )}
        {subtitle && (
          <p className="text-[11px] text-slate-400 font-medium leading-none">{subtitle}</p>
        )}
      </div>
      <div className="bg-brand-50 dark:bg-brand-950/20 p-3.5 rounded-xl text-brand-500 dark:text-brand-400">
        <Icon size={22} />
      </div>
    </div>
  )
}

export default MetricCard
