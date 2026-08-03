import React, { useEffect, useState } from 'react'
import { Plus, Star, Award, ShieldAlert, Clock, Mail, Phone, Calendar, X, Trash2 } from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const Suppliers = () => {
  const { role } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  
  // Expanded Performance states
  const [activeSup, setActiveSup] = useState(null)
  const [perfData, setPerfData] = useState(null)
  const [loadingPerf, setLoadingPerf] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [gst, setGst] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Net 30')
  const [rating, setRating] = useState(5.0)
  const [leadTime, setLeadTime] = useState(5)

  const isWriter = ['Admin', 'Procurement Manager'].includes(role)

  const loadSuppliers = () => {
    setLoading(true)
    API.getSuppliers()
      .then(res => {
        setSuppliers(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleSupplierClick = (sup) => {
    setActiveSup(sup)
    setLoadingPerf(true)
    API.getSupplierPerformance(sup.id)
      .then(res => {
        setPerfData(res.data)
        setLoadingPerf(false)
      })
      .catch(err => {
        console.error(err)
        setLoadingPerf(false)
      })
  }

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Delete this supplier?')) {
      try {
        await API.deleteSupplier(id)
        loadSuppliers()
        if (activeSup?.id === id) setActiveSup(null)
      } catch (err) {
        alert(err.response?.data?.detail || 'Error deleting supplier')
      }
    }
  }

  const handleAddClick = () => {
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    setGst(`GST-${Math.floor(10 + Math.random() * 89)}ABCDE${Math.floor(1000 + Math.random() * 9000)}F`)
    setPaymentTerms('Net 30')
    setRating(5.0)
    setLeadTime(5)
    setShowFormModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      await API.createSupplier({
        name, email, phone, address, gst_number: gst,
        payment_terms: paymentTerms, rating: parseFloat(rating),
        delivery_time: parseInt(leadTime), status: 'Active'
      })
      setShowFormModal(false)
      loadSuppliers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error creating supplier')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Suppliers Network</h1>
          <p className="text-sm text-slate-400 mt-1">Audit supplier service ratings, payment terms, and delivery performance benchmarks.</p>
        </div>
        {isWriter && (
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 shadow-md"
          >
            <Plus size={14} /> Register Supplier
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center py-10 text-slate-400">Loading suppliers...</div>
        ) : (
          suppliers.map(s => (
            <div
              key={s.id}
              onClick={() => handleSupplierClick(s)}
              className={`p-5 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200 ${
                activeSup?.id === s.id 
                  ? 'border-brand-500 ring-2 ring-brand-500/10' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 truncate" title={s.name}>{s.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                    s.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {s.status}
                  </span>
                  {isWriter && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation() // Prevent opening the performance metrics on click
                        handleDeleteSupplier(s.id)
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 hover:bg-rose-500/10 rounded transition-all"
                      title="Delete Supplier"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-2">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold">{s.rating.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400">Rating Score</span>
              </div>

              <div className="space-y-1.5 mt-5 text-[10px] font-semibold text-slate-400">
                <div className="flex justify-between">
                  <span>TERMS:</span>
                  <span className="text-slate-700 dark:text-slate-300">{s.payment_terms}</span>
                </div>
                <div className="flex justify-between">
                  <span>EST. LEAD TIME:</span>
                  <span className="text-slate-700 dark:text-slate-300">{s.delivery_time} Days</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier Performance Metrics details */}
      {activeSup && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-base">Performance Analytics: {activeSup.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistical details regarding delivery lead times, reliability, and invoice histories.</p>
            </div>
            <button onClick={() => setActiveSup(null)} className="text-xs text-slate-400 hover:text-slate-200 font-bold">
              Close Analytics
            </button>
          </div>

          {loadingPerf ? (
            <div className="py-10 text-center text-slate-400 text-xs">Loading performance dashboard...</div>
          ) : !perfData ? (
            <div className="py-10 text-center text-slate-400 text-xs">No transaction records found for this supplier yet.</div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Lead Time</span>
                  <p className="text-xl font-bold">{perfData.average_delivery_time} days</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Late Deliveries</span>
                  <p className={`text-xl font-bold ${perfData.late_deliveries > 0 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {perfData.late_deliveries} orders
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total PO Value</span>
                  <p className="text-xl font-bold text-emerald-500">{perfData.delivered_orders} delivered</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Compliance Grade</span>
                  <p className="text-xl font-bold text-brand-500">A+</p>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Recent Purchase Orders</h4>
                {perfData.purchase_history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No purchase orders seeded for this supplier yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/30 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                          <th className="px-4 py-2">PO Number</th>
                          <th className="px-4 py-2">Order Date</th>
                          <th className="px-4 py-2">Grand Total</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {perfData.purchase_history.map(po => (
                          <tr key={po.id}>
                            <td className="px-4 py-2.5 font-mono text-slate-400">{po.order_number}</td>
                            <td className="px-4 py-2.5">{new Date(po.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-2.5 font-bold">${po.grand_total.toFixed(2)}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider">{po.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Supplier Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">Register Supplier</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Supplier Company Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">GST/VAT Number</label>
                  <input type="text" required value={gst} onChange={(e) => setGst(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Payment Terms</label>
                  <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Lead Time (Days)</label>
                  <input type="number" required value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Rating Score</label>
                  <input type="number" step="0.1" max="5" min="1" required value={rating} onChange={(e) => setRating(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Billing/Shipping Address</label>
                <textarea rows="2" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
