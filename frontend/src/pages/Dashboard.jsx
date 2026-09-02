import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  AlertTriangle, 
  ShoppingBag, 
  DollarSign, 
  Warehouse, 
  Truck, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Check,
  Plus
} from 'lucide-react'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'
import MetricCard from '../components/MetricCard'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [warehouses, setWarehouses] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const displayName = user?.username === 'admin' ? 'Garv' : (user?.username || 'Garv')

  useEffect(() => {
    Promise.all([
      API.getReportsSummary(),
      API.getWarehouses(),
      API.getPurchaseOrders(),
      API.getProducts(),
      API.getAuditLogs()
    ])
    .then(([summaryRes, warehousesRes, poRes, productsRes, logsRes]) => {
      setSummary(summaryRes.data)
      setWarehouses(warehousesRes.data || [])
      setPurchaseOrders(poRes.data || [])
      setProducts(productsRes.data || [])
      setLogs(logsRes.data || [])
      setLoading(false)
    })
    .catch(err => {
      console.error('Error loading dashboard data', err)
      setError('Unable to load dashboard metrics. Try again.')
      setLoading(false)
    })
  }, [])

  // Calculate dynamic stats
  const lowStockItems = products.filter(p => p.current_stock <= p.minimum_stock)
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Pending')

  // Bind dynamic trend data
  const hasSalesData = (summary?.sales?.total_revenue || 0) > 0 || (summary?.purchases?.total_expenditure || 0) > 0
  const monthlySalesData = summary?.sales_purchases_trend || []

  const hasAnyUtilization = warehouses.some(w => (w.utilization_pct || 0) > 0)
  const warehouseUtilizationData = warehouses.map(w => ({
    name: w.name,
    value: hasAnyUtilization ? Math.max(0, Math.round(w.utilization_pct || 0)) : 1,
    displayValue: Math.max(0, Math.round(w.utilization_pct || 0)),
    stock: w.current_stock || 0
  }))

  const COLORS = ['#0e8be4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertOctagon className="text-rose-500 w-12 h-12" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{error}</h3>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-all"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-1">
      {/* Dynamic Operational Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Good morning, {displayName}.
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-brand-500"></span>
          <span>
            {lowStockItems.length} products are below reorder level · {pendingPOs.length} purchase orders need approval
          </span>
        </p>
      </div>

      {/* Needs Attention / Actionable Panel */}
      <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50 p-5 rounded-xl space-y-3 shadow-sm">
        <h3 className="font-bold text-sm text-rose-800 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Needs Attention</span>
        </h3>
        
        {lowStockItems.length === 0 && pendingPOs.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-emerald-750 dark:text-emerald-400 font-medium bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-lg border border-emerald-100/85 dark:border-emerald-900/30">
            <Check size={14} className="text-emerald-600" />
            <span>No pending alerts. You're all caught up.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockItems.slice(0, 3).map(p => (
              <div 
                key={p.id} 
                onClick={() => navigate('/inventory')}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-rose-100/80 dark:border-rose-950/30 rounded-lg hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer transition-all duration-200 group"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Stock: <span className="text-rose-500 font-bold">{p.current_stock} left</span> (Min: {p.minimum_stock})</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-all">
                  <span>Reorder {p.minimum_stock * 2}</span>
                  <ArrowRight size={10} />
                </div>
              </div>
            ))}

            {pendingPOs.slice(0, 3).map(po => (
              <div 
                key={po.id} 
                onClick={() => navigate('/purchase-orders')}
                className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950/30 rounded-lg hover:border-amber-300 dark:hover:border-amber-800 cursor-pointer transition-all duration-200 group"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Order {po.po_number || `PO-${po.id}`}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Supplier: {po.supplier?.name || 'External Vendor'}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-all">
                  <span>Review & Approve</span>
                  <ArrowRight size={10} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Row with Visual Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={products.length}
          icon={Package}
          change={products.length > 0 ? "+8.2%" : null}
          accentColor="border-t-brand-500"
        />
        <MetricCard
          title="Low Stock Products"
          value={lowStockItems.length}
          icon={AlertTriangle}
          change={lowStockItems.length > 0 ? `+${lowStockItems.length}` : null}
          isNegative={lowStockItems.length > 0}
          subtitle={`Out of stock: ${products.filter(p => p.current_stock === 0).length}`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(summary?.sales?.total_revenue ?? 0.00).toLocaleString()}`}
          icon={DollarSign}
          change={summary?.sales?.total_revenue > 0 ? "+15.3%" : null}
          accentColor="border-t-emerald-500"
        />
        <MetricCard
          title="Warehouse Utilization"
          value={`${Math.round(summary?.warehouse_utilization_pct ?? 0)}%`}
          icon={Warehouse}
        />
      </div>

      {/* Actionable Area Chart (Sales vs Purchases) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-xl lg:col-span-2 space-y-5 flex flex-col justify-between">
          <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Sales vs Purchases</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Last 7 months · Trend overview</p>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sales</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">${(summary?.sales?.total_revenue ?? 0.00).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Purchases</p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">${(summary?.purchases?.total_expenditure ?? 0.00).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="h-72 flex items-center justify-center">
            {!hasSalesData ? (
              <div className="w-full flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                <TrendingUp className="text-slate-300 dark:text-slate-700 w-8 h-8" />
                <p className="text-xs font-semibold text-slate-500">No transaction data available yet</p>
                <p className="text-[10px] text-slate-400">Your monthly sales and purchases trend will appear here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySalesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e8be4" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0e8be4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend iconSize={10} verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="Sales" stroke="#0e8be4" fillOpacity={1} fill="url(#colorSales)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="Purchases" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Warehouse Capacity Table & Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Warehouse Capacity</h3>
          
          <div className="h-44 flex items-center justify-center">
            {warehouses.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                <Warehouse className="text-slate-300 dark:text-slate-700 w-8 h-8" />
                <p className="text-xs font-semibold text-slate-500">No active warehouses</p>
                <button 
                  onClick={() => navigate('/warehouses')}
                  className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-brand-600 dark:text-slate-200 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Plus size={10} /> Add Center
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={warehouseUtilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {warehouseUtilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => `${props.payload.displayValue ?? value}% Capacity`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {warehouses.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-bold uppercase">
                    <th className="pb-1.5">Center</th>
                    <th className="pb-1.5 text-right">Stock</th>
                    <th className="pb-1.5 text-right">Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                  {warehouseUtilizationData.map((w, index) => (
                    <tr key={w.name} onClick={() => navigate('/warehouses')} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40">
                      <td className="py-2 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate max-w-[100px]">{w.name}</span>
                      </td>
                      <td className="py-2 text-right">{w.stock}</td>
                      <td className="py-2 text-right font-extrabold text-slate-700 dark:text-slate-300">{w.displayValue}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Best Sellers & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Best Sellers</h3>
          
          {(!summary?.top_selling_products || summary.top_selling_products.length === 0) ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
              <Package className="text-slate-300 dark:text-slate-700 w-8 h-8" />
              <p className="text-xs font-semibold text-slate-500">No sales recorded yet</p>
              <p className="text-[10px] text-slate-400">Complete a Sales Order to see your best sellers here.</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.top_selling_products} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-xl space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Activity Log</h3>
          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No recent activity.</p>
            ) : (
              logs.slice(0, 10).map((log, idx) => {
                let Icon = Activity;
                let colorClass = "text-slate-600 bg-slate-50 dark:bg-slate-900/20";
                
                if (log.action.includes('Create') || log.action.includes('Approve')) {
                  Icon = CheckCircle2;
                  colorClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20";
                } else if (log.action.includes('Delete') || log.action.includes('Reject')) {
                  Icon = AlertTriangle;
                  colorClass = "text-rose-600 bg-rose-50 dark:bg-rose-950/20";
                } else if (log.action.includes('Update') || log.action.includes('Transfer')) {
                  Icon = Truck;
                  colorClass = "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
                }

                return (
                  <div key={log.id || idx} className="flex items-start gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg transition-all">
                    <div className={`p-1.5 rounded-lg ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {log.action} {log.entity_type && `- ${log.entity_type}`}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {log.details || `Action performed on ${log.entity_type} #${log.entity_id}`}
                        <span className="block mt-0.5 opacity-60">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
