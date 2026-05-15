'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

function ABMVotosContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  const router = useRouter()

  const [votos, setVotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroUsuario, setFiltroUsuario] = useState('')

  useEffect(() => {
    if (edicionId) fetchVotos()
  }, [edicionId])

  const fetchVotos = async () => {
    setLoading(true)
    // Traemos las líneas de votación, el nombre del usuario, el país y los detalles
    const { data, error } = await supabase
      .from('lineas_votacion')
      .select(`
        id_linea,
        id_usuario,
        usuarios ( nombre ),
        participaciones ( 
          paises ( nombre )
        ),
        detalles_voto ( puntaje )
      `)
      .filter('participaciones.id_edicion', 'eq', edicionId)

    if (!error) {
      // Limpiamos la data para que sea más fácil de iterar
      const votosProcesados = data.filter(v => v.participaciones).map(v => ({
        id: v.id_linea,
        usuario: v.usuarios?.nombre || 'Anónimo',
        pais: v.participaciones.paises?.nombre || 'Desconocido',
        totalPuntos: v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0),
        promedio: (v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0) / v.detalles_voto.length).toFixed(2)
      }))
      setVotos(votosProcesados)
    }
    setLoading(false)
  }

  const eliminarVoto = async (id) => {
    if (confirm('¿Estás seguro de eliminar este voto por completo? Esta acción no se puede deshacer.')) {
      // Al borrar la línea, por cascada (si está configurado en Supabase) se borran los detalles.
      // Si no, borramos detalles primero:
      await supabase.from('detalles_voto').delete().eq('id_linea', id)
      await supabase.from('lineas_votacion').delete().eq('id_linea', id)
      fetchVotos()
    }
  }

  const votosFiltrados = votos.filter(v => 
    v.usuario.toLowerCase().includes(filtroUsuario.toLowerCase()) || 
    v.pais.toLowerCase().includes(filtroUsuario.toLowerCase())
  )

  if (loading) return <div className="text-center mt-5 text-white opacity-50">Cargando votos...</div>

  return (
    <main className="container mt-5 text-white font-sans">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-info text-uppercase">ABM de Votos - Edición {edicionId}</h2>
        <button onClick={() => router.back()} className="btn btn-outline-light btn-sm">Volver</button>
      </div>

      <div className="card bg-dark border-secondary p-3 mb-4">
        <input 
          type="text" 
          placeholder="Filtrar por usuario o país..." 
          className="form-control bg-black text-white border-secondary"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
        />
      </div>

      <div className="table-responsive shadow-lg rounded border border-secondary">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead className="table-secondary text-dark text-uppercase small fw-bold">
            <tr>
              <th>Usuario</th>
              <th>País Votado</th>
              <th className="text-center">Suma Total</th>
              <th className="text-center">Promedio</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {votosFiltrados.length > 0 ? votosFiltrados.map(v => (
              <tr key={v.id}>
                <td className="fw-bold text-warning">{v.usuario}</td>
                <td>{v.pais}</td>
                <td className="text-center opacity-75">{v.totalPuntos} pts</td>
                <td className="text-center fw-bold text-info">{v.promedio}</td>
                <td className="text-end">
                  <button 
                    onClick={() => eliminarVoto(v.id)} 
                    className="btn btn-sm btn-outline-danger"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center py-4 opacity-50">No hay votos registrados con esos filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default function VotosPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-5">Cargando...</div>}>
      <ABMVotosContenido />
    </Suspense>
  )
}