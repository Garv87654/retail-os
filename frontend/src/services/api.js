import axios from 'axios'

const API = {
  // Products
  getProducts: (params) => axios.get('/api/products/', { params }),
  getProduct: (id) => axios.get(`/api/products/${id}`),
  createProduct: (data) => axios.post('/api/products/', data),
  updateProduct: (id, data) => axios.put(`/api/products/${id}`, data),
  deleteProduct: (id) => axios.delete(`/api/products/${id}`),
  adjustStock: (data) => axios.post('/api/products/adjust-stock', data),
  getInventoryHistory: (params) => axios.get('/api/products/history/transactions', { params }),
  
  // Warehouses
  getWarehouses: () => axios.get('/api/warehouses/'),
  getWarehouse: (id) => axios.get(`/api/warehouses/${id}`),
  createWarehouse: (data) => axios.post('/api/warehouses/', data),
  updateWarehouse: (id, data) => axios.put(`/api/warehouses/${id}`, data),
  deleteWarehouse: (id) => axios.delete(`/api/warehouses/${id}`),
  getWarehouseInventory: (id) => axios.get(`/api/warehouses/${id}/inventory`),
  transferStock: (data) => axios.post('/api/warehouses/transfer', data),
  getTransferHistory: () => axios.get('/api/warehouses/transfer/history'),

  // Suppliers
  getSuppliers: () => axios.get('/api/suppliers/'),
  getSupplierPerformance: (id) => axios.get(`/api/suppliers/${id}/performance`),
  createSupplier: (data) => axios.post('/api/suppliers/', data),
  updateSupplier: (id, data) => axios.put(`/api/suppliers/${id}`, data),
  deleteSupplier: (id) => axios.delete(`/api/suppliers/${id}`),

  // POs
  getPurchaseOrders: () => axios.get('/api/purchase-orders/'),
  createPurchaseOrder: (data) => axios.post('/api/purchase-orders/', data),
  updatePurchaseOrderStatus: (id, status) => axios.post(`/api/purchase-orders/${id}/status?new_status=${status}`),
  deletePurchaseOrder: (id) => axios.delete(`/api/purchase-orders/${id}`),

  // Sales
  getSalesOrders: () => axios.get('/api/sales-orders/'),
  createSalesOrder: (data) => axios.post('/api/sales-orders/', data),
  deleteSalesOrder: (id) => axios.delete(`/api/sales-orders/${id}`),

  // Reports
  getReportsSummary: () => axios.get('/api/reports/summary'),

  // Forecast
  getForecast: (data, horizon = 'week') => axios.post(`/api/forecast/?horizon=${horizon}`, data),

  // AI Chat
  sendChatMessage: (message) => axios.post('/api/ai/chat', { message }),

  // Logs
  getAuditLogs: () => axios.get('/api/logs/')
}

export default API
