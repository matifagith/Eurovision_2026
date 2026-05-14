'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VotacionContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  
  const [user, setUser] = useState(null)
  const [edicionActiva, setEdicionActiva] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [categorias, setCategorias] = useState([])
  const [indiceActual, setIndiceActual] = useState(0)
  const [loading, setLoading] = useState(true)
  const [puntajes, setPuntajes] = useState({})
  const [historialVotos, setHistorialVotos] = useState([])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) setUser(storedUser)

    if (!edicionId) return

    const fetchDatos = async () => {
      setLoading(true)
      const { data: edicion } = await supabase.from('ediciones').select('*').eq('id_edicion', edicionId).single()
      setEdicionActiva(edicion)

      const { data: parts } = await supabase.from('participaciones')
        .select(`
          id_participacion, 
          clasifico, 
          paises ( nombre ), 
          canciones ( nombre ),
          participacion_artista ( artistas ( nombre ) )
        `)
        .eq('id_edicion', edicionId)
      setParticipantes(parts || [])

      const { data: cats } = await supabase.from('edicion_categorias')
        .select(`categorias ( id_categoria, nombre, descripcion )`)
        .eq('id_edicion', edicionId)

      if (cats) {
        const categoriasLimpias = cats.map(c => c.categorias).sort((a,b) => a.id_categoria - b.id_categoria)
        setCategorias(categoriasLimpias)
      }

      if (storedUser) {
        await cargarHistorial(storedUser.id_usuario, (parts || []).map(p => p.id_participacion))
      }
      setLoading(false)
    }
    fetchDatos()
  }, [edicionId])

  // NUEVO: useEffect para precargar puntajes cuando cambias de país o se actualiza el historial
  useEffect(() => {
    if (participantes.length > 0 && categorias.length > 0) {
      const idParticipacionActual = participantes[indiceActual]?.id_participacion
      const votoExistente = historialVotos.find(v => v.id_participacion === idParticipacionActual)

      if (votoExistente && votoExistente.detalles_voto.length > 0) {
        // Precargar valores del historial
        const nuevosPuntajes = {}
        votoExistente.detalles_voto.forEach(d => {
          nuevosPuntajes[d.id_categoria] = Number(d.puntaje)
        })
        setPuntajes(nuevosPuntajes)
      } else {
        // Resetear a 5 si es nuevo
        const resetPuntajes = {}
        categorias.forEach(c => { resetPuntajes[c.id_categoria] = 5 })
        setPuntajes(resetPuntajes)
      }
    }
  }, [indiceActual, historialVotos, participantes, categorias])

  const cargarHistorial = async (idUsuario, idsParticipaciones) => {
    if (idsParticipaciones.length === 0) return
    const { data: lineas } = await supabase.from('lineas_votacion')
      .select(`id_linea, id_participacion, detalles_voto ( id_categoria, puntaje )`)
      .eq('id_usuario', idUsuario).in('id_participacion', idsParticipaciones)
    setHistorialVotos(lineas || [])
  }

  const handleVotar = async () => {
    if (!user) return alert("Error: Usuario no identificado.")
    const idParticipacion = participantes[indiceActual].id_participacion
    let idLinea = historialVotos.find(v => v.id_participacion === idParticipacion)?.id_linea

    if (!idLinea) {
      const { data: nuevaLinea } = await supabase.from('lineas_votacion')
        .insert([{ id_usuario: user.id_usuario, id_participacion: idParticipacion }])
        .select().single()
      idLinea = nuevaLinea.id_linea
    }

    await supabase.from('detalles_voto').delete().eq('id_linea', idLinea)
    await supabase.from('detalles_voto').insert(categorias.map(cat => ({
      id_linea: idLinea, id_categoria: cat.id_categoria, puntaje: puntajes[cat.id_categoria] || 5
    })))

    // Actualizamos historial para reflejar el cambio inmediatamente
    await cargarHistorial(user.id_usuario, participantes.map(p => p.id_participacion))

    // REDIRECCIÓN INTELIGENTE: Buscar el próximo pendiente
    const nuevosIdsVotados = [...historialVotos.map(v => v.id_participacion), idParticipacion]
    const proximoPendienteIdx = participantes.findIndex((p, idx) => {
      // Queremos el primero que no esté en el historial, empezando desde el siguiente al actual
      return idx > indiceActual && !historialVotos.some(v => v.id_participacion === p.id_participacion)
    })

    if (proximoPendienteIdx !== -1) {
      setIndiceActual(proximoPendienteIdx)
    } else {
      // Si no hay ninguno después, buscar desde el principio
      const primeroPendiente = participantes.findIndex(p => !historialVotos.some(v => v.id_participacion === p.id_participacion))
      if (primeroPendiente !== -1 && primeroPendiente !== indiceActual) {
        setIndiceActual(primeroPendiente)
      } else {
        alert("¡Todos los países han sido votados!")
      }
    }
  }

  if (loading) return <div className="container mt-5 text-center text-white opacity-50">Cargando...</div>

  const participanteActual = participantes[indiceActual]
  const listaArtistas = participanteActual?.participacion_artista?.map(pa => pa.artistas?.nombre).join(', ')

  const ranking = participantes.map(p => {
    const linea = historialVotos.find(v => v.id_participacion === p.id_participacion)
    let total = 0, promedio = 0, votosPorCategoria = {}
    if (linea && linea.detalles_voto.length > 0) {
      total = linea.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
      promedio = total / linea.detalles_voto.length
      linea.detalles_voto.forEach(d => { votosPorCategoria[d.id_categoria] = Number(d.puntaje) })
    }
    return { ...p, promedio, votado: !!linea, votosPorCategoria }
  }).sort((a, b) => b.promedio - a.promedio)

  const stickyHeaderStyle = { position: 'sticky', top: 0, zIndex: 20 };
  const stickyColStyle = { position: 'sticky', zIndex: 15 };
  const stickyStyleNum = { ...stickyColStyle, left: 0 };
  const stickyStylePais = { ...stickyColStyle, left: '40px', borderRight: '2px solid #444' };

  return (
    <main className="container mt-4 pb-5 max-w-lg mx-auto font-sans">
      <div className="card bg-dark text-white shadow-lg overflow-hidden border-0 mb-5">
        <div className="bg-primary p-2 text-center text-uppercase small fw-bold">
          {edicionActiva?.tipo} {edicionActiva?.anio} - {user?.nombre}
        </div>
        <div className="card-body p-4 p-md-5 text-center">
          <h1 className="display-4 fw-bold text-warning mb-1">{participanteActual?.paises?.nombre}</h1>
          <h3 className="h6 text-light mb-4 opacity-75">
            🎵 {participanteActual?.canciones?.nombre} {listaArtistas ? `by ${listaArtistas}` : ''}
          </h3>
          <hr className="border-secondary mb-4" />
          <div className="text-start mb-4">
            {categorias.map(cat => (
              <div key={cat.id_categoria} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-bold text-uppercase mb-0">{cat.nombre}</label>
                  <span className="badge bg-secondary fs-6">{puntajes[cat.id_categoria] || 5}</span>
                </div>
                <input type="range" className="form-range" min="1" max="10" step="0.5" value={puntajes[cat.id_categoria] || 5} onChange={(e) => setPuntajes({ ...puntajes, [cat.id_categoria]: parseFloat(e.target.value) })} disabled={!edicionActiva?.votacion_abierta} />
              </div>
            ))}
          </div>
          {edicionActiva?.votacion_abierta ? (
            <button onClick={handleVotar} className="btn btn-warning w-100 fw-bold py-3 shadow fs-5 text-dark">Enviar Voto 📩</button>
          ) : (
            <button onClick={() => setIndiceActual((indiceActual + 1) % participantes.length)} className="btn btn-outline-light w-100 py-3 fs-5">Siguiente País ⏭️</button>
          )}
        </div>
      </div>

      <h4 className="text-light mb-3 fw-bold border-bottom border-secondary pb-2">Tu Historial de Votos</h4>
      <div className="table-responsive shadow-sm rounded border border-secondary" style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
        <table className="table table-dark table-hover align-middle mb-0" style={{ whiteSpace: 'nowrap', minWidth: '900px' }}>
          <thead className="text-dark text-uppercase small fw-bold" style={stickyHeaderStyle}>
            <tr>
              <th style={{ ...stickyStyleNum, backgroundColor: '#adb5bd', top: 0, zIndex: 25 }}>#</th>
              <th style={{ ...stickyStylePais, backgroundColor: '#adb5bd', top: 0, zIndex: 25 }}>País</th>
              {categorias.map(cat => (
                <th key={cat.id_categoria} className="text-center" style={{ backgroundColor: '#adb5bd', top: 0 }}>{cat.nombre}</th>
              ))}
              <th className="text-center bg-warning text-dark" style={{ top: 0 }}>Promedio</th>
              <th className="text-center" style={{ backgroundColor: '#adb5bd', top: 0 }}>Estado</th>
              <th className="text-center" style={{ backgroundColor: '#adb5bd', top: 0 }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, idx) => {
              const esTop10 = idx < 10;
              const indexOriginal = participantes.findIndex(p => p.id_participacion === row.id_participacion);
              const esActual = indexOriginal === indiceActual;
              const bgRow = esActual ? '#2c3034' : '#212529';

              return (
                <tr 
                  key={row.id_participacion} 
                  onClick={() => setIndiceActual(indexOriginal)}
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: esTop10 ? '4px solid #ffc107' : '4px solid transparent'
                  }}
                  className={esActual ? 'table-active' : ''}
                >
                  <th scope="row" style={{ ...stickyStyleNum, backgroundColor: bgRow }} className={esTop10 ? 'text-warning' : ''}>{idx + 1}</th>
                  <td style={{ ...stickyStylePais, backgroundColor: bgRow }} className={`fw-bold ${esActual ? 'text-warning' : ''}`}>{row.paises.nombre}</td>
                  {categorias.map(cat => (
                    <td key={cat.id_categoria} className="text-center text-light opacity-75">
                      {row.votado ? row.votosPorCategoria[cat.id_categoria] : '-'}
                    </td>
                  ))}
                  <td className="text-center fw-bold text-dark bg-warning">{row.votado ? row.promedio.toFixed(2) : '-'}</td>
                  <td className="text-center">
                    <span className={`badge ${row.votado ? 'bg-success' : 'bg-secondary'} small`}>{row.votado ? 'Votado' : 'Pendiente'}</span>
                  </td>
                  <td className="text-center">
                    {!edicionActiva?.votacion_abierta ? (
                      row.clasifico ? <span className="badge bg-success fs-6">✅</span> : <span className="badge bg-danger fs-6">❌</span>
                    ) : <span className="text-secondary opacity-50 small">-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default function VotePage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-5">Cargando aplicación...</div>}>
      <VotacionContenido />
    </Suspense>
  )
}