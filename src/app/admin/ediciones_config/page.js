'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMEdiciones() {
  const [items, setItems] = useState([]); 
  const [anio, setAnio] = useState(2026); 
  const [tipo, setTipo] = useState('Final'); 
  const [urlVideo, setUrlVideo] = useState('');
  const [fechaGala, setFechaGala] = useState('');
  const [paisHost, setPaisHost] = useState(''); // Nuevo estado para el país organizador
  const [editId, setEditId] = useState(null);

  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState({ anio: '', tipo: '' });

  const fetchItems = async () => {
    const { data } = await supabase.from('ediciones').select('*').order('anio', {ascending: false})
    setItems(data || [])
  }
  
  useEffect(() => { fetchItems() }, [])

  const formatearParaInput = (fechaISO) => {
    if (!fechaISO) return '';
    const d = new Date(fechaISO);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const save = async (e) => {
    e.preventDefault()
    
    let fechaGuardar = null;
    if (fechaGala) {
      fechaGuardar = new Date(fechaGala).toISOString();
    }

    // Incluimos pais_host en el envío de datos
    const payload = { anio, tipo, url_video: urlVideo, fecha_gala: fechaGuardar, pais_host: paisHost };
    
    if (editId) {
      await supabase.from('ediciones').update(payload).eq('id_edicion', editId)
    } else {
      await supabase.from('ediciones').insert([{ ...payload, votacion_abierta: false, edicion_lista: false }])
    }
    
    // Limpiamos todo el formulario
    setEditId(null); 
    setAnio(2026); 
    setTipo('Final'); 
    setUrlVideo('');
    setFechaGala('');
    setPaisHost('');
    fetchItems();
  }

  const editarItem = (i) => {
    setEditId(i.id_edicion);
    setAnio(i.anio);
    setTipo(i.tipo);
    setUrlVideo(i.url_video || '');
    setFechaGala(formatearParaInput(i.fecha_gala));
    setPaisHost(i.pais_host || ''); // Cargamos el valor al editar
  }

  const aniosUnicos = [...new Set(items.map(i => i.anio))].sort((a, b) => b - a);
  const tiposUnicos = [...new Set(items.map(i => i.tipo))].sort();

  const aplicarFiltros = () => {
    setFiltrosAplicados({ anio: filtroAnio, tipo: filtroTipo });
  };

  const limpiarFiltros = () => {
    setFiltroAnio('');
    setFiltroTipo('');
    setFiltrosAplicados({ anio: '', tipo: '' });
  };

  const itemsFiltrados = items.filter(i => {
    const matchAnio = filtrosAplicados.anio === '' || i.anio.toString() === filtrosAplicados.anio.toString();
    const matchTipo = filtrosAplicados.tipo === '' || i.tipo === filtrosAplicados.tipo;
    return matchAnio && matchTipo;
  });

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return <span className="text-muted small">-</span>;
    return new Date(fechaISO).toLocaleString('es-AR', { 
      dateStyle: 'short', 
      timeStyle: 'short' 
    });
  };

  return (
    <main className="container mt-5 max-w-4xl mx-auto font-sans">
      <div className="d-flex justify-content-between mb-4">
        <h3 className="text-white fw-bold">Configuración de Ediciones</h3>
        <Link href="/admin" className="btn btn-outline-light">Volver al panel</Link>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={save} className="card bg-dark p-4 mb-4 border-success shadow text-white" style={{ borderRadius: '15px' }}>
        <h6 className="text-success fw-bold mb-3">{editId ? '✏️ Editando Edición' : '➕ Nueva Edición'}</h6>
        <div className="row g-3">
          <div className="col-md-2">
            <label className="small text-secondary fw-bold">Año</label>
            <input type="number" className="form-control bg-black text-white border-secondary" value={anio} onChange={e => setAnio(e.target.value)} required />
          </div>
          <div className="col-md-2">
            <label className="small text-secondary fw-bold">Tipo</label>
            <select className="form-select bg-black text-white border-secondary" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="Semi 1">Semi 1</option>
              <option value="Semi 2">Semi 2</option>
              <option value="Final">Final</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="small text-secondary fw-bold">País Organizador (Host)</label>
            <input type="text" className="form-control bg-black text-white border-secondary" placeholder="Ej: Suecia, Italia..." value={paisHost} onChange={e => setPaisHost(e.target.value)} />
          </div>
          <div className="col-md-5">
            <label className="small text-secondary fw-bold">Fecha y Hora (Gala Local)</label>
            <input type="datetime-local" className="form-control bg-black text-white border-secondary shadow-none" value={fechaGala} onChange={e => setFechaGala(e.target.value)} />
          </div>
          <div className="col-md-12">
            <label className="small text-secondary fw-bold">URL del Video (YouTube)</label>
            <input type="url" className="form-control bg-black text-white border-secondary" placeholder="https://youtu.be/..." value={urlVideo} onChange={e => setUrlVideo(e.target.value)} />
          </div>
        </div>
        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-success fw-bold px-4">{editId ? 'Guardar Cambios 💾' : 'Crear Edición ✨'}</button>
          {editId && <button type="button" onClick={() => {setEditId(null); setUrlVideo(''); setFechaGala(''); setPaisHost('');}} className="btn btn-outline-secondary">Cancelar</button>}
        </div>
      </form>

      {/* FILTROS Y TABLA */}
      <div className="card bg-dark p-0 border-secondary shadow overflow-hidden" style={{ borderRadius: '15px' }}>
        
        <div className="bg-black p-3 border-bottom border-secondary d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="small text-secondary fw-bold mb-1">Filtrar por Año</label>
            <select className="form-select bg-dark text-white border-secondary shadow-none" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="">Todos los años</option>
              {aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="small text-secondary fw-bold mb-1">Filtrar por Tipo</label>
            <select className="form-select bg-dark text-white border-secondary shadow-none" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary fw-bold px-4" onClick={aplicarFiltros}>
              Filtrar
            </button>
            <button className="btn btn-outline-secondary text-nowrap" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead className="table-active text-secondary small text-uppercase">
              <tr>
                <th className="ps-4">Año</th>
                <th>Tipo</th>
                <th>Organizador (Host)</th>
                <th>Fecha de Gala</th>
                <th>Video</th>
                <th className="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.length > 0 ? itemsFiltrados.map(i => (
                <tr key={i.id_edicion}>
                  <td className="ps-4 fw-bold">{i.anio}</td>
                  <td>
                    <span className={`badge ${i.tipo === 'Final' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                      {i.tipo}
                    </span>
                  </td>
                  <td className="fw-bold text-light">
                    {i.pais_host ? `🗺️ ${i.pais_host}` : <span className="text-muted small font-normal">-</span>}
                  </td>
                  <td>
                    {formatearFecha(i.fecha_gala)}
                  </td>
                  <td>
                    {i.url_video ? (
                      <a href={i.url_video} target="_blank" rel="noopener noreferrer" className="text-danger fw-bold text-decoration-none small">
                        ▶ Ver video
                      </a>
                    ) : (
                      <span className="text-muted small">-</span>
                    )}
                  </td>
                  <td className="text-end pe-4 text-nowrap">
                    <button onClick={() => editarItem(i)} className="btn btn-sm btn-outline-info me-2">Editar</button>
                    <button onClick={async () => { 
                      if(confirm('⚠️ ¿Borrar? Se eliminarán todas las participaciones y votos de esta edición.')) { 
                        await supabase.from('ediciones').delete().eq('id_edicion', i.id_edicion); 
                        fetchItems() 
                      }
                    }} className="btn btn-sm btn-outline-danger">Borrar</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No se encontraron ediciones con ese filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}