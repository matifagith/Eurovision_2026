'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ParticipacionesPage() {
  const [participaciones, setParticipaciones] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ediciones, setEdiciones] = useState([]);
  const [filtros, setFiltros] = useState({ id_edicion: 'Todos', busqueda: '' });
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'orden_salida', direction: 'asc' });
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    id_edicion: '', id_pais: '', nombre_cancion: '', nombres_artistas: '',
    clasifico: false, puesto_oficial: '', puntos_oficiales: '', orden_salida: ''
  });

  const [sugerenciasCancion, setSugerenciasCancion] = useState([]);
  const [sugerenciasArtista, setSugerenciasArtista] = useState([]);

  useEffect(() => {
    cargarDatosFiltros();
    fetchParticipaciones();
  }, []);

  const cargarDatosFiltros = async () => {
    const { data: dataPaises } = await supabase.from('paises').select('*').order('nombre');
    if (dataPaises) setPaises(dataPaises);
    const { data: dataEdiciones } = await supabase.from('ediciones').select('*').order('anio', { ascending: false });
    if (dataEdiciones) {
      setEdiciones(dataEdiciones);
      if (!formData.id_edicion && dataEdiciones.length > 0) {
        setFormData(prev => ({ ...prev, id_edicion: dataEdiciones[0].id_edicion }));
      }
    }
  };

  const fetchParticipaciones = async (filtrosActivos = filtros) => {
    let query = supabase
      .from('participaciones')
      .select(`
        id_participacion, id_edicion, id_pais, id_cancion, clasifico, puesto_oficial, puntos_oficiales, orden_salida,
        paises ( nombre ), canciones ( nombre ),
        ediciones!inner ( anio, tipo ),
        participacion_artista ( artistas ( nombre ) )
      `);

    if (filtrosActivos.id_edicion !== 'Todos') {
      query = query.eq('id_edicion', filtrosActivos.id_edicion);
    }

    const { data, error } = await query;
    if (!error) {
      let dataFiltrada = data;
      if (filtrosActivos.busqueda) {
        const bus = filtrosActivos.busqueda.toLowerCase();
        dataFiltrada = data.filter(p => 
          p.canciones?.nombre?.toLowerCase().includes(bus) ||
          p.paises?.nombre?.toLowerCase().includes(bus) ||
          p.participacion_artista.some(pa => pa.artistas?.nombre?.toLowerCase().includes(bus))
        );
      }
      setParticipaciones(dataFiltrada || []);
    }
  };

  const actualizarOrdenRapido = async (id, nuevoOrden) => {
    const valor = parseInt(nuevoOrden) || 0;
    await supabase.from('participaciones').update({ orden_salida: valor }).eq('id_participacion', id);
    fetchParticipaciones();
  };

  const solicitarSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="opacity-25 ms-1">↕️</span>;
    return sortConfig.direction === 'asc' ? <span className="ms-1">🔼</span> : <span className="ms-1">🔽</span>;
  };

  const participacionesOrdenadas = [...participaciones].sort((a, b) => {
    let valA, valB;
    if (sortConfig.key === 'pais') {
      valA = a.paises?.nombre?.toLowerCase() || '';
      valB = b.paises?.nombre?.toLowerCase() || '';
    } else if (sortConfig.key === 'anio') {
      valA = a.ediciones?.anio || 0;
      valB = b.ediciones?.anio || 0;
    } else {
      valA = a[sortConfig.key] || 0;
      valB = b[sortConfig.key] || 0;
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const abrirEdicion = (part) => {
    setEditId(part.id_participacion);
    setFormData({
      id_edicion: part.id_edicion, id_pais: part.id_pais,
      nombre_cancion: part.canciones?.nombre || '',
      nombres_artistas: part.participacion_artista.map(pa => pa.artistas?.nombre).join(', '),
      clasifico: part.clasifico || false,
      puesto_oficial: part.puesto_oficial || '', 
      puntos_oficiales: part.puntos_oficiales || '',
      orden_salida: part.orden_salida || ''
    });
    setModalAbierto(true);
  };

  const manejarCambioCancion = async (texto) => {
    setFormData({ ...formData, nombre_cancion: texto });
    if (texto.trim().length < 2) return setSugerenciasCancion([]);
    const { data } = await supabase.from('canciones').select('nombre').ilike('nombre', `%${texto}%`).limit(5);
    setSugerenciasCancion(data || []);
  };

  const manejarCambioArtista = async (texto) => {
    setFormData({ ...formData, nombres_artistas: texto });
    const partes = texto.split(',');
    const ultima = partes[partes.length - 1].trim();
    if (ultima.length < 2) return setSugerenciasArtista([]);
    const { data } = await supabase.from('artistas').select('nombre').ilike('nombre', `%${ultima}%`).limit(5);
    setSugerenciasArtista(data || []);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      let cancionId;
      const { data: cancionExistente } = await supabase.from('canciones').select('id_cancion').ilike('nombre', formData.nombre_cancion.trim()).single();
      if (cancionExistente) cancionId = cancionExistente.id_cancion;
      else {
        const { data: nuevaCancion } = await supabase.from('canciones').insert([{ nombre: formData.nombre_cancion.trim() }]).select().single();
        cancionId = nuevaCancion.id_cancion;
      }
      let partId = editId;
      const payload = {
        id_edicion: formData.id_edicion, id_pais: formData.id_pais, id_cancion: cancionId,
        clasifico: formData.clasifico,
        puesto_oficial: formData.puesto_oficial === '' ? null : parseInt(formData.puesto_oficial),
        puntos_oficiales: formData.puntos_oficiales === '' ? null : parseInt(formData.puntos_oficiales),
        orden_salida: formData.orden_salida === '' ? 0 : parseInt(formData.orden_salida)
      };
      if (editId) {
        await supabase.from('participaciones').update(payload).eq('id_participacion', editId);
        await supabase.from('participacion_artista').delete().eq('id_participacion', editId);
      } else {
        const { data: nuevaPart } = await supabase.from('participaciones').insert([payload]).select().single();
        partId = nuevaPart.id_participacion;
      }
      const artistasNombres = formData.nombres_artistas.split(',').map(n => n.trim()).filter(n => n);
      for (const nombre of artistasNombres) {
        let artistaId;
        const { data: artExistente } = await supabase.from('artistas').select('id_artista').ilike('nombre', nombre).single();
        if (artExistente) artistaId = artExistente.id_artista;
        else {
          const { data: nuevoArt } = await supabase.from('artistas').insert([{ nombre }]).select().single();
          artistaId = nuevoArt.id_artista;
        }
        await supabase.from('participacion_artista').insert([{ id_participacion: partId, id_artista: artistaId }]);
      }
      setModalAbierto(false); setEditId(null); fetchParticipaciones();
    } catch (error) { alert("Error al guardar."); } finally { setCargando(false); }
  };

  const participacionesActuales = participacionesOrdenadas.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);
  const totalPaginas = Math.ceil(participaciones.length / itemsPorPagina);

  return (
    <main className="container mt-5 mb-5 font-sans text-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="display-6 fw-bold text-uppercase">Participaciones 🎤</h2>
        <div>
          <button onClick={() => {setEditId(null); setModalAbierto(true)}} className="btn btn-primary fw-bold me-2 shadow-sm">Nueva ➕</button>
          <Link href="/admin" className="btn btn-outline-light fw-bold shadow-sm">Volver al panel de control</Link>
        </div>
      </div>

      <div className="card bg-dark p-3 mb-4 border-secondary shadow">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-bold text-uppercase text-white">Edición</label>
            <select className="form-select bg-dark text-white border-secondary shadow-sm" value={filtros.id_edicion} onChange={(e) => setFiltros({...filtros, id_edicion: e.target.value})}>
              <option value="Todos">Todas</option>
              {ediciones.map(ed => <option key={ed.id_edicion} value={ed.id_edicion}>{ed.anio} - {ed.tipo}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label small fw-bold text-uppercase text-white">Buscar</label>
            <input type="text" className="form-control bg-dark text-white border-secondary shadow-sm" value={filtros.busqueda} onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})} placeholder="🔍 País, canción o artista..." />
          </div>
          <div className="col-md-3 d-flex flex-column gap-2">
  {/* Texto del total arriba */}
  <div className="small fw-bold text-uppercase text-white opacity-75 text-end" style={{ letterSpacing: '1px' }}>
    Total de registros = <span className="text-warning">{participaciones.length}</span>
  </div>
  
  {/* Contenedor de botones abajo */}
  <div className="d-flex gap-2">
    <button onClick={() => fetchParticipaciones()} className="btn btn-primary fw-bold flex-grow-1 shadow-sm">
      Filtrar
    </button>
    <button 
      onClick={() => {
        setFiltros({id_edicion:'Todos', busqueda:''}); 
        fetchParticipaciones({id_edicion:'Todos', busqueda:''});
      }} 
      className="btn btn-outline-secondary fw-bold flex-grow-1 text-light shadow-sm"
    >
      Borrar filtros
    </button>
  </div>
</div>
        </div>
      </div>

      <div className="table-responsive rounded border border-secondary shadow">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead className="table-secondary text-dark text-uppercase small fw-bold">
            <tr>
              <th onClick={() => solicitarSort('orden_salida')} style={{cursor:'pointer', userSelect:'none'}}>Orden {getSortIcon('orden_salida')}</th>
              <th>Edición</th>
              <th onClick={() => solicitarSort('pais')} style={{cursor:'pointer', userSelect:'none'}}>País {getSortIcon('pais')}</th>
              <th>Canción & Artista(s)</th>
              <th className="text-center">Estado</th>
              <th onClick={() => solicitarSort('puesto_oficial')} className="text-center" style={{cursor:'pointer', userSelect:'none'}}>Puesto {getSortIcon('puesto_oficial')}</th>
              <th onClick={() => solicitarSort('puntos_oficiales')} className="text-center" style={{cursor:'pointer', userSelect:'none'}}>Puntos {getSortIcon('puntos_oficiales')}</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participacionesActuales.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-4 opacity-50">No se encontraron resultados</td></tr>
            ) : (
              participacionesActuales.map((part) => (
                <tr key={part.id_participacion}>
                  <td className="fw-bold text-white">{part.orden_salida}</td>
                  <td className="small">
                    <div className="fw-bold text-white">{part.ediciones?.anio}</div>
                    <div className="opacity-75">{part.ediciones?.tipo}</div>
                  </td>
                  <td className="fw-bold text-warning">{part.paises?.nombre}</td>
                  <td>
                    <div className="fw-bold text-white">{part.canciones?.nombre}</div>
                    <div className="small opacity-75">{part.participacion_artista.map(pa => pa.artistas?.nombre).join(', ')}</div>
                  </td>
                  <td className="text-center">
                    <span className={`badge ${part.clasifico ? 'bg-success' : 'bg-secondary'}`}>
                      {part.clasifico ? 'Clasificado 🟢' : 'Pendiente ⚪'}
                    </span>
                  </td>
                  <td className="text-center fw-bold text-info">{part.puesto_oficial || '-'}</td>
                  <td className="text-center text-info">{part.puntos_oficiales || '-'}</td>
                  <td className="text-end text-nowrap">
                    <button onClick={() => abrirEdicion(part)} className="btn btn-sm btn-info me-2 fw-bold text-white shadow-sm">✏️ Editar</button>
                    <button onClick={async () => { if(confirm('¿Borrar?')) { await supabase.from('participaciones').delete().eq('id_participacion', part.id_participacion); fetchParticipaciones() }}} className="btn btn-sm btn-danger fw-bold text-white shadow-sm">🗑️ Borrar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2 text-white">
          <span className="small fw-bold opacity-75 text-uppercase">Mostrar:</span>
          <select className="form-select form-select-sm bg-dark text-white border-secondary" style={{width: 'auto'}} value={itemsPorPagina} onChange={(e) => {setItemsPorPagina(parseInt(e.target.value)); setPaginaActual(1);}}>
            <option value="10">10</option><option value="20">20</option><option value="50">50</option>
          </select>
        </div>

        {totalPaginas > 1 && (
          <nav>
            <ul className="pagination pagination-sm m-0 shadow-sm">
              <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}><button className="page-link bg-dark text-white border-secondary" onClick={() => setPaginaActual(paginaActual - 1)}>Anterior</button></li>
              {[...Array(totalPaginas)].map((_, i) => (
                <li key={i} className={`page-item ${paginaActual === i + 1 ? 'active' : ''}`}>
                  <button className={`page-link ${paginaActual === i + 1 ? 'bg-primary border-primary text-white' : 'bg-dark text-white border-secondary'}`} onClick={() => setPaginaActual(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}><button className="page-link bg-dark text-white border-secondary" onClick={() => setPaginaActual(paginaActual + 1)}>Siguiente</button></li>
            </ul>
          </nav>
        )}
      </div>

      {modalAbierto && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1050 }}>
          <div className="card bg-dark border-light shadow-lg w-100 m-3" style={{ maxWidth: '600px' }}>
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold">{editId ? 'Editar Participación' : 'Nueva Participación'}</h4>
              <button onClick={() => setModalAbierto(false)} className="btn btn-sm btn-outline-light border-0 fs-5">❌</button>
            </div>
            <div className="card-body p-4 text-white">
              <form onSubmit={manejarSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-white text-uppercase">Edición</label>
                    <select required className="form-select bg-dark text-white border-secondary shadow-sm" value={formData.id_edicion} onChange={(e) => setFormData({...formData, id_edicion: e.target.value})}>
                      {ediciones.map(ed => <option key={ed.id_edicion} value={ed.id_edicion}>{ed.anio} - {ed.tipo}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-white text-uppercase">País</label>
                    <select required className="form-select bg-dark text-white border-secondary shadow-sm" value={formData.id_pais} onChange={(e) => setFormData({...formData, id_pais: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mb-3 position-relative">
                  <label className="form-label small fw-bold text-white text-uppercase">Canción</label>
                  <input type="text" required className="form-control bg-dark text-white border-secondary" value={formData.nombre_cancion} onChange={(e) => manejarCambioCancion(e.target.value)} onBlur={() => setTimeout(() => setSugerenciasCancion([]), 200)} />
                  {sugerenciasCancion.length > 0 && (
                    <ul className="list-group position-absolute w-100 mt-1 shadow" style={{ zIndex: 1100 }}>
                      {sugerenciasCancion.map(c => <li key={c.nombre} className="list-group-item list-group-item-action bg-secondary text-white border-dark" onClick={() => setFormData({...formData, nombre_cancion: c.nombre})}>{c.nombre}</li>)}
                    </ul>
                  )}
                </div>
                <div className="mb-3 position-relative">
                  <label className="form-label small fw-bold text-white text-uppercase">Artista(s)</label>
                  <input type="text" required className="form-control bg-dark text-white border-secondary" value={formData.nombres_artistas} onChange={(e) => manejarCambioArtista(e.target.value)} onBlur={() => setTimeout(() => setSugerenciasArtista([]), 200)} />
                  {sugerenciasArtista.length > 0 && (
                    <ul className="list-group position-absolute w-100 mt-1 shadow" style={{ zIndex: 1100 }}>
                      {sugerenciasArtista.map(a => <li key={a.nombre} className="list-group-item list-group-item-action bg-secondary text-white border-dark" onClick={() => {
                        const partes = formData.nombres_artistas.split(',');
                        partes[partes.length - 1] = ' ' + a.nombre;
                        setFormData({...formData, nombres_artistas: partes.join(',').trim()});
                      }}>{a.nombre}</li>)}
                    </ul>
                  )}
                </div>
                <hr className="border-secondary my-4" />
                <div className="row g-3 mb-4">
                  <div className="col-md-3 d-flex align-items-center">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="clasificoCheck" checked={formData.clasifico} onChange={(e) => setFormData({...formData, clasifico: e.target.checked})} />
                      <label className="form-check-label fw-bold" htmlFor="clasificoCheck">Clasificó</label>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-warning text-uppercase">ORDEN</label>
                    <input type="number" className="form-control bg-dark text-white border-secondary fw-bold" value={formData.orden_salida} onChange={(e) => setFormData({...formData, orden_salida: e.target.value})} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-info text-uppercase">PUESTO</label>
                    <input type="number" className="form-control bg-dark text-white border-secondary" value={formData.puesto_oficial} onChange={(e) => setFormData({...formData, puesto_oficial: e.target.value})} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-info text-uppercase">PUNTOS</label>
                    <input type="number" className="form-control bg-dark text-white border-secondary" value={formData.puntos_oficiales} onChange={(e) => setFormData({...formData, puntos_oficiales: e.target.value})} />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-outline-light fw-bold">Cancelar</button>
                  <button type="submit" className="btn btn-warning fw-bold text-dark shadow-sm" disabled={cargando}>{cargando ? 'Guardando...' : 'Guardar Cambios 💾'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}