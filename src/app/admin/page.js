'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
  const [ediciones, setEdiciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEdiciones = async () => {
    setLoading(true)
    const { data } = await supabase.from('ediciones').select('*').order('anio', { ascending: false }).order('id_edicion', { ascending: true })
    setEdiciones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEdiciones() }, [])

  const toggleVotacion = async (id, estadoActual) => {
    await supabase.from('ediciones').update({ votacion_abierta: !estadoActual }).eq('id_edicion', id)
    fetchEdiciones() 
  }

  return (
    <main className="container mt-5 font-sans">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-4">Panel de Control 🎛️</h1>
        
        {/* BOTONERA ABM */}
        <div className="d-flex flex-wrap justify-content-center gap-2 bg-dark p-3 rounded shadow-sm border border-secondary">
          <Link href="/admin/categorias" className="btn btn-outline-primary fw-bold">Categorías</Link>
          <Link href="/admin/usuarios" className="btn btn-outline-info fw-bold">Usuarios</Link>
          <Link href="/admin/artistas" className="btn btn-outline-warning fw-bold">Artistas</Link>
          <Link href="/admin/canciones" className="btn btn-outline-light fw-bold">Canciones</Link>
          <Link href="/admin/paises" className="btn btn-outline-danger fw-bold">Países</Link>
          <Link href="/admin/ediciones_config" className="btn btn-outline-success fw-bold">Edición</Link>
          
          {/* NUEVO BOTÓN PARA PARTICIPACIONES */}
          <Link href="/admin/participaciones" className="btn btn-primary fw-bold text-white">Participaciones</Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="row">
          {ediciones.map((edicion) => (
            <div key={edicion.id_edicion} className="col-md-4 mb-4">
              <div className={`card shadow-sm ${edicion.votacion_abierta ? 'border-success' : 'border-secondary'}`}>
                <div className="card-body text-center">
                  <h3 className="card-title fw-bold">{edicion.tipo} {edicion.anio}</h3>
                  <p className="mb-3">
                    {edicion.votacion_abierta ? <span className="badge bg-success">ABIERTA 🟢</span> : <span className="badge bg-secondary">CERRADA 🔴</span>}
                  </p>
                  <div className="d-grid gap-2">
                    <button onClick={() => toggleVotacion(edicion.id_edicion, edicion.votacion_abierta)} className={`btn fw-bold ${edicion.votacion_abierta ? 'btn-outline-danger' : 'btn-success'}`}>
                      {edicion.votacion_abierta ? 'Bloquear Votación 🔒' : 'Habilitar Votación 🔓'}
                    </button>
                    <Link href={`/admin/ediciones/${edicion.id_edicion}`} className="btn btn-dark fw-bold">Categorías a evaluar 📋</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}