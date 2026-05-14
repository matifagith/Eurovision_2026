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
  
  // Estado para los inputs range (sliders) actuales
  const [puntajes, setPuntajes] = useState({})
  
  // Historial de votos del usuario para calcular el ranking
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
        .select(`id_participacion, paises ( nombre ), canciones ( nombre )`)
        .eq('id_edicion', edicionId)
      setParticipantes(parts || [])

      // (REEMPLAZAR LA CONSULTA VIEJA DE CATEGORIAS POR ESTA)
      const { data: cats } = await supabase
        .from('edicion_categorias')
        .select(`
          categorias ( id_categoria, nombre, descripcion )
        `)
        .eq('id_edicion', edicionId)

      // Extraer los datos mapeados
      if (cats) {
        const categoriasLimpias = cats.map(c => c.categorias).sort((a,b) => a.id_categoria - b.id_categoria)
        setCategorias(categoriasLimpias)
      }

      // Traer historial de votos del usuario si existe
      if (storedUser) {
        await cargarHistorial(storedUser.id_usuario, parts.map(p => p.id_participacion))
      }

      setLoading(false)
    }

    fetchDatos()
  }, [edicionId])

  // Cargar lo que ya votó el usuario para armar la tabla
  const cargarHistorial = async (idUsuario, idsParticipaciones) => {
    if (idsParticipaciones.length === 0) return

    const { data: lineas } = await supabase
      .from('lineas_votacion')
      .select(`
        id_linea, 
        id_participacion, 
        detalles_voto ( id_categoria, puntaje )
      `)
      .eq('id_usuario', idUsuario)
      .in('id_participacion', idsParticipaciones)
    
    setHistorialVotos(lineas || [])
  }

  // Resetear los sliders cuando cambiamos de país
  useEffect(() => {
    if (categorias.length > 0 && participantes.length > 0) {
      const pActual = participantes[indiceActual]
      const votoPrevio = historialVotos.find(v => v.id_participacion === pActual.id_participacion)
      
      const nuevosPuntajes = {}
      categorias.forEach(cat => {
        const detalle = votoPrevio?.detalles_voto.find(d => d.id_categoria === cat.id_categoria)
        nuevosPuntajes[cat.id_categoria] = detalle ? detalle.puntaje : 5
      })
      setPuntajes(nuevosPuntajes)
    }
  }, [indiceActual, categorias, participantes, historialVotos])

  const handlePuntajeChange = (idCategoria, valor) => {
    setPuntajes({ ...puntajes, [idCategoria]: parseFloat(valor) })
  }

  // Guardar en la base de datos
  const handleVotar = async () => {
    if (!user) return alert("Error: Usuario no identificado.")
    const idParticipacion = participantes[indiceActual].id_participacion

    let idLinea = historialVotos.find(v => v.id_participacion === idParticipacion)?.id_linea

    if (!idLinea) {
      const { data: nuevaLinea, error: errLinea } = await supabase
        .from('lineas_votacion')
        .insert([{ id_usuario: user.id_usuario, id_participacion: idParticipacion }])
        .select().single()
      
      if (errLinea) return alert("Error al crear linea de votación")
      idLinea = nuevaLinea.id_linea
    }

    await supabase.from('detalles_voto').delete().eq('id_linea', idLinea)
    
    const detallesAInsertar = categorias.map(cat => ({
      id_linea: idLinea,
      id_categoria: cat.id_categoria,
      puntaje: puntajes[cat.id_categoria]
    }))

    await supabase.from('detalles_voto').insert(detallesAInsertar)

    await cargarHistorial(user.id_usuario, participantes.map(p => p.id_participacion))
    pasarSiguiente()
  }

  const pasarSiguiente = () => {
    setIndiceActual((indiceActual + 1) % participantes.length)
  }

  if (loading) return <div className="container mt-5 text-center">Cargando edición...</div>
  if (!participantes.length) return <div className="container mt-5 text-center">No hay participantes.</div>

  const participanteActual = participantes[indiceActual]

  // --- LÓGICA DE LA TABLA (Ranking + Desglose de Categorías) ---
  const ranking = participantes.map(p => {
    const linea = historialVotos.find(v => v.id_participacion === p.id_participacion)
    let total = 0
    let promedio = 0
    let votosPorCategoria = {} // Diccionario para guardar el voto específico por ID de categoría

    if (linea && linea.detalles_voto.length > 0) {
      total = linea.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
      promedio = total / linea.detalles_voto.length
      
      // Guardamos el puntaje específico de cada categoría
      linea.detalles_voto.forEach(detalle => {
        votosPorCategoria[detalle.id_categoria] = Number(detalle.puntaje)
      })
    }
    
    return { ...p, promedio, total, votado: !!linea, votosPorCategoria }
  }).sort((a, b) => b.promedio - a.promedio)

  return (
    <main className="container mt-4 pb-5 max-w-lg mx-auto font-sans">
      
      {/* TARJETA DE VOTACIÓN */}
      <div className="card bg-dark text-white shadow-lg overflow-hidden border-0 mb-5">
        <div className="bg-primary p-2 text-center text-uppercase small fw-bold">
          {edicionActiva?.tipo} {edicionActiva?.anio} - {user?.nombre}
        </div>
        <div className="card-body p-4 p-md-5 text-center">
          <h1 className="display-4 fw-bold text-warning mb-1">{participanteActual.paises.nombre}</h1>
          <h3 className="h6 text-light mb-4 opacity-75">🎵 {participanteActual.canciones.nombre}</h3>
          <hr className="border-secondary mb-4" />
          
          <div className="text-start mb-4">
            {categorias.map(cat => (
              <div key={cat.id_categoria} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label small fw-bold text-uppercase mb-0">{cat.nombre}</label>
                  <span className="badge bg-secondary fs-6">{puntajes[cat.id_categoria] || 5}</span>
                </div>
                <input 
                  type="range" 
                  className="form-range custom-range" 
                  min="1" max="10" step="0.5" 
                  value={puntajes[cat.id_categoria] || 5}
                  onChange={(e) => handlePuntajeChange(cat.id_categoria, e.target.value)}
                  disabled={!edicionActiva?.votacion_abierta} 
                />
              </div>
            ))}
          </div>

          {edicionActiva?.votacion_abierta ? (
            <button onClick={handleVotar} className="btn btn-warning w-100 fw-bold py-3 shadow fs-5">
              Enviar Voto 📩
            </button>
          ) : (
            <button onClick={pasarSiguiente} className="btn btn-outline-light w-100 py-3 fs-5">
              Siguiente País ⏭️
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE HISTORIAL / LEADERBOARD */}
      <h4 className="text-light mb-3 fw-bold border-bottom border-secondary pb-2">Tu Historial de Votos</h4>
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-dark table-hover align-middle mb-0" style={{ whiteSpace: 'nowrap' }}>
          <thead className="table-secondary text-dark">
            <tr>
              <th scope="col">#</th>
              <th scope="col">País</th>
              
              {/* Columnas dinámicas de categorías */}
              {categorias.map(cat => (
                <th key={cat.id_categoria} scope="col" className="text-center small">
                  {cat.nombre}
                </th>
              ))}
              
              <th scope="col" className="text-center bg-warning text-dark border-start border-dark">Promedio</th>
              <th scope="col" className="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, idx) => {
              const indexOriginal = participantes.findIndex(p => p.id_participacion === row.id_participacion)
              const esActual = indexOriginal === indiceActual

              return (
                <tr 
                  key={row.id_participacion} 
                  onClick={() => setIndiceActual(indexOriginal)}
                  style={{ cursor: 'pointer' }}
                  className={esActual ? 'table-active border-primary' : ''}
                >
                  <th scope="row" className={esActual ? 'text-primary' : ''}>{idx + 1}</th>
                  <td className={`fw-bold ${esActual ? 'text-warning' : ''}`}>
                    {row.paises.nombre}
                    {esActual && <span className="ms-2 small text-warning">👀</span>}
                  </td>
                  
                  {/* Celdas dinámicas de categorías */}
                  {categorias.map(cat => (
                    <td key={cat.id_categoria} className="text-center text-light opacity-75">
                      {row.votado && row.votosPorCategoria[cat.id_categoria] !== undefined 
                        ? row.votosPorCategoria[cat.id_categoria] 
                        : '-'}
                    </td>
                  ))}

                  <td className="text-center fw-bold text-dark bg-warning border-start border-dark">
                    {row.votado ? row.promedio.toFixed(2) : '-'}
                  </td>
                  <td className="text-center">
                    {row.votado 
                      ? <span className="badge bg-success">Votado</span>
                      : <span className="badge bg-secondary">Pendiente</span>
                    }
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