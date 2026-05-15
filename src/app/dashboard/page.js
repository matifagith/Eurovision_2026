'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ediciones, setEdiciones] = useState([])
  const [años, setAños] = useState([])
  // 1. AGREGAMOS EL ESTADO DE CARGA (Por defecto en true)
  const [cargando, setCargando] = useState(true) 
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)

    const fetchEdiciones = async () => {
      // Nos aseguramos de que el spinner esté activo al empezar
      setCargando(true) 
      
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
      } else {
        console.error("Error cargando galas:", error)
      }
      
      // 2. APAGAMOS EL SPINNER CUANDO LLEGAN LOS DATOS
      setCargando(false) 
    }
    
    fetchEdiciones()
  }, [router])

  return (
    <main className="container mt-5 pb-5 font-sans text-white">
      {/* SECCIÓN DE BIENVENIDA (Esta carga casi instantáneo porque lee del localStorage) */}
      <div className="card border-0 shadow-lg overflow-hidden mb-5" 
           style={{ background: '#0d6efd', borderRadius: '20px' }}>
        <div className="card-body p-5 text-white text-start">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-2 text-white">¡Hola, {user?.nombre}! 👋</h1>
              <p className="lead mb-0 text-white opacity-90">Bienvenido al sistema oficial de votación.</p>
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

      {/* 3. CONDICIONAL DE RENDERIZADO: Si está cargando, mostramos el spinner */}
      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando galas...</span>
          </div>
          <p className="text-muted fw-bold tracking-widest">Sincronizando con Supabase Auth...</p>
        </div>
      ) : años.length === 0 ? (
        // Mensaje por si no hay galas en la base de datos
        <div className="text-center py-5 text-muted">
          <h4>Aún no hay galas disponibles.</h4>
        </div>
      ) : (
        // 4. SI YA CARGÓ, MOSTRAMOS LAS TARJETAS
        años.map(anio => (
          <section key={anio} className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-primary px-3 py-2 rounded-pill me-2 shadow-sm">Año {anio}</span>
            </div>
            
            <div className="row g-4">
              {ediciones.filter(e => e.anio === anio).map(ed => {
                const estaLista = ed.edicion_lista;
                const abierta = ed.votacion_abierta;

                return (
                  <div key={ed.id_edicion} className="col-md-4">
                    {/* TU CÓDIGO DE LA TARJETA (Queda exactamente igual) */}
                    <div 
                      onClick={() => estaLista && router.push(`/vote?edicionId=${ed.id_edicion}`)}
                      className={`card bg-dark border-secondary h-100 shadow-sm position-relative overflow-hidden ${estaLista ? 'btn-hover-effect' : 'opacity-50'}`}
                      style={{ cursor: estaLista ? 'pointer' : 'default', borderRadius: '15px', transition: 'all 0.3s ease' }}
                    >
                      <div className="card-body p-4 text-center">
                        <div className="mb-3">
                          {ed.tipo.toLowerCase().includes('final') ? (
                            <span style={{ fontSize: '2.5rem' }}>🏆</span>
                          ) : (
                            <span style={{ fontSize: '2.5rem' }}>✨</span>
                          )}
                        </div>
                        
                        <h4 className={`fw-bold mb-1 ${estaLista ? 'text-warning' : 'text-secondary opacity-75'}`}>
                          {ed.tipo}
                        </h4>
                        <p className="text-muted small text-uppercase mb-3" style={{ letterSpacing: '1px' }}>{anio}</p>
                        
                        <div className="d-grid gap-2">
                          {!estaLista ? (
                            <div className="btn btn-outline-secondary disabled fw-bold opacity-50" style={{ border: '1px solid #444' }}>
                              COMING SOON ⏳
                            </div>
                          ) : abierta ? (
                            <button className="btn btn-primary fw-bold shadow-sm">VOTAR AHORA →</button>
                          ) : (
                            <>
                              <button className="btn btn-outline-light fw-bold opacity-75">VER MI VOTACIÓN 📊</button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  const esSemi = ed.tipo.toLowerCase().includes('semi');
                                  const ruta = esSemi ? 'semifinal' : 'final';
                                  router.push(`/estadisticas/${ruta}?edicionId=${ed.id_edicion}`);
                                }}
                                className="btn btn-info fw-bold text-white shadow-sm mt-1"
                              >
                                ESTADÍSTICA GLOBAL 📈
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {estaLista && (
                        <div className="position-absolute top-0 end-0 p-3">
                          <span className={`badge rounded-pill ${abierta ? 'bg-success shadow-sm' : 'bg-danger opacity-75'}`} 
                                style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>
                            {abierta ? 'LIVE' : 'CLOSED'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

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