'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
  const [ediciones, setEdiciones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEdiciones = async () => {
    setLoading(false) // El layout ya validó al admin, mostramos la carga de datos
    const { data } = await supabase
      .from('ediciones')
      .select('*')
      .order('anio', { ascending: false })
    setEdiciones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchEdiciones() }, [])

  const toggleVotacion = async (id, estadoActual) => {
    await supabase.from('ediciones').update({ votacion_abierta: !estadoActual }).eq('id_edicion', id)
    fetchEdiciones()
  }

  return (
    <main className="container mt-5 font-sans text-white">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-4 text-white">Panel de Control 🎛️</h1>
        
        <div className="d-flex flex-wrap justify-content-center gap-2 bg-dark p-3 rounded shadow-sm border border-secondary">
          <Link href="/admin/categorias" className="btn btn-outline-primary fw-bold">Categorías</Link>
          <Link href="/admin/usuarios" className="btn btn-outline-info fw-bold">Usuarios</Link>
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
                  <h3 className="card-title fw-bold text-white">{edicion.tipo} {edicion.anio}</h3>
                  <p className="mb-3">
                    {edicion.votacion_abierta ? <span className="badge bg-success">ABIERTA 🟢</span> : <span className="badge bg-secondary">CERRADA 🔴</span>}
                  </p>
                </div>
                <div className="d-grid gap-2">
                  <button onClick={() => toggleVotacion(edicion.id_edicion, edicion.votacion_abierta)} className={`btn fw-bold ${edicion.votacion_abierta ? 'btn-outline-danger' : 'btn-success'}`}>
                    {edicion.votacion_abierta ? 'Bloquear Votación 🔒' : 'Habilitar Votación 🔓'}
                  </button>
                  <Link href={`/admin/ediciones/${edicion.id_edicion}`} className="btn btn-dark border-secondary fw-bold">Categorías a evaluar 📋</Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}