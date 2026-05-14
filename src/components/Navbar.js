'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Verificamos si hay usuario en localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
  }, [pathname]) // Re-verificar cada vez que cambia la ruta

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  // No mostrar controles si estamos en el login (landing) o no hay usuario
  const mostrarControles = pathname !== '/' && user

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top border-bottom border-secondary shadow-lg" 
         style={{ 
           background: 'rgba(15, 15, 15, 0.8)', 
           backdropFilter: 'blur(10px)',
           zIndex: 1000 
         }}>
      <div className="container py-1">
        <a className="navbar-brand fw-bold d-flex align-items-center" href={user ? "/dashboard" : "/"} style={{ letterSpacing: '1px' }}>
          EUROVISION <span className="text-primary ms-1">contest</span>
        </a>

        {mostrarControles && (
          <div className="d-flex align-items-center">
            <a href="/dashboard" className="nav-link text-white me-4 small fw-bold d-none d-sm-block text-uppercase opacity-75 hover-opacity-100">
              Lobby
            </a>
            
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm fw-bold px-3 rounded-pill"
              style={{ fontSize: '0.75rem' }}
            >
              SALIR
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .navbar-brand:hover { color: #0d6efd !important; transition: 0.3s; }
        .hover-opacity-100:hover { opacity: 1 !important; transition: 0.3s; }
        .btn-outline-danger:hover { box-shadow: 0 0 15px rgba(220, 53, 69, 0.4); }
      `}</style>
    </nav>
  )
}