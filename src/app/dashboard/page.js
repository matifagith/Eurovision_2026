'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ediciones, setEdiciones] = useState([])
  const [años, setAños] = useState([])
  const [añoAbierto, setAñoAbierto] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)

    const fetchEdiciones = async () => {
      const { data } = await supabase.from('ediciones').select('*').order('anio', { ascending: false })
      setEdiciones(data || [])
      // Extraemos años únicos
      const years = [...new Set((data || []).map(e => e.anio))]
      setAños(years)
    }
    fetchEdiciones()
  }, [])

  const toggleAño = (anio) => {
    setAñoAbierto(añoAbierto === anio ? null : anio)
  }

  return (
    <main className="container mt-5">
      <div className="card bg-dark text-white p-4 mb-5 border-primary shadow">
        <h2 className="h4">Bienvenido, <span className="text-primary">{user?.nombre}</span></h2>
        <p className="text-muted mb-0">Seleccioná un año para ver las ediciones y empezar a votar.</p>
      </div>

      <h3 className="mb-4">Historial de Ediciones</h3>
      <div className="list-group shadow-sm">
        {años.map(anio => (
          <div key={anio} className="mb-2">
            <button 
              onClick={() => toggleAño(anio)}
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center fw-bold bg-light"
            >
              📅 Año {anio}
              <span>{añoAbierto === anio ? '▲' : '▼'}</span>
            </button>
            
            {añoAbierto === anio && (
              <div className="bg-white border-start border-end">
                {ediciones.filter(e => e.anio === anio).map(ed => (
                  <button
                    key={ed.id_edicion}
                    onClick={() => router.push(`/vote?edicionId=${ed.id_edicion}`)}
                    className="list-group-item list-group-item-action border-0 ps-5 py-3 d-flex justify-content-between align-items-center"
                  >
                    <span>{ed.tipo}</span>
                    <span className="badge bg-primary rounded-pill">Votar →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}