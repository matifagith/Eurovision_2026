'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function EstadisticasPublicasContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const edicionId = searchParams.get('edicionId')
  
  const [datosTabla, setDatosTabla] = useState([])
  const [jueces, setJueces] = useState([])
  const [infoEdicion, setInfoEdicion] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!edicionId) return

    const fetchEstadisticasComparativas = async () => {
      setLoading(true)
      
      // 1. Info de la gala
      const { data: edicion } = await supabase
        .from('ediciones')
        .select('*')
        .eq('id_edicion', edicionId)
        .single()
      setInfoEdicion(edicion)

      // 2. Obtener la lista de jueces (usuarios no admins)
      const { data: listaJueces } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre')
        .eq('es_admin', false)
      setJueces(listaJueces || [])

      // 3. Obtener participaciones con cruce de artistas y países
      const { data: participaciones } = await supabase
        .from('participaciones')
        .select(`
          id_participacion,
          puesto_oficial,
          artistas ( nombre ),
          paises ( nombre, bandera_url )
        `)
        .eq('id_edicion', edicionId)

      // 4. Obtener todos los votos de esta gala
      const { data: todosLosVotos } = await supabase
        .from('votos')
        .select('id_participacion, id_usuario, puntaje')

      if (participaciones && todosLosVotos) {
        const tablaProcesada = participaciones.map(p => {
          const votosDeEstaParticipacion = todosLosVotos.filter(v => v.id_participacion === p.id_participacion)
          
          const fila = {
            id: p.id_participacion,
            pais: p.paises?.nombre || 'Desconocido',
            bandera: p.paises?.bandera_url || '🏳️',
            artista: p.artistas?.nombre || 'S/A',
            puesto_oficial: p.puesto_oficial,
            promediosPorJuez: {}
          }

          listaJueces.forEach(juez => {
            const votosDelJuez = votosDeEstaParticipacion.filter(v => v.id_usuario === juez.id_usuario)
            if (votosDelJuez.length > 0) {
              const suma = votosDelJuez.reduce((acc, curr) => acc + curr.puntaje, 0)
              fila.promediosPorJuez[juez.id_usuario] = (suma / votosDelJuez.length).toFixed(2)
            } else {
              fila.promediosPorJuez[juez.id_usuario] = null
            }
          })

          return fila
        })

        setDatosTabla(tablaProcesada)
      }
      setLoading(false)
    }

    fetchEstadisticasComparativas()
  }, [edicionId])

  if (!edicionId) return <div className="container mt-5 text-center text-white">Falta ID de gala.</div>
  
  if (loading) return (
    <div className="container mt-5 text-center text-white">
      <div className="spinner-border text-warning" role="status"></div>
      <p className="mt-2">Cargando promedios...</p>
    </div>
  )

  return (
    <main className="container-fluid px-4 mt-5 pb-5 text-white font-sans">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">Promedios por Juez ⚖️</h1>
          <p className="text-info mb-0">{infoEdicion?.tipo} {infoEdicion?.anio}</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-outline-light rounded-pill px-4">
          Volver al Dashboard
        </button>
      </div>

      <div className="card bg-dark border-secondary shadow-lg overflow-hidden" style={{ borderRadius: '15px' }}>
        <div className="table-responsive">
          <table className="table table-dark align-middle mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead className="bg-secondary text-uppercase small fw-bold">
              <tr>
                <th className="ps-4 py-3 border-0" style={{ background: '#343a40' }}>PAÍS / ARTISTA</th>
                {jueces.map(juez => (
                  <th key={juez.id_usuario} className="text-center border-0 text-dark" style={{ background: '#ffc107', minWidth: '120px' }}>
                    {juez.nombre}
                  </th>
                ))}
                <th className="pe-4 text-center border-0" style={{ background: '#343a40' }}>OFICIAL</th>
              </tr>
            </thead>
            <tbody>
              {datosTabla.length > 0 ? datosTabla.map(fila => (
                <tr key={fila.id} style={{ borderBottom: '1px solid #444' }}>
                  <td className="ps-4 py-3 border-0">
                    <div className="d-flex align-items-center">
                      <span className="me-3 fs-3">{fila.bandera}</span>
                      <div>
                        <div className="fw-bold text-white">{fila.pais}</div>
                        <div className="small text-muted">{fila.artista}</div>
                      </div>
                    </div>
                  </td>
                  {jueces.map(juez => (
                    <td key={juez.id_usuario} className="text-center fw-bold border-0" style={{ background: '#ffc107', color: '#000', fontSize: '1.1rem' }}>
                      {fila.promediosPorJuez[juez.id_usuario] || '-'}
                    </td>
                  ))}
                  <td className="pe-4 text-center border-0 fw-bold">
                    {fila.puesto_oficial ? (
                      <span className="badge bg-danger rounded-pill px-3">#{fila.puesto_oficial}</span>
                    ) : (
                      <span className="text-muted opacity-50">-</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={jueces.length + 2} className="text-center py-5 text-muted">
                    No hay datos disponibles para esta gala.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default function EstadisticasPage() {
  return (
    <Suspense fallback={<div className="text-center mt-5 text-white">Cargando...</div>}>
      <EstadisticasPublicasContent />
    </Suspense>
  )
}