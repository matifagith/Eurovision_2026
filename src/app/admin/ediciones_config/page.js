'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMEdiciones() {
  const [items, setItems] = useState([]); const [anio, setAnio] = useState(2026); const [tipo, setTipo] = useState('Final'); const [editId, setEditId] = useState(null)

  const fetchItems = async () => {
    const { data } = await supabase.from('ediciones').select('*').order('anio', {ascending: false})
    setItems(data || [])
  }
  useEffect(() => { fetchItems() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (editId) await supabase.from('ediciones').update({ anio, tipo }).eq('id_edicion', editId)
    else await supabase.from('ediciones').insert([{ anio, tipo, votacion_abierta: false }])
    setEditId(null); fetchItems()
  }

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between mb-4"><h3>Configuración de Ediciones</h3><Link href="/admin" className="btn btn-sm btn-outline-light">Volver</Link></div>
      <form onSubmit={save} className="card bg-dark p-3 mb-4 border-success shadow text-white">
        <div className="row g-2">
          <div className="col-6"><label className="small">Año</label><input type="number" className="form-control" value={anio} onChange={e => setAnio(e.target.value)} /></div>
          <div className="col-6"><label className="small">Tipo</label>
            <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="Semi 1">Semi 1</option>
              <option value="Semi 2">Semi 2</option>
              <option value="Final">Final</option>
            </select>
          </div>
        </div>
        <button className="btn btn-success fw-bold mt-3">{editId ? 'Guardar' : 'Crear Nueva Edición'}</button>
      </form>
      <div className="list-group">
        {items.map(i => (
          <div key={i.id_edicion} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between">
            {i.tipo} {i.anio}
            <div>
              <button onClick={() => {setEditId(i.id_edicion); setAnio(i.anio); setTipo(i.tipo)}} className="btn btn-sm btn-info me-2">Editar</button>
              <button onClick={async () => { if(confirm('⚠️ ¿Borrar? Se eliminarán todas las participaciones y votos de esta edición.')) { await supabase.from('ediciones').delete().eq('id_edicion', i.id_edicion); fetchItems() }}} className="btn btn-sm btn-danger">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}