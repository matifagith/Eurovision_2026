'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
  }, [pathname]) 

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const mostrarControles = pathname !== '/' && user

  return (
    <nav className="navbar navbar-expand-lg sticky-top border-bottom border-secondary shadow-lg custom-navbar" 
         style={{ zIndex: 1000 }}>
      <div className="container py-2">
        
        {/* LOGO CON HOVER */}
        <Link href={user ? "/dashboard" : "/"} className="navbar-brand fw-bold d-flex align-items-center brand-hover text-white">
          EUROVISION <span className="text-primary ms-1">contest</span>
        </Link>

        {mostrarControles && (
          <div className="d-flex align-items-center gap-3">
            
            {/* BOTÓN: LOBBY */}
            <Link 
              href="/dashboard" 
              className={`btn btn-sm fw-bold text-white px-4 py-2 rounded-pill d-none d-sm-inline-flex align-items-center btn-custom-nav ${pathname === '/dashboard' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
            >
              LOBBY
            </Link>
            
            {/* BOTÓN: MI PERFIL */}
            <Link 
              href="/perfil" 
              className={`btn btn-sm fw-bold text-white px-4 py-2 rounded-pill d-none d-sm-inline-flex align-items-center gap-2 btn-custom-nav ${pathname === '/perfil' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
            >MI PERFIL</Link>
            
            {/* BOTÓN: SALIR */}
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm fw-bold px-4 py-2 rounded-pill btn-logout"
              style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
            >
              SALIR
            </button>
            
          </div>
        )}
      </div>
      
      {/* ESTILOS CSS CON ANIMACIONES */}
      <style jsx>{`
        .custom-navbar {
          background: rgba(18, 18, 20, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }

        /* Animación del Logo */
        .brand-hover {
          letter-spacing: 1px;
          transition: transform 0.3s ease, text-shadow 0.3s ease;
          text-decoration: none;
        }
        .brand-hover:hover {
          transform: scale(1.02);
          text-shadow: 0 0 15px rgba(13, 110, 253, 0.4);
        }

        /* Botones de Navegación (Lobby y Perfil) */
        .btn-custom-nav {
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.3) !important; /* Borde sutil blanco por defecto */
          background: transparent !important;
          color: white !important;
        }

        .btn-custom-nav:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-2px);
        }

        /* Estado Activo (Página en la que estás) */
        .btn-custom-nav.active {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
          color: white !important;
          box-shadow: 0 0 15px rgba(13, 110, 253, 0.4);
        }

        /* Botón de Salida */
        .btn-logout {
          transition: all 0.3s ease;
          border-width: 1px !important;
        }

        .btn-logout:hover {
          background-color: #dc3545 !important;
          color: white !important;
          box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
          transform: translateY(-2px);
        }
      `}</style>
    </nav>
  )
}