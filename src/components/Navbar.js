'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [menuAbierto, setMenuAbierto] = useState(false) // Nuevo estado para el menú móvil
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    setUser(storedUser)
  }, [pathname]) 

  const handleLogout = () => {
    localStorage.removeItem('user')
    setMenuAbierto(false)
    router.push('/')
  }

  const cerrarMenu = () => setMenuAbierto(false)

  const mostrarControles = pathname !== '/' && user

  return (
    <>
      <nav className="navbar sticky-top border-bottom border-secondary shadow-lg custom-navbar" 
           style={{ zIndex: 1000 }}>
        <div className="container py-2 d-flex justify-content-between align-items-center">
          
          {/* LOGO CON HOVER */}
          <Link href={user ? "/dashboard" : "/"} className="navbar-brand fw-bold d-flex align-items-center brand-hover text-white m-0">
            EUROVISION <span className="text-primary ms-1">contest</span>
          </Link>

          {mostrarControles && (
            <>
              {/* --- MENÚ DE ESCRITORIO (Oculto en celulares) --- */}
              <div className="d-none d-md-flex align-items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className={`btn btn-sm fw-bold text-white px-4 py-2 rounded-pill d-inline-flex align-items-center btn-custom-nav ${pathname === '/dashboard' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                >
                  LOBBY
                </Link>
                
                <Link 
                  href="/perfil" 
                  className={`btn btn-sm fw-bold text-white px-4 py-2 rounded-pill d-inline-flex align-items-center gap-2 btn-custom-nav ${pathname === '/perfil' ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                >
                  MI PERFIL
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm fw-bold px-4 py-2 rounded-pill btn-logout"
                  style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
                >
                  SALIR
                </button>
              </div>

              {/* --- BOTÓN HAMBURGUESA PARA CELULARES (Oculto en escritorio) --- */}
              <button 
                className="btn d-md-none text-white shadow-none border-0 p-0" 
                onClick={() => setMenuAbierto(true)}
                style={{ fontSize: '1.8rem' }}
              >
                ☰
              </button>
            </>
          )}
        </div>
      </nav>

      {/* --- SIDEBAR MÓVIL Y FONDO OSCURO --- */}
      {mostrarControles && (
        <>
          {/* Fondo oscuro con blur al abrir el menú */}
          <div 
            className={`sidebar-overlay ${menuAbierto ? 'open' : ''}`} 
            onClick={cerrarMenu}
          ></div>

          {/* Panel Lateral */}
          <div className={`custom-sidebar bg-dark border-start border-secondary shadow-lg d-flex flex-column ${menuAbierto ? 'open' : ''}`}>
            
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-secondary">
              <h5 className="fw-bold text-white m-0 text-uppercase" style={{ letterSpacing: '2px' }}>Menú</h5>
              <button className="btn btn-link text-white shadow-none p-0 fs-4 text-decoration-none" onClick={cerrarMenu}>
                ✕
              </button>
            </div>
            
            <div className="d-flex flex-column p-4 gap-3 flex-grow-1">
              <Link 
                href="/dashboard" 
                onClick={cerrarMenu}
                className={`btn fw-bold text-white py-3 rounded-pill btn-custom-nav ${pathname === '/dashboard' ? 'active' : ''}`}
                style={{ letterSpacing: '1px' }}
              >
                LOBBY
              </Link>
              
              <Link 
                href="/perfil" 
                onClick={cerrarMenu}
                className={`btn fw-bold text-white py-3 rounded-pill d-flex justify-content-center align-items-center gap-2 btn-custom-nav ${pathname === '/perfil' ? 'active' : ''}`}
                style={{ letterSpacing: '1px' }}
              >
                MI PERFIL
              </Link>
              
              <div className="mt-auto pt-4 border-top border-secondary">
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline-danger fw-bold py-3 rounded-pill btn-logout w-100"
                  style={{ letterSpacing: '1px' }}
                >
                  SALIR
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ESTILOS CSS */}
      <style jsx>{`
        .custom-navbar {
          background: rgba(18, 18, 20, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }

        .brand-hover {
          letter-spacing: 1px;
          transition: transform 0.3s ease, text-shadow 0.3s ease;
          text-decoration: none;
        }
        .brand-hover:hover {
          transform: scale(1.02);
          text-shadow: 0 0 15px rgba(13, 110, 253, 0.4);
        }

        .btn-custom-nav {
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          background: transparent !important;
          color: white !important;
        }

        .btn-custom-nav:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-color: rgba(255, 255, 255, 0.8) !important;
          transform: translateY(-2px);
        }

        .btn-custom-nav.active {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
          color: white !important;
          box-shadow: 0 0 15px rgba(13, 110, 253, 0.4);
        }

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

        /* --- ESTILOS DEL SIDEBAR --- */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1040;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .sidebar-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .custom-sidebar {
          position: fixed;
          top: 0;
          right: -300px;
          width: 280px;
          height: 100vh;
          z-index: 1050;
          transition: right 0.4s cubic-bezier(0.77, 0, 0.175, 1);
        }
        .custom-sidebar.open {
          right: 0;
        }
      `}</style>
    </>
  )
}