import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Warehouse, 
  Truck, 
  ShoppingBag, 
  TrendingUp, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { logout, role } = useAuth()

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/warehouses', label: 'Warehouses', icon: Warehouse, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Viewer'] },
    { to: '/sales-orders', label: 'Sales Orders', icon: TrendingUp, roles: ['Admin', 'Warehouse Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/reports', label: 'Reports', icon: FileText, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Viewer'] },
    { to: '/ai-chat', label: 'AI Assistant', icon: MessageSquare, roles: ['Admin', 'Warehouse Manager', 'Procurement Manager', 'Warehouse Staff', 'Viewer'] },
    { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert, roles: ['Admin'] }
  ]

  const filteredLinks = links.filter(link => link.roles.includes(role))

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-full border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500 p-2 rounded-lg text-white shadow-lg shadow-brand-500/30">
            <Warehouse size={20} />
          </div>
          <div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-white to-brand-300 bg-clip-text text-transparent tracking-tight">RetailOS</span>
            <span className="text-[10px] block text-brand-400 font-semibold uppercase tracking-wider">Supply Chain</span>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredLinks.map((link) => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="px-4 py-2.5 mb-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
          <p className="text-[9px] text-brand-400 uppercase tracking-widest font-extrabold">Developer Node</p>
          <p className="text-xs text-slate-300 font-bold mt-0.5">Garv Mahajan</p>
          <p className="text-[9px] text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Core Active
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3.5 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
