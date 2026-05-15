'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function EstadisticasFinalContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  
  const [loading, setLoading] = useState(true)
  const [topJueces, setTopJueces] = useState([])
  const [rankingGlobal, setRankingGlobal] = useState([])
  const [infoEdicion, setInfoEdicion] = useState({ anio: '' })

  // Estados para el Filtro de Usuarios
  const [rawData, setRawData] = useState([])
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([])
  const [tempSeleccion, setTempSeleccion] = useState([]) // Usuarios seleccionados en el checkbox
  const [busquedaFiltro, setBusquedaFiltro] = useState('')

  useEffect(() => {
    if (edicionId) fetchEstadisticas()
  }, [edicionId])

  const fetchEstadisticas = async () => {
    setLoading(true)

    const { data: edicion } = await supabase
      .from('ediciones')
      .select('anio')
      .eq('id_edicion', edicionId)
      .single()
    if (edicion) setInfoEdicion(edicion)

    const { data, error } = await supabase
      .from('lineas_votacion')
      .select(`
        id_usuario,
        usuarios ( nombre ),
        participaciones ( 
          puesto_oficial,
          puntos_oficiales,
          paises ( nombre )
        ),
        detalles_voto ( puntaje )
      `)
      .filter('participaciones.id_edicion', 'eq', edicionId)

    if (error || !data) {
      console.error("Error trayendo votos", error)
      setLoading(false)
      return
    }

    // Extraemos todos los jueces únicos que participaron
    const usuariosUnicos = [...new Set(data.filter(v => v.participaciones).map(v => v.usuarios?.nombre || 'Anónimo'))]
    
    setRawData(data)
    setUsuariosDisponibles(usuariosUnicos)
    setTempSeleccion(usuariosUnicos) // Seleccionamos todos por defecto
    
    // Procesamos inicialmente con todos los jueces
    procesarEstadisticas(data, usuariosUnicos)
    setLoading(false)
  }

  // Nueva función aislada para recalcular según los filtros
  const procesarEstadisticas = (dataCruda, usuariosPermitidos) => {
    const paisesGlobal = {} 
    const juecesData = {}
    
    // Obtenemos el total REAL de países de la edición (sin importar el filtro)
    const setPaisesTotales = new Set()
    dataCruda.forEach(v => {
        if(v.participaciones) setPaisesTotales.add(v.participaciones.paises.nombre)
    })
    const totalPaisesParticipantes = setPaisesTotales.size

    // Filtramos la data cruda según los usuarios que tildó el admin
    const dataFiltrada = dataCruda.filter(v => v.participaciones && usuariosPermitidos.includes(v.usuarios?.nombre || 'Anónimo'))

    dataFiltrada.forEach(v => {
      const pais = v.participaciones.paises.nombre
      const puestoReal = v.participaciones.puesto_oficial
      const puntosReales = v.participaciones.puntos_oficiales
      const juez = v.usuarios?.nombre || 'Anónimo'
      
      const sumaPuntos = v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
      const promedioLinea = sumaPuntos / (v.detalles_voto.length || 1)

      if (!paisesGlobal[pais]) {
        paisesGlobal[pais] = { 
          sum: 0, 
          count: 0, 
          puesto_oficial: puestoReal, 
          puntos_oficiales: puntosReales,
          juecesAcertados: [] 
        }
      }
      paisesGlobal[pais].sum += promedioLinea
      paisesGlobal[pais].count += 1

      if (!juecesData[juez]) juecesData[juez] = { votos: [] }
      juecesData[juez].votos.push({ pais, promedio: promedioLinea })
    })

    const globalRankeado = Object.keys(paisesGlobal).map(pais => ({
      pais,
      puesto_oficial: paisesGlobal[pais].puesto_oficial,
      puntos_oficiales: paisesGlobal[pais].puntos_oficiales,
      promedioFinal: paisesGlobal[pais].sum / paisesGlobal[pais].count,
      juecesAcertados: paisesGlobal[pais].juecesAcertados
    }))
    .sort((a, b) => {
      const puestoA = a.puesto_oficial || 999
      const puestoB = b.puesto_oficial || 999
      return puestoA - puestoB
    })

    const juecesValidos = []

    Object.keys(juecesData).forEach(juez => {
      const rankDelJuez = juecesData[juez].votos
        .sort((a, b) => b.promedio - a.promedio)
        .map((item, index) => ({ ...item, rankIndividual: index + 1 }))

      rankDelJuez.forEach(jv => {
        const paisGlobal = globalRankeado.find(g => g.pais === jv.pais)
        const puestoGlobalReal = paisGlobal ? paisGlobal.puesto_oficial : null
        
        if (puestoGlobalReal === jv.rankIndividual) {
          paisGlobal.juecesAcertados.push(juez) 
        }
      })

      // Validamos contra el total REAL de países para mantener la justicia estadística
      if (juecesData[juez].votos.length === totalPaisesParticipantes) {
        let diferencialTotal = 0

        rankDelJuez.forEach(jv => {
          const paisGlobal = globalRankeado.find(g => g.pais === jv.pais)
          const puestoGlobalReal = paisGlobal ? paisGlobal.puesto_oficial : null
          
          if (puestoGlobalReal > 0) { 
            diferencialTotal += Math.abs(puestoGlobalReal - jv.rankIndividual)
          }
        })

        juecesValidos.push({ juez, diferencial: diferencialTotal })
      }
    })

    setRankingGlobal(globalRankeado)

    juecesValidos.sort((a, b) => a.diferencial - b.diferencial)

    const podioAgrupado = []
    
    juecesValidos.forEach(item => {
      if (podioAgrupado.length === 0) {
        podioAgrupado.push({ diferencial: item.diferencial, jueces: [item.juez] })
      } else {
        const ultimoGrupo = podioAgrupado[podioAgrupado.length - 1]
        if (ultimoGrupo.diferencial === item.diferencial) {
          ultimoGrupo.jueces.push(item.juez)
        } else {
          podioAgrupado.push({ diferencial: item.diferencial, jueces: [item.juez] })
        }
      }
    })

    setTopJueces(podioAgrupado.slice(0, 5))
  }

  // ACCIONES DEL FILTRO
  const toggleUsuario = (usuario) => {
    setTempSeleccion(prev => 
      prev.includes(usuario) ? prev.filter(u => u !== usuario) : [...prev, usuario]
    )
  }

  const aplicarFiltro = () => {
    procesarEstadisticas(rawData, tempSeleccion)
  }

  const borrarFiltro = () => {
    setTempSeleccion(usuariosDisponibles)
    setBusquedaFiltro('')
    procesarEstadisticas(rawData, usuariosDisponibles)
  }

  const getMedalla = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return <span className="text-secondary fw-bold ms-1" style={{fontSize: '0.8rem'}}>#{index + 1}</span>
  }

  // Renderizado del componente
  if (loading) return <div className="text-center mt-5 text-white opacity-50">Calculando estadísticas de la final...</div>

  return (
    <main className="container mt-5 text-white font-sans">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-info text-uppercase mb-0">
          RESULTADOS FINAL {infoEdicion.anio}
        </h2>
        <p className="text-secondary small mt-1">Auditoría y precisión del jurado frente al consenso general</p>
      </div>

      {/* PANEL DE FILTROS AVANZADOS */}
      <div className="card bg-dark border-secondary p-3 mb-5 shadow-sm">
        <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
           Filtro de Jueces
        </h6>
        <div className="row g-3">
            <div className="col-md-4">
                <input 
                    type="text" 
                    className="form-control bg-black text-white border-secondary shadow-none mb-2" 
                    placeholder="Buscar juez..." 
                    value={busquedaFiltro} 
                    onChange={e => setBusquedaFiltro(e.target.value)} 
                />
            </div>
            <div className="col-md-8">
                <div className="d-flex flex-wrap gap-2 p-2 border border-secondary rounded bg-black" style={{maxHeight: '100px', overflowY: 'auto'}}>
                    {usuariosDisponibles.filter(u => u.toLowerCase().includes(busquedaFiltro.toLowerCase())).map(u => (
                        <div key={u} className="form-check form-check-inline m-0">
                            <input 
                                className="form-check-input bg-dark border-secondary" 
                                type="checkbox" 
                                id={`check-${u}`} 
                                checked={tempSeleccion.includes(u)} 
                                onChange={() => toggleUsuario(u)} 
                            />
                            <label className="form-check-label text-light small" htmlFor={`check-${u}`} style={{cursor: 'pointer'}}>
                                {u}
                            </label>
                        </div>
                    ))}
                    {usuariosDisponibles.filter(u => u.toLowerCase().includes(busquedaFiltro.toLowerCase())).length === 0 && (
                        <span className="text-muted small">No se encontraron jueces.</span>
                    )}
                </div>
            </div>
        </div>
        <div className="d-flex gap-2 mt-3 justify-content-end">
            <button onClick={borrarFiltro} className="btn btn-sm btn-outline-secondary px-3">
                Borrar Filtro
            </button>
            <button onClick={aplicarFiltro} className="btn btn-sm btn-primary fw-bold px-4">
                Filtrar Resultados
            </button>
        </div>
      </div>

      {/* SECCIÓN: TOP JUECES (EL PODIO) */}
      <div className="mb-5">
        <h4 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2">
          🏆 Salón de la Fama
        </h4>
        <div className="row g-3">
          {topJueces.length > 0 ? topJueces.map((grupo, index) => (
            <div className="col" key={grupo.diferencial}>
              <div 
                className={`card bg-dark text-white text-center py-3 px-2 shadow-sm border h-100 ${index === 0 ? 'border-warning' : 'border-secondary'}`}
                style={{ borderRadius: '12px' }}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: '-5px' }}>
                  {getMedalla(index)}
                </div>
                <div className={`mt-2 ${index === 0 ? 'text-warning' : 'text-light'}`}>
                  {grupo.jueces.map((juezEmpatado) => (
                     <div key={juezEmpatado} className="fw-bold">{juezEmpatado}</div>
                  ))}
                </div>
                <div className="text-secondary mt-2" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Certeridad: <span className="text-info fw-bold">{grupo.diferencial}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-muted text-center w-100 py-3 border border-secondary rounded">No hay suficientes datos del jurado seleccionado para calcular el podio.</div>
          )}
        </div>
      </div>

      <hr className="border-secondary my-5" />

      {/* SECCIÓN: RANKING GLOBAL OFICIAL */}
      <div>
        <h4 className="fw-bold text-white mb-3">Ranking Global de la Final</h4>
        <div className="table-responsive shadow-lg rounded border border-secondary">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-secondary text-dark text-uppercase small fw-bold">
              <tr>
                <th className="text-center" style={{ width: '60px' }}>Pos</th>
                <th>País</th>
                <th className="text-center">Puntos</th>
                <th className="text-center">Promedio Global</th>
                <th>🎯 Aciertos</th>
              </tr>
            </thead>
            <tbody>
              {rankingGlobal.map(pais => (
                <tr key={pais.pais}>
                  <td className="text-center fw-bold text-warning">
                    {pais.puesto_oficial ? `${pais.puesto_oficial}°` : '-'}
                  </td>
                  <td className="fw-bold">{pais.pais}</td>
                  <td className="text-center text-light">
                    {pais.puntos_oficiales !== null ? pais.puntos_oficiales : '-'}
                  </td>
                  <td className="text-center text-info fw-bold">
                    {pais.promedioFinal ? pais.promedioFinal.toFixed(2) : '-'}
                  </td>
                  <td>
                    {pais.juecesAcertados.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {pais.juecesAcertados.map(juez => (
                          <span key={juez} className="badge bg-success text-dark fw-bold">
                            {juez}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small opacity-50">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

export default function EstadisticasFinalPage() {
  return (
    <Suspense fallback={<div className="text-center mt-5 text-white opacity-50">Cargando motor de estadísticas...</div>}>
      <EstadisticasFinalContenido />
    </Suspense>
  )
}