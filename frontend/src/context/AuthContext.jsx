import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Helper for default Axios API URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [role, setRole] = useState(localStorage.getItem('role') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Mock validation/fetch user details
      setUser({ username: localStorage.getItem('username') || 'User', role })
    } else {
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
    setLoading(false)
  }, [token, role])

  const login = async (username, password) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    
    const response = await axios.post('/api/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    const { access_token, role: userRole } = response.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('role', userRole)
    localStorage.setItem('username', username)
    setToken(access_token)
    setRole(userRole)
    setUser({ username, role: userRole })
    return { role: userRole }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    setToken(null)
    setRole(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
