import React, { useState, useEffect } from 'react'
import { Bell, Search, Sun, Moon, User as UserIcon, X, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import API from '../services/api'

const Navbar = () => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Low Stock Alert', message: 'VoltTech Item 1 is below safety stock thresholds.', type: 'LOW_STOCK', read: false },
    { id: 2, title: 'Supplier Delay', message: 'Supplier Nexus 4 reported shipping delay for PO-102.', type: 'SUPPLIER_DELAY', read: false },
    { id: 3, title: 'Expired Products', message: 'PureDwell Item 12 is near its expiry date.', type: 'EXPIRED_PRODUCTS', read: false }
  ])
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search across products, orders, suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-200"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown)
              setShowProfileDropdown(false)
            }}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-200 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-40 transition-all duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new alerts
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-4 flex gap-3 ${!n.read ? 'bg-brand-50/20 dark:bg-brand-950/10' : ''}`}>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                      </div>
                      <button 
                        onClick={() => clearNotification(n.id)} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 self-start"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown)
              setShowNotifDropdown(false)
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm uppercase">
              {user?.username?.substring(0, 2) || 'US'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold leading-tight">{user?.username}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{user?.role}</p>
            </div>
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-40">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user?.username}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => alert(`Active Session Role: ${user?.role}`)}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  View Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
