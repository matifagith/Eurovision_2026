'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PerfilUsuario() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)
  }, [router])

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando perfil...</span>
        </div>
      </div>
    )
  }

  // Extraemos la primera letra del nombre para el Avatar
  const inicial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '👤'

  return (
    <main className="container mt-5 pb-5 font-sans text-white" style={{ maxWidth: '800px' }}>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-uppercase small opacity-50 m-0" style={{ letterSpacing: '3px' }}>
          Configuración de Cuenta
        </h2>
        <Link href="/dashboard" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
          ← Volver al Lobby
        </Link>
      </div>

      {/* TARJETA PRINCIPAL DEL PERFIL */}
      <div className="card bg-dark border-secondary shadow-lg overflow-hidden" style={{ borderRadius: '24px' }}>
        
        {/* Cabecera con degradado */}
        <div className="position-relative" style={{ height: '120px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
          {/* Avatar superpuesto */}
          <div className="position-absolute shadow-lg d-flex align-items-center justify-content-center fw-bold" 
               style={{ 
                 width: '100px', 
                 height: '100px', 
                 background: '#1a1a1a', 
                 color: '#fff',
                 border: '4px solid #212529',
                 borderRadius: '50%',
                 bottom: '-50px',
                 left: '40px',
                 fontSize: '2.5rem'
               }}>
            {inicial}
          </div>
        </div>

        {/* Cuerpo del perfil */}
        <div className="card-body pt-5 px-sm-5 pb-5 position-relative mt-3">
          
          {/* Insignia de Rol (A la derecha) */}
          <div className="position-absolute top-0 end-0 mt-4 me-sm-5 me-3">
             <span className={`badge rounded-pill px-3 py-2 shadow-sm ${user.es_admin ? 'bg-warning text-dark' : 'bg-primary'}`} style={{ letterSpacing: '1px' }}>
               {user.es_admin ? '⭐ ADMINISTRADOR' : '🎙️ JUEZ OFICIAL'}
             </span>
          </div>

          <h3 className="fw-bold mb-1 text-white">{user.nombre}</h3>
          <p className="text-muted mb-5">Miembro del jurado activo</p>

          <h5 className="fw-bold text-white mb-4 border-bottom border-secondary pb-2 opacity-75">
            Detalles de Contacto
          </h5>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>
                  Nombre de Usuario
                </label>
                <div className="fs-5 text-light">{user.nombre}</div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>
                  Correo Electrónico
                </label>
                <div className="fs-5 text-light" style={{ wordBreak: 'break-all' }}>
                  {user.email || <span className="text-muted fst-italic">No especificado</span>}
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>
                  ID de Sistema (Auth)
                </label>
                <div className="text-muted font-monospace small">
                  {user.id_auth}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}