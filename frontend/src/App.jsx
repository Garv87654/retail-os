import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

// Pages
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Inventory from './pages/Inventory'
import Warehouses from './pages/Warehouses'
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import SalesOrders from './pages/SalesOrders'
import Reports from './pages/Reports'
import AIChat from './pages/AIChat'
import AuditLogs from './pages/AuditLogs'

// Secure Protected Layout wrapper
const Layout = ({ children }) => {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

// Role Guard Router helper
const RoleGuard = ({ allowedRoles, children }) => {
  const { role } = useAuth()
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
      <Route path="/warehouses" element={<Layout><Warehouses /></Layout>} />
      <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
      
      <Route 
        path="/purchase-orders" 
        element={
          <Layout>
            <RoleGuard allowedRoles={['Admin', 'Warehouse Manager', 'Procurement Manager', 'Viewer']}>
              <PurchaseOrders />
            </RoleGuard>
          </Layout>
        } 
      />
      <Route 
        path="/sales-orders" 
        element={
          <Layout>
            <RoleGuard allowedRoles={['Admin', 'Warehouse Manager', 'Warehouse Staff', 'Viewer']}>
              <SalesOrders />
            </RoleGuard>
          </Layout>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <Layout>
            <RoleGuard allowedRoles={['Admin', 'Warehouse Manager', 'Procurement Manager', 'Viewer']}>
              <Reports />
            </RoleGuard>
          </Layout>
        } 
      />
      <Route path="/ai-chat" element={<Layout><AIChat /></Layout>} />
      <Route 
        path="/audit-logs" 
        element={
          <Layout>
            <RoleGuard allowedRoles={['Admin']}>
              <AuditLogs />
            </RoleGuard>
          </Layout>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
