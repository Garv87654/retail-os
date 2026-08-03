import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Sliders, 
  X,
  TrendingUp
} from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

const Inventory = () => {
  const { role } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  
  // Modal / Adjust state
  const [showFormModal, setShowFormModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showForecastModal, setShowForecastModal] = useState(false)
  const [forecastData, setForecastData] = useState(null)
  const [forecastHorizon, setForecastHorizon] = useState('week')
  const [loadingForecast, setLoadingForecast] = useState(false)
  
  // Form fields
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [catId, setCatId] = useState(1)
  const [brand, setBrand] = useState('')
  const [desc, setDesc] = useState('')
  const [buying, setBuying] = useState(0.0)
  const [selling, setSelling] = useState(0.0)
  const [stock, setStock] = useState(0)
  const [minStock, setMinStock] = useState(10)
  const [maxStock, setMaxStock] = useState(100)
  const [supId, setSupId] = useState(1)
  const [barcode, setBarcode] = useState('')
  
  // Adjust stock fields
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [selectedWhId, setSelectedWhId] = useState(1)
  const [warehouses, setWarehouses] = useState([])
  
  // CSV status
  const [csvFile, setCsvFile] = useState(null)
  const [csvStatus, setCsvStatus] = useState('')

  const isWriter = ['Admin', 'Warehouse Manager', 'Procurement Manager'].includes(role)
  const isStaff = isWriter || role === 'Warehouse Staff'

  const loadProducts = () => {
    setLoading(true)
    const params = {
      sort_by: sortBy,
      sort_dir: sortDir
    }
    if (search.trim()) params.search = search.trim()
    if (catFilter) params.category_id = parseInt(catFilter)
    if (statusFilter) params.status_filter = statusFilter

    API.getProducts(params).then(res => {
      setProducts(res.data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }

  useEffect(() => {
    loadProducts()
  }, [search, catFilter, statusFilter, sortBy, sortDir])

  useEffect(() => {
    // Load metadata
    API.getSuppliers().then(res => setSuppliers(res.data))
    API.getWarehouses().then(res => setWarehouses(res.data))
    // We mock categories list for simple select options
    setCategories([
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Office Supplies' },
      { id: 3, name: 'Home & Kitchen' },
      { id: 4, name: 'Apparel' },
      { id: 5, name: 'Sports & Outdoors' }
    ])
  }, [])

  const handleEditClick = (p) => {
    setSelectedProduct(p)
    setSku(p.sku)
    setName(p.name)
    setCatId(p.category_id)
    setBrand(p.brand || '')
    setDesc(p.description || '')
    setBuying(p.buying_price)
    setSelling(p.selling_price)
    setStock(p.current_stock)
    setMinStock(p.minimum_stock)
    setMaxStock(p.maximum_stock)
    setSupId(p.supplier_id)
    setBarcode(p.barcode || '')
    setShowFormModal(true)
  }

  const handleAddClick = () => {
    setSelectedProduct(null)
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)
    setName('')
    setCatId(1)
    setBrand('')
    setDesc('')
    setBuying(10.0)
    setSelling(15.0)
    setStock(50)
    setMinStock(10)
    setMaxStock(100)
    setSupId(1)
    setBarcode(`BAR-${Math.floor(1000000 + Math.random() * 9000000)}`)
    setShowFormModal(true)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      sku, name, category_id: parseInt(catId), brand, description: desc,
      buying_price: parseFloat(buying), selling_price: parseFloat(selling),
      current_stock: parseInt(stock), minimum_stock: parseInt(minStock),
      maximum_stock: parseInt(maxStock), supplier_id: parseInt(supId),
      barcode, status: "In Stock"
    }

    try {
      if (selectedProduct) {
        await API.updateProduct(selectedProduct.id, payload)
      } else {
        await API.createProduct(payload)
      }
      setShowFormModal(false)
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Validation failed.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await API.deleteProduct(id)
      loadProducts()
    }
  }

  const handleAdjustClick = (p) => {
    setSelectedProduct(p)
    setAdjustQty(10)
    setAdjustReason('Regular Stock Audit')
    setSelectedWhId(warehouses[0]?.id || 1)
    setShowAdjustModal(true)
  }

  const handleAdjustSubmit = async (e) => {
    e.preventDefault()
    try {
      await API.adjustStock({
        product_id: selectedProduct.id,
        warehouse_id: parseInt(selectedWhId),
        quantity: parseInt(adjustQty),
        reason: adjustReason
      })
      setShowAdjustModal(false)
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.detail || 'Stock adjustment failed.')
    }
  }

  const handleCsvExport = () => {
    window.open('http://localhost:8000/api/products/export/csv', '_blank')
  }

  const handleCsvUpload = async (e) => {
    e.preventDefault()
    if (!csvFile) return
    const formData = new FormData()
    formData.append('file', csvFile)
    setCsvStatus('Uploading...')
    
    try {
      const res = await API.createProduct(formData) // Uses correct axios multipart
      alert(`Imported successfully!`)
      loadProducts()
    } catch (err) {
      alert('CSV Format Mismatch. Ensure header columns matches SKU, Name, Category, Brand, Buying Price, Selling Price, Current Stock.')
    } finally {
      setCsvStatus('')
      setCsvFile(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inventory Console</h1>
          <p className="text-sm text-slate-400 mt-1">Add, adjust, search, and bulk export products across warehouses.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleCsvExport}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40"
          >
            <Download size={14} /> Export CSV
          </button>
          {isWriter && (
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-500 shadow-md shadow-brand-600/10"
            >
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* CSV Import Panel */}
      {isWriter && (
        <div className="p-4 bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bulk Upload CSV</h4>
            <p className="text-[10px] text-slate-500 mt-1">Import database catalog in one click. Expected headers: SKU, Name, Category, Brand, etc.</p>
          </div>
          <form onSubmit={handleCsvUpload} className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-300 cursor-pointer"
            />
            {csvFile && (
              <button
                type="submit"
                className="px-3 py-1 bg-brand-600 text-white font-bold text-xs rounded-lg hover:bg-brand-500"
              >
                {csvStatus || 'Upload'}
              </button>
            )}
          </form>
        </div>
      )}

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, barcode, name, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-xs focus:border-brand-500 transition-all duration-200"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/10"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/10"
        >
          <option value="">All Stock Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Buying Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Total Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-400">Loading catalog items...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-400">No products found matching filters.</td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-all duration-200">
                    <td className="px-6 py-4 font-mono font-bold text-[11px] text-slate-400">{p.sku}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.brand}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{p.category_name || 'General'}</td>
                    <td className="px-6 py-4 font-semibold">${p.buying_price.toFixed(2)}</td>
                    <td className="px-6 py-4 font-semibold">${p.selling_price.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{p.current_stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        p.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-500' :
                        p.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2.5">
                      {isStaff && (
                        <button
                          onClick={() => handleAdjustClick(p)}
                          className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          title="Adjust Stock"
                        >
                          <Sliders size={14} />
                        </button>
                      )}
                      {isWriter && (
                        <>
                          <button
                            onClick={() => handleEditClick(p)}
                            className="text-slate-400 hover:text-brand-500"
                            title="Edit Product"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-slate-400 hover:text-rose-500"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">{selectedProduct ? 'Edit Catalog Product' : 'Add New Product'}</h3>
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">SKU</label>
                  <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Product Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select value={catId} onChange={(e) => setCatId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Brand</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Barcode</label>
                  <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Buying Price ($)</label>
                  <input type="number" step="0.01" required value={buying} onChange={(e) => setBuying(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Selling Price ($)</label>
                  <input type="number" step="0.01" required value={selling} onChange={(e) => setSelling(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Current Stock</label>
                  <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Threshold</label>
                  <input type="number" required value={minStock} onChange={(e) => setMinStock(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Capacity</label>
                  <input type="number" required value={maxStock} onChange={(e) => setMaxStock(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Supplier</label>
                <select value={supId} onChange={(e) => setSupId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg focus:outline-none" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  {selectedProduct ? 'Update Product Details' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 relative">
            <button onClick={() => setShowAdjustModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1">Adjust Inventory Level</h3>
            <p className="text-xs text-slate-400 mb-4">Select target warehouse and quantity change. Positive values add, negative values deduct.</p>
            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Product</label>
                <input type="text" disabled value={selectedProduct?.name} className="w-full p-2 bg-slate-100 dark:bg-slate-800/60 border dark:border-slate-700 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Warehouse</label>
                  <select value={selectedWhId} onChange={(e) => setSelectedWhId(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Quantity Adjustment (+/-)</label>
                  <input type="number" required value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reason / Notes</label>
                <input type="text" required value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g. Regular Stock Audit, Damaged goods" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-md">
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
