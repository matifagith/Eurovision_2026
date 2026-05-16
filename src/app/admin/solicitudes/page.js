'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SolicitudesPage() {
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [procesandoId, setProcesandoId] = useState(null)
  const [procesandoMasivo, setProcesandoMasivo] = useState(false)

  // --- ESTADOS PARA NUEVOS FILTROS ---
  const [filtroTexto, setFiltroTexto] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('') // Guarda el término al dar "Filtrar"

  const cargarDatos = async () => {
    setLoading(true)
    
    // 1. Traer solo las pendientes para la cola de acción
    const { data: pendientes } = await supabase
      .from('solicitudes_cambio')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })
    setSolicitudesPendientes(pendientes || [])

    // 2. Traer aprobadas y denegadas para el historial (Muestra las últimas 20)
    const { data: pasadas } = await supabase
      .from('solicitudes_cambio')
      .select('*')
      .in('estado', ['aprobada', 'denegada', 'resuelta'])
      .order('created_at', { ascending: false })
      .limit(20)
    setHistorial(pasadas || [])

    setLoading(false)
  }

  useEffect(() => { cargarDatos() }, [])

  // --- MANEJADORES DE FILTROS ---
  const handleAplicarFiltro = (e) => {
    e.preventDefault()
    setBusquedaActiva(filtroTexto.trim().toLowerCase())
  }

  const handleBorrarFiltros = () => {
    setFiltroTexto('')
    setBusquedaActiva('')
  }

  // --- LÓGICA FILTRADORA REACTIVA ---
  const filtrarRegistros = (lista) => {
    if (!busquedaActiva) return lista
    return lista.filter(item => 
      item.nombre_usuario.toLowerCase().includes(busquedaActiva) || 
      item.correo_solicitud.toLowerCase().includes(busquedaActiva)
    )
  }

  const pendientesFiltradas = filtrarRegistros(solicitudesPendientes)
  const historialFiltrado = filtrarRegistros(historial)


  const generarPasswordHumano = () => {
    const palabras = ['Musica', 'Piano', 'Voto', 'Gala', 'Ritmo', 'Luces', 'Verde', 'Fuego', 'Microfono', 'Canto', 'Bailar', 'Show', 'Brillo', 'Estrella', 'Copa', 'Escenario']
    const p1 = palabras[Math.floor(Math.random() * palabras.length)]
    const p2 = palabras[Math.floor(Math.random() * palabras.length)]
    const p3 = palabras[Math.floor(Math.random() * palabras.length)]
    const num = Math.floor(Math.random() * 90) + 10 
    return `${p1}-${p2}-${p3}-${num}`
  }

  const handleAprobar = async (sol) => {
    if (!confirm(`¿Restablecer contraseña de ${sol.nombre_usuario} y enviar mail automático?`)) return
    setProcesandoId(sol.id)
    const claveNueva = generarPasswordHumano()

    try {
      const res = await fetch('/api/restablecer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: sol.id_usuario,
          nombre_usuario: sol.nombre_usuario,
          nueva_contrasena: claveNueva,
          email_destino: sol.correo_solicitud
        })
      })
      const resultado = await res.json()

      if (resultado.success) {
        await supabase.from('solicitudes_cambio').update({ estado: 'aprobada' }).eq('id', sol.id)
        alert(`✅ Contraseña enviada con éxito a ${sol.correo_solicitud}`)
        cargarDatos()
      } else {
        alert('❌ Error al enviar el mail: ' + resultado.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcesandoId(null)
    }
  }

  const handleDenegar = async (sol) => {
    if (!confirm(`¿Estás seguro de DENEGAR la solicitud de ${sol.nombre_usuario}? Se archivará sin realizar cambios.`)) return
    setProcesandoId(sol.id)
    
    try {
      const { error } = await supabase
        .from('solicitudes_cambio')
        .update({ estado: 'denegada' })
        .eq('id', sol.id)

      if (error) throw error
      cargarDatos()
    } catch (e) {
      console.error(e)
      alert('Error al denegar la solicitud')
    } finally {
      setProcesandoId(null)
    }
  }

  const handleBlanqueoMasivo = async () => {
    if (!confirm(`⚠️ Vas a procesar y enviar correos a las ${solicitudesPendientes.length} solicitudes juntas. ¿Proceder?`)) return
    setProcesandoMasivo(true)

    await Promise.all(solicitudesPendientes.map(sol => {
      const claveNueva = generarPasswordHumano()
      return fetch('/api/restablecer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: sol.id_usuario,
          nombre_usuario: sol.nombre_usuario,
          nueva_contrasena: claveNueva,
          email_destino: sol.correo_solicitud
        })
      }).then(res => res.json()).then(async (resJson) => {
        if (resJson.success) {
          await supabase.from('solicitudes_cambio').update({ estado: 'aprobada' }).eq('id', sol.id)
        }
      }).catch(e => console.error(e))
    }))

    alert('💥 Lote masivo procesado correctamente.')
    cargarDatos()
    setProcesandoMasivo(false)
  }

  return (
    <main className="container mt-5 max-w-4xl mx-auto text-white font-sans pb-5">
      
      {/* CABECERA */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 fw-bold m-0 text-warning">Solicitudes de Contraseña 🔑</h1>
          <p className="text-muted small m-0 mt-1">Panel administrativo de gestión y auditoría de accesos.</p>
        </div>
        <div className="d-flex gap-2">
          {solicitudesPendientes.length > 1 && (
            <button 
              onClick={handleBlanqueoMasivo}
              disabled={procesandoMasivo || loading}
              className="btn btn-danger fw-bold px-4 rounded-pill shadow"
            >
              {procesandoMasivo ? 'Procesando lote...' : '💥 Resolver Todo en Lote'}
            </button>
          )}
          <Link href="/admin" className="btn btn-outline-light rounded-pill px-3">Volver al panel</Link>
        </div>
      </div>

      {/* --- NUEVA BARRA DE FILTROS --- */}
      <form onSubmit={handleAplicarFiltro} className="card bg-dark border-secondary p-3 mb-5 rounded-4 shadow-sm">
        <div className="row g-2 align-items-center">
          <div className="col-md-7">
            <input 
              type="text" 
              className="form-control bg-black text-white border-secondary shadow-none"
              placeholder="Buscar por nombre de usuario o correo..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>
          <div className="col-md-5 d-flex gap-2">
            <button type="submit" className="btn btn-info fw-bold w-100 text-dark">
              Filtrar 🔍
            </button>
            {(busquedaActiva || filtroTexto) && (
              <button type="button" onClick={handleBorrarFiltros} className="btn btn-outline-secondary fw-bold w-100">
                Borrar X
              </button>
            )}
          </div>
        </div>
        {busquedaActiva && (
          <div className="mt-2 ps-1">
            <span className="badge bg-secondary text-white small">
              Resultados para: "{busquedaActiva}"
            </span>
          </div>
        )}
      </form>

      {loading ? (
        <div className="text-center py-5 opacity-50">Cargando datos del servidor...</div>
      ) : (
        <>
          {/* --- SECCIÓN 1: SOLICITUDES PENDIENTES --- */}
          <div className="mb-5">
            <h5 className="text-uppercase small fw-bold tracking-wider text-secondary mb-3" style={{ letterSpacing: '1px' }}>
              Cola de atención ({pendientesFiltradas.length})
            </h5>

            {pendientesFiltradas.length === 0 ? (
              <div className="alert bg-dark text-muted text-center border-secondary py-4 rounded-4 shadow-sm m-0">
                <span className="ps-4 py-2 text-secondary fw-bold">
                  {busquedaActiva ? 'No se encontraron solicitudes pendientes con ese criterio.' : '🎉 ¡Bandeja de entrada limpia! No hay solicitudes pendientes.'}
                </span>
              </div>
            ) : (
              <div className="card bg-dark border-secondary shadow-lg overflow-hidden rounded-4">
                <div className="table-responsive">
                  <table className="table table-dark table-hover align-middle m-0">
                    <thead className="table-light text-dark">
                      <tr>
                        <th className="ps-4 py-3 text-uppercase small tracking-wider">Usuario</th>
                        <th className="py-3 text-uppercase small tracking-wider">Correo Vinculado</th>
                        <th className="py-3 text-uppercase small tracking-wider">Fecha Recibido</th>
                        <th className="pe-4 py-3 text-end text-uppercase small tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendientesFiltradas.map((sol) => (
                        <tr key={sol.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td className="ps-4 fw-bold text-white fs-5">{sol.nombre_usuario}</td>
                          <td className="text-info font-monospace">{sol.correo_solicitud}</td>
                          <td className="text-secondary small">
                            {new Date(sol.created_at).toLocaleDateString('es-AR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })} hs
                          </td>
                          <td className="pe-4 text-end">
                            <div className="d-inline-flex gap-2">
                              <button
                                onClick={() => handleAprobar(sol)}
                                disabled={procesandoId !== null || procesandoMasivo}
                                className="btn btn-success btn-sm fw-bold px-3 rounded-pill"
                              >
                                {procesandoId === sol.id ? '...' : 'Aprobar Blanqueo ✉️'}
                              </button>
                              <button
                                onClick={() => handleDenegar(sol)}
                                disabled={procesandoId !== null || procesandoMasivo}
                                className="btn btn-outline-danger btn-sm fw-bold px-3 rounded-pill"
                              >
                                Denegar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* --- SECCIÓN 2: HISTORIAL DE CAMBIOS ARCHIVADOS --- */}
          <div>
            <h5 className="text-uppercase small fw-bold tracking-wider text-secondary mb-3" style={{ letterSpacing: '1px' }}>
              Historial de movimientos recientes ({historialFiltrado.length})
            </h5>

            {historialFiltrado.length === 0 ? (
              <p className="text-muted small ps-2">
                {busquedaActiva ? 'No se encontraron registros históricos con ese criterio.' : 'No se registran movimientos archivados en el sistema todavía.'}
              </p>
            ) : (
              <div className="card bg-dark border-secondary shadow rounded-4 overflow-hidden opacity-75">
                <div className="table-responsive">
                  <table className="table table-dark table-sm align-middle m-0" style={{ fontSize: '0.9rem' }}>
                    <thead className="text-secondary" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <tr>
                        <th className="ps-4 py-2">Usuario</th>
                        <th className="py-2">Correo Destino</th>
                        <th className="py-2">Fecha Procesado</th>
                        <th className="pe-4 py-2 text-end">Resolución</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialFiltrado.map((hist) => (
                        <tr key={hist.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td className="ps-4 py-2 text-secondary fw-bold">{hist.nombre_usuario}</td>
                          <td className="ps-4 py-2 text-secondary fw-bold">{hist.correo_solicitud}</td>
                          <td className="ps-4 py-2 text-secondary fw-bold">
                            {new Date(hist.created_at).toLocaleDateString('es-AR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })} hs
                          </td>
                          <td className="pe-4 py-2 text-end">
                            {hist.estado === 'aprobada' || hist.estado === 'resuelta' ? (
                              <span className="badge bg-success-subtle text-success border border-success rounded-pill px-2 py-1 small">APROBADA</span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border border-danger rounded-pill px-2 py-1 small">DENEGADA</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}