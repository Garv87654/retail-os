import React, { useEffect, useState } from 'react'
import { ShieldAlert, Terminal, Calendar, User } from 'lucide-react'
import API from '../services/api'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.getAuditLogs()
      .then(res => {
        setLogs(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Audit Trail Logs</h1>
        <p className="text-sm text-slate-400 mt-1">Read-only security logs capturing user log-ins, edits, and stock adjustments.</p>
      </div>

      {/* Logs list */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
          <Terminal size={16} className="text-brand-500" />
          <span className="font-bold text-sm tracking-tight text-white">System Security Log Registry</span>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 divide-y divide-slate-800/40">
          {loading ? (
            <p className="text-center text-slate-500 py-10">Fetching secure system logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-center text-slate-500 py-10">No logs generated. Complete database seed routines.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 first:pt-0">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-950 text-brand-400 text-[10px] font-bold uppercase">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <User size={10} /> By {log.username || 'System'}
                    </span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed font-semibold">{log.details}</p>
                </div>
                <div className="text-slate-500 text-[10px] sm:text-right shrink-0 flex items-center gap-1.5 self-start">
                  <Calendar size={11} />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLogs
