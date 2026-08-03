import React, { useEffect, useState } from 'react'
import { Plus, Receipt, Eye, Sparkles, AlertCircle, X, Trash2 } from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const SalesOrders = () => {
  const { role } = useAuth()
  const [salesOrders, setSalesOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Form states
  const [customerName, setCustomerName] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 2, selling_price: 25.00 }])
  const [tax, setTax] = useState(5.0)
  const [discount, setDiscount] = useState(0.0)

  const isWriter = ['Admin', 'Warehouse Manager', 'Warehouse Staff'].includes(role)

  const loadSalesOrders = () => {
    setLoading(true)
    API.getSalesOrders()
      .then(res => {
        setSalesOrders(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Delete this sales order?')) {
      try {
        await API.deleteSalesOrder(id)
        loadSalesOrders()
      } catch (err) {
        alert(err.response?.data?.detail || 'Error deleting sales order')
      }
    }
  }

  useEffect(() => {
    loadSalesOrders()
    API.getProducts().then(res => {
      setProducts(res.data)
      if (res.data.length > 0) {
        setItems([{ product_id: res.data[0].id, quantity: 2, selling_price: res.data[0].selling_price }])
      }
    })
  }, [])

  const handleAddItemRow = () => {
    const defaultProduct = products[0]
    setItems([...items, { 
      product_id: defaultProduct ? defaultProduct.id : '', 
      quantity: 1, 
      selling_price: defaultProduct ? defaultProduct.selling_price : 20.00 
    }])
  }

  const handleRemoveItemRow = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const handleItemChange = (idx, field, value) => {
    const updated = [...items]
    if (field === 'product_id') {
      const prod = products.find(p => p.id === parseInt(value))
      updated[idx].product_id = parseInt(value)
      if (prod) updated[idx].selling_price = prod.selling_price
    } else if (field === 'quantity') {
      updated[idx].quantity = parseInt(value) || 0
    } else if (field === 'selling_price') {
      updated[idx].selling_price = parseFloat(value) || 0.0
    }
    setItems(updated)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!customerName) {
      alert('Please fill out customer name.')
      return
    }
    
    // Check stock locally before sending to prevent unnecessary errors
    for (const item of items) {
      const p = products.find(prod => prod.id === parseInt(item.product_id))
      if (p && p.current_stock < item.quantity) {
        alert(`Insufficient stock for ${p.name}. Only ${p.current_stock} available.`)
        return
      }
    }

    try {
      await API.createSalesOrder({
        customer_name: customerName,
        tax: parseFloat(tax),
        discount: parseFloat(discount),
        items: items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          selling_price: parseFloat(item.selling_price)
        }))
      })
      setShowFormModal(false)
      loadSalesOrders()
      // Refresh local product list for future stock calculations
      API.getProducts().then(res => setProducts(res.data))
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating sales order')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sales Orders</h1>
          <p className="text-sm text-slate-400 mt-1">Generate customer tax invoices, review payments, and dispatch shipments.</p>
        </div>
        {isWriter && (
          <button
            onClick={() => {
              setCustomerName(`Client ${Math.floor(100 + Math.random() * 900)} Inc.`)
              setShowFormModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 shadow-md shadow-brand-600/10"
          >
            <Plus size={14} /> Create Invoice
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Invoice Number</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Shipment</th>
                <th className="px-6 py-4">Total Value</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">Loading sales orders...</td>
                </tr>
              ) : salesOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">No invoices generated yet.</td>
                </tr>
              ) : (
                salesOrders.map(so => (
                  <tr key={so.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition-all duration-200">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400 text-[11px]">{so.invoice_number}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{so.customer_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                        so.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {so.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                        so.shipment_status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                        so.shipment_status === 'Shipped' ? 'bg-brand-500/10 text-brand-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {so.shipment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">${so.grand_total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(so)
                          setShowDetailsModal(true)
                        }}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Eye size={14} />
                      </button>
                      {isWriter && (
                        <button
                          onClick={() => handleDeleteOrder(so.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Delete Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Creation Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1">Create Tax Invoice</h3>
            <p className="text-xs text-slate-400 mb-4">Select items to purchase. Stock is deducted automatically on order completion.</p>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Customer Client Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none"
                />
              </div>

              {/* Items Row */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Products</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-xs text-brand-500 hover:text-brand-600">
                    + Add Product
                  </button>
                </div>
                
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 mb-1">Product Name</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                            {p.name} (Stock: {p.current_stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-slate-400 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] text-slate-400 mb-1">Selling Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.selling_price}
                        onChange={(e) => handleItemChange(idx, 'selling_price', e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg self-end"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* extras */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Sales Tax ($)</label>
                  <input type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Promo Discount ($)</label>
                  <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Authorize Sale & Ship Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowDetailsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sales Invoice Receipt</span>
                <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedOrder.invoice_number}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500`}>
                {selectedOrder.payment_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="block text-[9px] uppercase">Client Customer</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedOrder.customer_name}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase">Invoice Date</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Invoice Summary</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto pr-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.quantity} Units @ ${item.selling_price.toFixed(2)}</p>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ${(item.quantity * item.selling_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-semibold text-slate-400">
              <div className="flex justify-between">
                <span>Sales Tax:</span>
                <span className="text-slate-800 dark:text-slate-200">${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-slate-800 dark:text-slate-200">-${selectedOrder.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100">
                <span>Grand Total Paid:</span>
                <span>${selectedOrder.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesOrders
