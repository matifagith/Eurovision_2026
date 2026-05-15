'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams, useRouter } from 'next/navigation'

function ABMVotosContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  const router = useRouter()

  const [votos, setVotos] = useState([])
  const [usuariosVotantes, setUsuariosVotantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [infoEdicion, setInfoEdicion] = useState({ tipo: '', anio: '' })
  
  // Estados de Filtros
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroUserSelect, setFiltroUserSelect] = useState('')

  // Estados de Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(25)

  useEffect(() => {
    if (edicionId) fetchDatos()
  }, [edicionId])

  const fetchDatos = async () => {
    setLoading(true)
    const { data: edicion } = await supabase
      .from('ediciones')
      .select('tipo, anio')
      .eq('id_edicion', edicionId)
      .single()
    if (edicion) setInfoEdicion(edicion)

    const { data, error } = await supabase
      .from('lineas_votacion')
      .select(`
        id_linea,
        id_usuario,
        usuarios ( nombre ),
        participaciones ( 
          paises ( nombre ),
          id_edicion
        ),
        detalles_voto ( puntaje )
      `)
      .filter('participaciones.id_edicion', 'eq', edicionId)

    if (!error) {
      const votosProcesados = data.filter(v => v.participaciones).map(v => ({
        id: v.id_linea,
        id_usuario: v.id_usuario,
        usuario: v.usuarios?.nombre || 'Anónimo',
        pais: v.participaciones.paises?.nombre || 'Desconocido',
        totalPuntos: v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0),
        promedio: (v.detalles_voto.reduce((acc, curr) => acc + Number(curr.puntaje), 0) / v.detalles_voto.length).toFixed(2)
      }))
      
      setVotos(votosProcesados)

      const unicos = []
      votosProcesados.forEach(v => {
        if (!unicos.find(u => u.id === v.id_usuario)) {
          unicos.push({ id: v.id_usuario, nombre: v.usuario })
        }
      })
      setUsuariosVotantes(unicos)
    }
    setLoading(false)
  }

  const eliminarVoto = async (id) => {
    if (confirm('¿Estás seguro de eliminar este voto?')) {
      await supabase.from('detalles_voto').delete().eq('id_linea', id)
      await supabase.from('lineas_votacion').delete().eq('id_linea', id)
      fetchDatos()
    }
  }

  const borrarFiltros = () => {
    setFiltroTexto('')
    setFiltroUserSelect('')
    setPaginaActual(1)
  }

  // Filtrado
  const votosFiltrados = votos.filter(v => {
    const coincideTexto = v.pais.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                         v.usuario.toLowerCase().includes(filtroTexto.toLowerCase())
    const coincideSelect = filtroUserSelect === '' || v.id_usuario.toString() === filtroUserSelect
    return coincideTexto && coincideSelect
  })

  // Lógica de Paginación
  const totalPaginas = Math.ceil(votosFiltrados.length / itemsPorPagina)
  const inicio = (paginaActual - 1) * itemsPorPagina
  const votosPaginados = votosFiltrados.slice(inicio, inicio + itemsPorPagina)

  if (loading) return <div className="text-center mt-5 text-white opacity-50">Cargando...</div>

  return (
    <main className="container mt-5 text-white font-sans">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 className="fw-bold text-info text-uppercase mb-0">
                Votos - {infoEdicion.tipo} {infoEdicion.anio}
            </h2>
            <p className="text-secondary small mt-1">Gestión y auditoría de puntajes</p>
        </div>
        <button onClick={() => router.push('/admin')} className="btn btn-outline-light btn-sm px-3">
          Volver al panel de control
        </button>
      </div>

      {/* FILTROS (Sin botón actualizar) */}
      <div className="card bg-dark border-secondary p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-end">
            <div className="col-md-5">
                <label className="form-label small text-secondary fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Buscar país o usuario</label>
                <input 
                    type="text" 
                    placeholder="Ej: Italia..." 
                    className="form-control bg-black text-white border-secondary shadow-none"
                    value={filtroTexto}
                    onChange={(e) => {setFiltroTexto(e.target.value); setPaginaActual(1)}}
                />
            </div>
            <div className="col-md-4">
                <label className="form-label small text-secondary fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>Filtrar por Juez</label>
                <select 
                    className="form-select bg-black text-white border-secondary shadow-none"
                    value={filtroUserSelect}
                    onChange={(e) => {setFiltroUserSelect(e.target.value); setPaginaActual(1)}}
                >
                    <option value="">Todos los usuarios</option>
                    {usuariosVotantes.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-3">
                <button className="btn btn-outline-secondary w-100 fw-bold" onClick={borrarFiltros}>
                    Limpiar Filtros
                </button>
            </div>
        </div>
      </div>

      {/* INFO DE PAGINADO Y CANTIDAD */}
      <div className="d-flex justify-content-between align-items-center mb-3 px-1">
        <div className="d-flex align-items-center gap-3">
            <span className="badge bg-secondary py-2 px-3">
                Mostrando {votosPaginados.length} de {votosFiltrados.length} resultados
            </span>
            <div className="d-flex align-items-center gap-2">
                <span className="small text-secondary fw-bold text-uppercase" style={{fontSize:'0.65rem'}}>Ver:</span>
                <select 
                    className="form-select form-select-sm bg-dark text-white border-secondary py-0 shadow-none" 
                    style={{width: '70px', height: '28px'}}
                    value={itemsPorPagina}
                    onChange={(e) => {setItemsPorPagina(Number(e.target.value)); setPaginaActual(1)}}
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                </select>
            </div>
        </div>
        
        {/* NAVEGACIÓN DE PÁGINAS */}
        {totalPaginas > 1 && (
            <nav className="d-flex gap-2">
                <button 
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(paginaActual - 1)}
                    className="btn btn-sm btn-dark border-secondary"
                >
                    Anterior
                </button>
                <span className="btn btn-sm btn-outline-info disabled text-white border-0">
                    Página {paginaActual} de {totalPaginas}
                </span>
                <button 
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(paginaActual + 1)}
                    className="btn btn-sm btn-dark border-secondary"
                >
                    Siguiente
                </button>
            </nav>
        )}
      </div>

      <div className="table-responsive shadow-lg rounded border border-secondary">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead className="table-secondary text-dark text-uppercase small fw-bold">
            <tr>
              <th>Usuario / Juez</th>
              <th>País Votado</th>
              <th className="text-center">Suma Total</th>
              <th className="text-center">Promedio</th>
              <th className="text-end px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {votosPaginados.length > 0 ? votosPaginados.map(v => (
              <tr key={v.id}>
                <td className="fw-bold text-warning">{v.usuario}</td>
                <td>{v.pais}</td>
                <td className="text-center opacity-75">{v.totalPuntos} pts</td>
                <td className="text-center">
                    <span className="badge bg-info text-dark fw-bold">{v.promedio}</span>
                </td>
                <td className="text-end px-4">
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
                <td colSpan="5" className="text-center py-5 text-muted small text-uppercase">
                    No hay votos para mostrar.
                </td>
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
    <Suspense fallback={<div className="text-white text-center mt-5">Cargando interfaz...</div>}>
      <ABMVotosContenido />
    </Suspense>
  )
}