'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

function SemiStatsContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')

  const [datos, setDatos] = useState([]) // Filas de la tabla (países + promedios)
  const [usuarios, setUsuarios] = useState([]) // Cabeceras dinámicas (usuarios)
  const [loading, setLoading] = useState(true)
  const [infoEdicion, setInfoEdicion] = useState({ tipo: '', anio: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'resultado', direction: 'desc' })

  useEffect(() => {
    if (edicionId) fetchEstadisticas()
  }, [edicionId])

  const fetchEstadisticas = async () => {
    setLoading(true)

    // NUEVO: Obtener info de la edición (Tipo y Año)
  const { data: edicion } = await supabase
    .from('ediciones')
    .select('tipo, anio')
    .eq('id_edicion', edicionId)
    .single();

  if (edicion) {
    setInfoEdicion({ tipo: edicion.tipo, anio: edicion.anio });
  }

    // 1. Traer participaciones de esta edición (Países y si clasificaron)
    const { data: participaciones } = await supabase
      .from('participaciones')
      .select('id_participacion, clasifico, paises(nombre)')
      .eq('id_edicion', edicionId)

    // 2. Traer todos los votos de esta edición con nombres de usuarios
    const { data: votos } = await supabase
      .from('lineas_votacion')
      .select(`
        id_participacion,
        id_usuario,
        usuarios ( nombre ),
        detalles_voto ( puntaje )
      `)
      .in('id_participacion', participaciones.map(p => p.id_participacion))

    // 3. Procesar Usuarios Únicos y sus Aciertos
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
      // Calcular promedio del usuario para este país
      const total = v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0)
      const promedio = total / v.detalles_voto.length
      mapaUsuarios[v.id_usuario].votosPorPais[v.id_participacion] = promedio
    })

    const listaUsuarios = Object.values(mapaUsuarios)

    // 4. Calcular % de Acierto para cada usuario
    const idsClasificadosReales = participaciones.filter(p => p.clasifico).map(p => p.id_participacion)
    
    listaUsuarios.forEach(u => {
      // Obtenemos su Top 10 basado en sus promedios
      const top10Usuario = Object.entries(u.votosPorPais)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => Number(entry[0]))

      const coincidencias = top10Usuario.filter(id => idsClasificadosReales.includes(id)).length
      u.acierto = (coincidencias / idsClasificadosReales.length) * 100
    })

    // 5. Construir filas de la tabla
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

  // Lógica de ordenamiento
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
      <h2 className="fw-bold mb-4 text-info text-uppercase" style={{ letterSpacing: '1px' }}>
  Estadísticas Globales - {infoEdicion.tipo} - {infoEdicion.anio}
</h2>
      <div className="table-responsive shadow-lg rounded border border-secondary">
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
         {/* ... dentro del tbody de tu tabla ... */}
            <tbody>
            {datosOrdenados.map((fila, idx) => {
                // Determinamos si la fila actual pertenece al Top 10 del ordenamiento vigente
                const esTop10 = idx < 10;

                return (
                <tr 
                    key={fila.id_participacion}
                    style={{
                    // Aplicamos un borde izquierdo grueso y color de fondo sutil para resaltar el Top 10
                    borderLeft: esTop10 ? '5px solid #ffc107' : '5px solid transparent',
                    backgroundColor: esTop10 ? 'rgba(255, 193, 7, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease'
                    }}
                >
                    <td className={`ps-3 ${esTop10 ? 'fw-bold text-warning' : ''}`}>
                    {/* Mostramos el número de ranking al lado del nombre */}
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