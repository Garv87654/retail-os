import React from 'react'

const MetricCard = ({ title, value, icon: Icon, change, isNegative = false, subtitle = '', accentColor = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-xl transition-all duration-200 flex items-center justify-between relative overflow-hidden ${accentColor ? `border-t-2 ${accentColor}` : ''}`}>
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{value}</h3>
        {change && (
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-bold ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
              {change}
            </span>
            <span className="text-[9px] text-slate-400 font-medium">vs last month</span>
          </div>
        )}
        {subtitle && (
          <p className="text-[10px] text-slate-400 font-medium leading-none">{subtitle}</p>
        )}
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg text-slate-500 dark:text-slate-400">
        <Icon size={18} />
      </div>
    </div>
  )
}

export default MetricCard
