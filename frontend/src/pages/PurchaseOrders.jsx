import React, { useEffect, useState } from 'react'
import { Plus, ShoppingBag, Eye, Calendar, DollarSign, Clock, X, Trash2 } from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const PurchaseOrders = () => {
  const { role } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPO, setSelectedPO] = useState(null)

  // Form states
  const [supplierId, setSupplierId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 10, buying_price: 15.00 }])
  const [tax, setTax] = useState(15.0)
  const [discount, setDiscount] = useState(0.0)
  const [shipping, setShipping] = useState(25.0)

  const isApprover = ['admin', 'warehouse manager', 'procurement manager'].includes(role?.toLowerCase())
  const isWriter = ['admin', 'procurement manager'].includes(role?.toLowerCase())

  const loadPurchaseOrders = () => {
    setLoading(true)
    API.getPurchaseOrders()
      .then(res => {
        setPurchaseOrders(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadPurchaseOrders()
    API.getProducts().then(res => {
      setProducts(res.data)
      if (res.data.length > 0) {
        // Init form product selection
        setItems([{ product_id: res.data[0].id, quantity: 10, buying_price: res.data[0].buying_price }])
      }
    })
    API.getSuppliers().then(res => {
      setSuppliers(res.data)
      if (res.data.length > 0) setSupplierId(res.data[0].id)
    })
    // Expected delivery default: 1 week from now
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setExpectedDelivery(nextWeek.toISOString().substring(0, 10))
  }, [])

  const handleAddItemRow = () => {
    const defaultProduct = products[0]
    setItems([...items, { 
      product_id: defaultProduct ? defaultProduct.id : '', 
      quantity: 10, 
      buying_price: defaultProduct ? defaultProduct.buying_price : 15.00 
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
      if (prod) updated[idx].buying_price = prod.buying_price
    } else if (field === 'quantity') {
      updated[idx].quantity = parseInt(value) || 0
    } else if (field === 'buying_price') {
      updated[idx].buying_price = parseFloat(value) || 0.0
    }
    setItems(updated)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (items.some(item => !item.product_id)) {
      alert('Please select a product for all line items.')
      return
    }
    try {
      await API.createPurchaseOrder({
        supplier_id: parseInt(supplierId),
        expected_delivery: new Date(expectedDelivery).toISOString(),
        tax: parseFloat(tax),
        discount: parseFloat(discount),
        shipping: parseFloat(shipping),
        items: items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          buying_price: parseFloat(item.buying_price)
        }))
      })
      setShowFormModal(false)
      loadPurchaseOrders()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating purchase order')
    }
  }

  const handleStatusChange = async (poId, nextStatus) => {
    try {
      await API.updatePurchaseOrderStatus(poId, nextStatus)
      loadPurchaseOrders()
      if (showDetailsModal && selectedPO?.id === poId) {
        // Refresh details modal
        API.getPurchaseOrders().then(res => {
          const matching = res.data.find(po => po.id === poId)
          if (matching) setSelectedPO(matching)
        })
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Status transition failed.')
    }
  }

  const handleDeletePO = async (id) => {
    if (window.confirm('Delete this purchase order?')) {
      try {
        await API.deletePurchaseOrder(id)
        loadPurchaseOrders()
      } catch (err) {
        alert(err.response?.data?.detail || 'Error deleting purchase order')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-400 mt-1">Issue procurement requisitions, monitor approvals, and receive incoming inventory stock.</p>
        </div>
        {isWriter && (
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 shadow-md shadow-brand-600/10"
          >
            <Plus size={14} /> Create Requisition
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Expected Delivery</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">Loading purchase orders...</td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-400">No purchase orders drafted.</td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/15 transition-all duration-200">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400 text-[11px]">{po.order_number}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{po.supplier_name}</td>
                    <td className="px-6 py-4">{new Date(po.expected_delivery).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">${po.grand_total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider ${
                        po.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                        po.status === 'Draft' ? 'bg-slate-500/10 text-slate-500' :
                        po.status === 'Pending' ? 'bg-indigo-500/10 text-indigo-500' :
                        po.status === 'Approved' ? 'bg-blue-500/10 text-blue-500' :
                        po.status === 'Ordered' ? 'bg-brand-500/10 text-brand-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {po.status}
                      </span>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPO(po)
                          setShowDetailsModal(true)
                        }}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePO(po.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Delete Order"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requisition Creation Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1">Issue Purchase Requisition</h3>
            <p className="text-xs text-slate-400 mb-4">Calculate prices, taxes, and log procurement requests.</p>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Supplier Partnership</label>
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Expected Delivery Date</label>
                  <input type="date" required value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>

              {/* Items Table Form */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Line Items</h4>
                  <button type="button" onClick={handleAddItemRow} className="text-xs text-brand-500 hover:text-brand-600">
                    + Add Row
                  </button>
                </div>
                
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-400 mb-1">Product</label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg"
                      >
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.buying_price})</option>)}
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
                      <label className="block text-[10px] text-slate-400 mb-1">Buying Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.buying_price}
                        onChange={(e) => handleItemChange(idx, 'buying_price', e.target.value)}
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

              {/* Extras */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Tax ($)</label>
                  <input type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Discount ($)</label>
                  <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Shipping Freight ($)</label>
                  <input type="number" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Issue Draft Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requisition Details Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowDetailsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Purchase Order Details</span>
                <h3 className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedPO.order_number}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wide bg-brand-500/10 text-brand-500`}>
                {selectedPO.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="block text-[9px] uppercase">Supplier Partnership</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">{selectedPO.supplier_name}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase">Delivery Expectation</span>
                <span className="text-slate-800 dark:text-slate-200 mt-0.5 block">{new Date(selectedPO.expected_delivery).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Line Items List */}
            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Line Items Summary</h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto pr-1">
                {selectedPO.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.product_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.quantity} Units @ ${item.buying_price.toFixed(2)}</p>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      ${(item.quantity * item.buying_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs font-semibold text-slate-400 mb-6">
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="text-slate-800 dark:text-slate-200">${selectedPO.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-slate-800 dark:text-slate-200">-${selectedPO.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-slate-800 dark:text-slate-200">${selectedPO.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100">
                <span>Grand Total:</span>
                <span>${selectedPO.grand_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Approver Action Panel */}
            {isApprover && (
              <div className="pt-2 flex gap-2">
                {selectedPO.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusChange(selectedPO.id, 'Pending')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                  >
                    Submit for Approval
                  </button>
                )}
                {selectedPO.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(selectedPO.id, 'Approved')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                    >
                      Approve Requisition
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedPO.id, 'Rejected')}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedPO.status === 'Approved' && (
                  <button
                    onClick={() => handleStatusChange(selectedPO.id, 'Ordered')}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-xs"
                  >
                    Mark as Ordered
                  </button>
                )}
                {selectedPO.status === 'Ordered' && (
                  <button
                    onClick={() => handleStatusChange(selectedPO.id, 'Delivered')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                  >
                    Confirm Delivery (Intake Stock)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchaseOrders
