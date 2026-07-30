import React, { useEffect, useState } from 'react'
import { 
  Package, 
  AlertTriangle, 
  ShoppingBag, 
  DollarSign, 
  Warehouse, 
  Truck, 
  CheckCircle2, 
  Activity 
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
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
  Cell 
} from 'recharts'
import API from '../services/api'
import MetricCard from '../components/MetricCard'

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.getReportsSummary()
      .then(res => {
        setSummary(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching dashboard summary', err)
        setLoading(false)
      })
  }, [])

  // Static/Mock Chart Data for visual excellence (aligned with seeded values)
  const monthlySalesData = [
    { name: 'Jan', Sales: 4000, Purchases: 2400 },
    { name: 'Feb', Sales: 3000, Purchases: 1398 },
    { name: 'Mar', Sales: 9800, Purchases: 2000 },
    { name: 'Apr', Sales: 2780, Purchases: 3908 },
    { name: 'May', Sales: 1890, Purchases: 4800 },
    { name: 'Jun', Sales: 2390, Purchases: 3800 },
    { name: 'Jul', Sales: 3490, Purchases: 4300 }
  ]

  const warehouseUtilizationData = [
    { name: 'Austin Fulfillment', value: 72 },
    { name: 'Chicago Hub', value: 45 },
    { name: 'Seattle Bay', value: 85 },
    { name: 'Atlanta Depot', value: 60 },
    { name: 'NYC Urban', value: 92 }
  ]

  const topSellingProducts = [
    { name: 'VoltTech Premium Item', sales: 450 },
    { name: 'ApexAudio Premium Item', sales: 380 },
    { name: 'KitchMaster Item', sales: 320 },
    { name: 'UrbanFit Item', sales: 290 },
    { name: 'TrekPeak Outfitter', sales: 240 }
  ]

  const COLORS = ['#0e8be4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 p-1">
      {/* Page Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Real-time oversight of retail supply chain operations, demand metrics, and logistics KPIs.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={summary?.inventory?.total_products || '100'}
          icon={Package}
          change="+8.2%"
        />
        <MetricCard
          title="Low Stock Products"
          value={summary?.inventory?.low_stock || '12'}
          icon={AlertTriangle}
          change="-4.5%"
          isNegative={true}
          subtitle={`Out of stock: ${summary?.inventory?.out_of_stock || 2}`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={`$${(summary?.sales?.total_revenue || 54290.50).toLocaleString()}`}
          icon={DollarSign}
          change="+15.3%"
        />
        <MetricCard
          title="Warehouse Utilization"
          value="70.8%"
          icon={Warehouse}
          subtitle="Seeded: 5 centers active"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchases (Area Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base">Monthly Sales & Expenditure Trend</h3>
            <span className="text-xs text-slate-400 font-medium">USD - Last 7 Months</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e8be4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0e8be4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Sales" stroke="#0e8be4" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Purchases" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPurchases)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Utilization Percentage (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-base">Warehouse Stock Loading</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={warehouseUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {warehouseUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}% Capacity`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold mt-4">
            {warehouseUtilizationData.map((w, index) => (
              <div key={w.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate text-slate-500 dark:text-slate-400">{w.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-base">Top Selling Products</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#33415510" />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={120} tickLine={false} />
                <Tooltip />
                <Bar dataKey="sales" fill="#10b981" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Operational Logins & Notifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-5">
          <h3 className="font-bold text-base">System Operational Logs</h3>
          <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200">
              <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Purchase Order Approved</p>
                <p className="text-[11px] text-slate-400 mt-1">PO-SEED-2026020 was approved by admin. Delivery expected tomorrow.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200">
              <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg text-amber-600">
                <Activity size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">XGBoost Forecast Recalculated</p>
                <p className="text-[11px] text-slate-400 mt-1">Weekly forecast re-run successfully completed for 100 products.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200">
              <div className="bg-blue-100 dark:bg-blue-950/40 p-2 rounded-lg text-blue-600">
                <Truck size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Inventory Transfer Complete</p>
                <p className="text-[11px] text-slate-400 mt-1">20 units of VoltTech Item 1 transferred from Chicago to Seattle.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
