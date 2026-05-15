'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'

// Estilos de impresión para forzar que la tabla se vea completa en la captura
const printStyles = `
  @media print {
    body, main, .table-responsive {
      width: 100% !important;
      overflow: visible !important;
      max-height: none !important;
    }
    table {
      table-layout: auto !important;
      width: 100% !important;
    }
  }
`;

function SemiStatsContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  const tablaRef = useRef(null)

  const [datos, setDatos] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [infoEdicion, setInfoEdicion] = useState({ tipo: '', anio: '' })
  const [sortConfig, setSortConfig] = useState({ key: 'resultado', direction: 'desc' })
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (edicionId) fetchEstadisticas()
  }, [edicionId])

  const fetchEstadisticas = async () => {
    setLoading(true)

    const { data: edicion } = await supabase
      .from('ediciones')
      .select('tipo, anio')
      .eq('id_edicion', edicionId)
      .single()

    if (edicion) {
      setInfoEdicion({ tipo: edicion.tipo, anio: edicion.anio })
    }

    const { data: participaciones } = await supabase
      .from('participaciones')
      .select('id_participacion, clasifico, paises(nombre)')
      .eq('id_edicion', edicionId)

    const { data: votos } = await supabase
      .from('lineas_votacion')
      .select(`
        id_participacion,
        id_usuario,
        usuarios ( nombre ),
        detalles_voto ( puntaje )
      `)
      .in('id_participacion', participaciones.map(p => p.id_participacion))

    const mapaUsuarios = {}
    votos.forEach(v => {
      if (!mapaUsuarios[v.id_usuario]) {
        mapaUsuarios[v.id_usuario] = { 
          id: v.id_usuario, 
          nombre: v.usuarios.nombre,
          votosPorPais: {},
          acierto: 0 
        }
      }
      const total = v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
      const promedio = total / v.detalles_voto.length
      mapaUsuarios[v.id_usuario].votosPorPais[v.id_participacion] = promedio
    })

    const listaUsuarios = Object.values(mapaUsuarios)
    const idsClasificadosReales = participaciones.filter(p => p.clasifico).map(p => p.id_participacion)
    
    listaUsuarios.forEach(u => {
      const top10Usuario = Object.entries(u.votosPorPais)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => Number(entry[0]))

      const coincidencias = top10Usuario.filter(id => idsClasificadosReales.includes(id)).length
      u.acierto = idsClasificadosReales.length > 0 ? (coincidencias / idsClasificadosReales.length) * 100 : 0
    })

    const filas = participaciones.map(p => {
      const fila = {
        id_participacion: p.id_participacion,
        pais: p.paises.nombre,
        resultado: p.clasifico,
        votos: {}
      }
      listaUsuarios.forEach(u => {
        fila.votos[u.id] = u.votosPorPais[p.id_participacion] || 0
      })
      return fila
    })

    setUsuarios(listaUsuarios)
    setDatos(filas)
    setLoading(false)
  }

  const descargarEstadisticas = () => {
    if (tablaRef.current === null) return
    setIsDownloading(true)

    const styleSheet = document.createElement("style")
    styleSheet.innerText = printStyles
    document.head.appendChild(styleSheet)

    setTimeout(() => {
      toPng(tablaRef.current, { 
        cacheBust: true, 
        backgroundColor: '#1a1a1a',
        style: {
          width: 'auto',
          minWidth: 'auto',
          maxWidth: 'none',
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none'
        },
        width: tablaRef.current.scrollWidth, 
        height: tablaRef.current.scrollHeight
      })
        .then((dataUrl) => {
          const link = document.createElement('a')
          // Formato solicitado: Estadisticas_globales-Eurovision-anio-tipo
          link.download = `Estadisticas_globales-Eurovision-${infoEdicion.anio}-${infoEdicion.tipo}.png`
          link.href = dataUrl
          link.click()
        })
        .catch((err) => {
          console.error("Error al descargar", err)
        })
        .finally(() => {
          document.head.removeChild(styleSheet)
          setIsDownloading(false)
        })
    }, 100)
  }

  const ordenarTabla = (key, isUser = false) => {
    let direction = 'desc'
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc'
    setSortConfig({ key, direction, isUser })
  }

  const datosOrdenados = [...datos].sort((a, b) => {
    let valA, valB
    if (sortConfig.isUser) {
      valA = a.votos[sortConfig.key] || 0
      valB = b.votos[sortConfig.key] || 0
    } else {
      valA = a[sortConfig.key]
      valB = b[sortConfig.key]
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  if (loading) return <div className="text-center mt-5 text-white opacity-50">Calculando estadísticas...</div>

  return (
    <main className="container-fluid mt-4 px-4 text-white font-sans">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-info text-uppercase" style={{ letterSpacing: '1px' }}>
          Estadísticas Globales - {infoEdicion.tipo} - {infoEdicion.anio}
        </h2>
        <button 
          onClick={descargarEstadisticas} 
          disabled={isDownloading}
          className="btn btn-sm btn-success fw-bold px-3 py-2 shadow-sm d-flex align-items-center"
        >
          {isDownloading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Capturando...
            </>
          ) : (
            'Descargar estadísticas 📸'
          )}
        </button>
      </div>

      <div 
        ref={tablaRef}
        className="table-responsive shadow-lg rounded border border-secondary"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <table className="table table-dark table-hover align-middle mb-0">
          <thead className="table-secondary text-dark text-uppercase small fw-bold">
            <tr>
              <th onClick={() => ordenarTabla('pais')} style={{cursor:'pointer'}}>País</th>
              <th onClick={() => ordenarTabla('resultado')} className="text-center" style={{cursor:'pointer'}}>Resultado</th>
              {usuarios.map(u => (
                <th key={u.id} className="text-center" onClick={() => ordenarTabla(u.id, true)} style={{cursor:'pointer'}}>
                  <div>{u.nombre}</div>
                  <div className="text-primary" style={{fontSize: '0.7rem'}}>
                    ({u.acierto.toFixed(0)}% acierto)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datosOrdenados.map((fila, idx) => {
              const esTop10 = idx < 10;
              return (
                <tr 
                  key={fila.id_participacion}
                  style={{
                    borderLeft: esTop10 ? '5px solid #ffc107' : '5px solid transparent',
                    backgroundColor: esTop10 ? 'rgba(255, 193, 7, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <td className={`ps-3 ${esTop10 ? 'fw-bold text-warning' : ''}`}>
                    <span className="opacity-50 me-2" style={{ fontSize: '0.8rem' }}>{idx + 1}.</span>
                    {fila.pais}
                  </td>
                  <td className="text-center">
                    {fila.resultado ? 
                      <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>CLASIFICÓ</span> : 
                      <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>NO PASÓ</span>
                    }
                  </td>
                  {usuarios.map(u => (
                    <td 
                      key={u.id} 
                      className={`text-center ${fila.votos[u.id] >= 7 ? 'text-warning fw-bold' : 'opacity-75'}`}
                    >
                      {fila.votos[u.id] > 0 ? fila.votos[u.id].toFixed(2) : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}

export default function SemiStatsPage() {
  return (
    <Suspense fallback={<div className="text-center mt-5 text-white">Cargando...</div>}>
      <SemiStatsContenido />
    </Suspense>
  )
}