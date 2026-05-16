'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
  const [ediciones, setEdiciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [haySolicitudes, setHaySolicitudes] = useState(false) // Estado indicador de alertas

  const fetchDatosPanel = async () => {
    // 1. Cargar ediciones históricas
    const { data } = await supabase
      .from('ediciones')
      .select('*')
      .order('anio', { ascending: false })
    setEdiciones(data || [])
    
    // 2. Revisar silenciosamente si existen solicitudes pendientes
    const { count } = await supabase
      .from('solicitudes_cambio')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente')
      
    setHaySolicitudes(count > 0)
    setLoading(false)
  }

  useEffect(() => { fetchDatosPanel() }, [])

  const toggleVotacion = async (id, estadoActual) => {
    await supabase.from('ediciones').update({ votacion_abierta: !estadoActual }).eq('id_edicion', id)
    fetchDatosPanel()
  }

  const toggleEdicionLista = async (id, estadoActual) => {
    await supabase.from('ediciones').update({ edicion_lista: !estadoActual }).eq('id_edicion', id)
    fetchDatosPanel()
  }

  return (
    <main className="container mt-5 font-sans text-white">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-4 text-white">Panel de Control 🎛️</h1>
        
        <div className="d-flex flex-wrap justify-content-center gap-2 bg-dark p-3 rounded shadow-sm border border-secondary">
          <Link href="/admin/categorias" className="btn btn-outline-primary fw-bold">Categorías</Link>
          
          {/* BOTÓN USUARIOS: Vuelve a su estado original limpio */}
          <Link href="/admin/usuarios" className="btn btn-outline-info fw-bold">Usuarios</Link>
          
          {/* NUEVO BOTÓN FIJO: Solicitudes (Se ilumina y parpadea solo si hay pendientes) */}
          <Link 
            href="/admin/solicitudes" 
            className={`btn fw-bold position-relative ${haySolicitudes ? 'btn-warning text-dark shadow-glow' : 'btn-outline-warning'}`}
          >
            Solicitudes {haySolicitudes ? '⚠️' : ''}
            {haySolicitudes && (
              <span className="position-absolute top-0 start-100 translate-middle p-2 bg-danger border border-light rounded-circle animation-pulse">
                <span className="visually-hidden">Alertas</span>
              </span>
            )}
          </Link>

          <Link href="/admin/artistas" className="btn btn-outline-warning fw-bold">Artistas</Link>
          <Link href="/admin/canciones" className="btn btn-outline-light fw-bold">Canciones</Link>
          <Link href="/admin/paises" className="btn btn-outline-danger fw-bold">Países</Link>
          <Link href="/admin/ediciones_config" className="btn btn-outline-success fw-bold">Edición</Link>
          <Link href="/admin/participaciones" className="btn btn-primary fw-bold text-white shadow">Participaciones</Link>
        </div>
      </div>

      <div className="row">
        {ediciones.map((edicion) => (
          <div key={edicion.id_edicion} className="col-md-4 mb-4">
            <div className={`card bg-dark text-white shadow-sm h-100 ${edicion.votacion_abierta ? 'border-success' : 'border-secondary'}`}>
              <div className="card-body text-center d-flex flex-column justify-content-between">
                <div>
                  <h3 className="card-title fw-bold text-white mb-1">{edicion.tipo} {edicion.anio}</h3>
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    {edicion.votacion_abierta ? 
                      <span className="badge bg-success">VOTOS ABIERTOS 🟢</span> : 
                      <span className="badge bg-danger">VOTOS CERRADOS 🔴</span>
                    }
                    {edicion.edicion_lista ? 
                      <span className="badge bg-primary">PUBLICADA 🌍</span> : 
                      <span className="badge bg-warning text-dark">BORRADOR 🚧</span>
                    }
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    onClick={() => toggleEdicionLista(edicion.id_edicion, edicion.edicion_lista)} 
                    className={`btn fw-bold ${edicion.edicion_lista ? 'btn-outline-warning' : 'btn-primary'}`}
                  >
                    {edicion.edicion_lista ? 'Ocultar (Coming Soon) 🔒' : 'Habilitar Edición 🔓'}
                  </button>

                  <button 
                    onClick={() => toggleVotacion(edicion.id_edicion, edicion.votacion_abierta)} 
                    className={`btn fw-bold ${edicion.votacion_abierta ? 'btn-outline-danger' : 'btn-success'}`}
                  >
                    {edicion.votacion_abierta ? 'Cerrar Votación ⛔' : 'Habilitar Votación 🔓'}
                  </button>

                  <Link href={`/admin/ediciones/${edicion.id_edicion}`} className="btn btn-dark border-secondary fw-bold">
                    Categorías a evaluar 📋
                  </Link>

                  <Link 
                    href={`/admin/votos?edicionId=${edicion.id_edicion}`} 
                    className="btn btn-outline-info fw-bold shadow-sm"
                  >
                    Ver Votos 🗳️
                  </Link>   
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .shadow-glow {
          box-shadow: 0 0 15px rgba(255, 193, 7, 0.5) !important;
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.8; }
        }
        .animation-pulse {
          animation: pulse 1.8s infinite ease-in-out;
        }
      `}</style>
    </main>
  )
}