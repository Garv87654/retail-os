import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Warehouse, Lock, Mail, ArrowRight, User } from 'lucide-react'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleDemoUser = (userType) => {
    if (userType === 'admin') {
      setUsername('admin')
      setPassword('admin123')
    } else if (userType === 'w_manager') {
      setUsername('w_manager')
      setPassword('manager123')
    } else if (userType === 'p_manager') {
      setUsername('p_manager')
      setPassword('procure123')
    } else if (userType === 'staff') {
      setUsername('staff')
      setPassword('staff123')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Incorrect username or password')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = (e) => {
    e.preventDefault()
    setForgotSent(true)
    setTimeout(() => {
      setShowForgot(false)
      setForgotSent(false)
      setForgotEmail('')
    }, 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md p-8 bg-slate-800/40 border border-slate-700/60 rounded-3xl backdrop-blur-md shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-brand-500 p-3 rounded-2xl text-white shadow-lg shadow-brand-500/20 mb-4">
            <Warehouse size={28} />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome to RetailOS</h2>
          <p className="text-sm text-slate-400 mt-2">AI-Powered Retail Supply Chain Platform</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold mb-6">
            {error}
          </div>
        )}

        {!showForgot ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/15 text-sm transition-all duration-200"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/15 text-sm transition-all duration-200"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all duration-200 text-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Logins */}
            <div className="mt-8 pt-6 border-t border-slate-700/60">
              <span className="block text-center text-xs text-slate-500 font-medium mb-3">Quick Demo Login</span>
              <button
                type="button"
                onClick={() => handleDemoUser('admin')}
                className="w-full py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition-all duration-200"
              >
                Auto-fill Admin Credentials
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-5">
            <h3 className="font-bold text-lg text-center">Reset Password</h3>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>
            {forgotSent && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold text-center">
                Instructions sent to email successfully! (Simulated)
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/15 text-sm transition-all duration-200"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-all duration-200 text-sm"
            >
              Send Instructions
            </button>

            <button
              type="button"
              onClick={() => setShowForgot(false)}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 font-semibold mt-4"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
