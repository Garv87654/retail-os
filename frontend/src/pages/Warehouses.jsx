import React, { useEffect, useState } from 'react'
import { Plus, Warehouse, ShieldAlert, ArrowLeftRight, Navigation, X } from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const Warehouses = () => {
  const { role } = useAuth()
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  
  // Active warehouse details view
  const [activeWh, setActiveWh] = useState(null)
  const [whInventory, setWhInventory] = useState([])
  const [loadingInv, setLoadingInv] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(10000)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [manager, setManager] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Transfer stock states
  const [products, setProducts] = useState([])
  const [fromWhId, setFromWhId] = useState('')
  const [toWhId, setToWhId] = useState('')
  const [prodId, setProdId] = useState('')
  const [transferQty, setTransferQty] = useState(5)

  const isWriter = ['Admin', 'Warehouse Manager'].includes(role)

  const loadWarehouses = () => {
    setLoading(true)
    API.getWarehouses()
      .then(res => {
        setWarehouses(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadWarehouses()
    API.getProducts().then(res => setProducts(res.data))
  }, [])

  const handleWarehouseClick = (wh) => {
    setActiveWh(wh)
    setLoadingInv(true)
    API.getWarehouseInventory(wh.id)
      .then(res => {
        setWhInventory(res.data)
        setLoadingInv(false)
      })
      .catch(err => {
        console.error(err)
        setLoadingInv(false)
      })
  }

  const handleAddClick = () => {
    setName('')
    setCapacity(12000)
    setCity('')
    setState('')
    setManager('')
    setPhone('')
    setEmail('')
    setShowFormModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      await API.createWarehouse({
        name, capacity: parseInt(capacity), city, state, country: 'USA',
        manager_name: manager, phone, email
      })
      setShowFormModal(false)
      loadWarehouses()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating warehouse')
    }
  }

  const handleTransferClick = () => {
    if (warehouses.length < 2) {
      alert('You need at least 2 warehouses to perform transfers')
      return
    }
    setFromWhId(warehouses[0].id)
    setToWhId(warehouses[1].id)
    if (products.length > 0) setProdId(products[0].id)
    setTransferQty(10)
    setShowTransferModal(true)
  }

  const handleTransferSubmit = async (e) => {
    e.preventDefault()
    try {
      await API.transferStock({
        from_warehouse_id: parseInt(fromWhId),
        to_warehouse_id: parseInt(toWhId),
        product_id: parseInt(prodId),
        quantity: parseInt(transferQty)
      })
      setShowTransferModal(false)
      loadWarehouses()
      if (activeWh) handleWarehouseClick(activeWh) // Refresh active warehouse catalog
    } catch (err) {
      alert(err.response?.data?.detail || 'Transfer failed. Check source warehouse stock levels.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Warehouse Logistics</h1>
          <p className="text-sm text-slate-400 mt-1">Monitor capacity loading, transfer stock, and audit local inventories.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTransferClick}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <ArrowLeftRight size={14} /> Stock Transfer
          </button>
          {isWriter && (
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 shadow-md"
            >
              <Plus size={14} /> Create Warehouse
            </button>
          )}
        </div>
      </div>

      {/* Grid of Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-10 text-slate-400">Loading warehouses...</div>
        ) : (
          warehouses.map(w => (
            <div
              key={w.id}
              onClick={() => handleWarehouseClick(w)}
              className={`p-6 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200 ${
                activeWh?.id === w.id 
                  ? 'border-brand-500 ring-2 ring-brand-500/10' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-50 dark:bg-brand-950/20 p-2.5 rounded-xl text-brand-500 dark:text-brand-400">
                    <Warehouse size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">{w.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{w.city}, {w.state}</p>
                  </div>
                </div>
              </div>

              {/* Progress Utilization */}
              <div className="space-y-1.5 mt-6">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>UTILIZATION</span>
                  <span className={w.utilization_pct > 85 ? 'text-rose-500' : 'text-slate-200'}>
                    {w.utilization_pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      w.utilization_pct > 85 ? 'bg-rose-500' :
                      w.utilization_pct > 60 ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${w.utilization_pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">Total Capacity: {w.capacity.toLocaleString()} m³</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-400 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="block uppercase text-[9px]">Manager</span>
                  <span className="text-slate-700 dark:text-slate-300 mt-0.5 block">{w.manager_name}</span>
                </div>
                <div>
                  <span className="block uppercase text-[9px]">Contact</span>
                  <span className="text-slate-700 dark:text-slate-300 mt-0.5 block truncate">{w.phone}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Expanded Catalog Details */}
      {activeWh && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base">{activeWh.name} Stock Catalog</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time inventory levels stored locally at this fulfillment center.</p>
            </div>
            <button onClick={() => setActiveWh(null)} className="text-xs text-slate-400 hover:text-slate-200 font-bold">
              Close Catalog
            </button>
          </div>
          {loadingInv ? (
            <div className="py-10 text-center text-slate-400 text-xs">Loading local inventory catalog...</div>
          ) : whInventory.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">This warehouse does not hold any inventory stock currently.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Available Stock</th>
                    <th className="px-6 py-3">Buying Value</th>
                    <th className="px-6 py-3">Selling Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {whInventory.map(item => (
                    <tr key={item.product_id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-400 text-[11px]">{item.sku}</td>
                      <td className="px-6 py-3.5 text-slate-900 dark:text-slate-100">{item.product_name}</td>
                      <td className="px-6 py-3.5 font-bold">{item.current_stock}</td>
                      <td className="px-6 py-3.5">${item.buying_price.toFixed(2)}</td>
                      <td className="px-6 py-3.5">${item.selling_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">Add Fulfillment Center</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Warehouse Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Capacity (m³)</label>
                  <input type="number" required value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Manager Name</label>
                  <input type="text" required value={manager} onChange={(e) => setManager(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Deploy Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowTransferModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1">Stock Transfer Dispatch</h3>
            <p className="text-xs text-slate-400 mb-4">Coordinate logistics transfer between fulfillment hubs.</p>
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Source Warehouse</label>
                  <select value={fromWhId} onChange={(e) => setFromWhId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination Warehouse</label>
                  <select value={toWhId} onChange={(e) => setToWhId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Select Product</label>
                <select value={prodId} onChange={(e) => setProdId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Quantity to Transfer</label>
                <input type="number" required value={transferQty} onChange={(e) => setTransferQty(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Warehouses
