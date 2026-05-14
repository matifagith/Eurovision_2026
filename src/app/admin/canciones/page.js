'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMCanciones() {
  const [items, setItems] = useState([]); const [nombre, setNombre] = useState(''); const [editId, setEditId] = useState(null)

  const fetchItems = async () => {
    const { data } = await supabase.from('canciones').select('*').order('nombre')
    setItems(data || [])
  }
  useEffect(() => { fetchItems() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (editId) await supabase.from('canciones').update({ nombre }).eq('id_cancion', editId)
    else await supabase.from('canciones').insert([{ nombre }])
    setNombre(''); setEditId(null); fetchItems()
  }

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between mb-4"><h3>Canciones</h3><Link href="/admin" className="btn btn-sm btn-outline-light">Volver</Link></div>
      <form onSubmit={save} className="card bg-dark p-3 mb-4 border-light shadow">
        <input className="form-control mb-2" placeholder="Nombre de la canción" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <button className="btn btn-light fw-bold">{editId ? 'Guardar' : 'Agregar'}</button>
      </form>
      <div className="list-group">
        {items.map(i => (
          <div key={i.id_cancion} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between">
            {i.nombre}
            <div>
              <button onClick={() => {setEditId(i.id_cancion); setNombre(i.nombre)}} className="btn btn-sm btn-info me-2">Editar</button>
              <button onClick={async () => { if(confirm('¿Borrar?')) { await supabase.from('canciones').delete().eq('id_cancion', i.id_cancion); fetchItems() }}} className="btn btn-sm btn-danger">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}