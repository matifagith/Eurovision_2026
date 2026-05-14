'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ediciones, setEdiciones] = useState([])
  const [años, setAños] = useState([])
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)

    const fetchEdiciones = async () => {
      // Traemos las ediciones y verificamos si existen votos (líneas de votación)
      const { data, error } = await supabase
        .from('ediciones')
        .select(`
          *,
          participaciones ( id_participacion )
        `)
        .order('anio', { ascending: false })

      if (!error) {
        setEdiciones(data || [])
        const years = [...new Set((data || []).map(e => e.anio))]
        setAños(years)
      }
    }
    fetchEdiciones()
  }, [router])

  return (
    <main className="container mt-5 pb-5 font-sans text-white">
      {/* SECCIÓN DE BIENVENIDA */}
      <div className="card border-0 shadow-lg overflow-hidden mb-5" 
           style={{ background: '#0d6efd', borderRadius: '20px' }}>
        <div className="card-body p-5 text-white text-start">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-2 text-white">¡Hola, {user?.nombre}! 👋</h1>
              <p className="lead mb-0 text-white opacity-90">Bienvenido al sistema oficial de votación. Elegí una gala para interactuar o ver resultados.</p>
            </div>
            <div className="col-md-4 text-center d-none d-md-block text-white">
              <span style={{ fontSize: '5rem' }}>🎙️</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center mb-4">
        <h2 className="fw-bold me-3 text-uppercase small tracking-widest opacity-75">Historial de Galas</h2>
        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
      </div>

      {años.map(anio => (
        <section key={anio} className="mb-5">
          <div className="d-flex align-items-center mb-3">
            <span className="badge bg-primary px-3 py-2 rounded-pill me-2 shadow-sm">Año {anio}</span>
          </div>
          
          <div className="row g-4">
            {ediciones.filter(e => e.anio === anio).map(ed => {
              // LÓGICA DE ACCESO: 
              // Permitimos entrar si la votación está abierta O si es de un año anterior al actual (2026)
              const anioActual = 2026; 
              const esPasada = ed.anio < anioActual || (ed.anio === anioActual && !ed.votacion_abierta);
              const habilitada = ed.votacion_abierta || esPasada;

              return (
                <div key={ed.id_edicion} className="col-md-4">
                  <div 
                    onClick={() => habilitada && router.push(`/vote?edicionId=${ed.id_edicion}`)}
                    className={`card bg-dark border-secondary h-100 shadow-sm position-relative overflow-hidden ${habilitada ? 'btn-hover-effect' : 'opacity-50'}`}
                    style={{ 
                      cursor: habilitada ? 'pointer' : 'default', 
                      borderRadius: '15px', 
                      transition: 'all 0.3s ease' 
                    }}
                  >
                    <div className="card-body p-4 text-center">
                      <div className="mb-3">
                        {ed.tipo.toLowerCase().includes('final') ? (
                          <span style={{ fontSize: '2.5rem' }}>🏆</span>
                        ) : (
                          <span style={{ fontSize: '2.5rem' }}>✨</span>
                        )}
                      </div>
                      
                      <h4 className={`fw-bold mb-1 ${habilitada ? 'text-warning' : 'text-secondary opacity-75'}`}>
                        {ed.tipo}
                      </h4>
                      <p className="text-muted small text-uppercase mb-3" style={{ letterSpacing: '1px' }}>{anio}</p>
                      
                      <div className="d-grid">
                        {ed.votacion_abierta ? (
                          <button className="btn btn-primary fw-bold shadow-sm">VOTAR AHORA →</button>
                        ) : esPasada ? (
                          <button className="btn btn-outline-light fw-bold opacity-75">VER MI VOTACIÓN 📊</button>
                        ) : (
                          <div className="btn btn-outline-secondary disabled fw-bold opacity-50" style={{ border: '1px solid #444' }}>
                            COMING SOON ⏳
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="position-absolute top-0 end-0 p-3">
                      <span className={`badge rounded-pill ${ed.votacion_abierta ? 'bg-success' : 'bg-danger opacity-75'}`} 
                            style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>
                        {ed.votacion_abierta ? 'LIVE' : 'CLOSED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <style jsx>{`
        .btn-hover-effect:hover {
          transform: translateY(-10px);
          border-color: #0d6efd !important;
          box-shadow: 0 10px 30px rgba(13, 110, 253, 0.3) !important;
        }
      `}</style>
    </main>
  )
}