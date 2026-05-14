'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMArtistas() {
  const [items, setItems] = useState([]); const [nombre, setNombre] = useState(''); const [editId, setEditId] = useState(null)

  const fetchItems = async () => {
    const { data } = await supabase.from('artistas').select('*').order('nombre')
    setItems(data || [])
  }
  useEffect(() => { fetchItems() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (editId) await supabase.from('artistas').update({ nombre }).eq('id_artista', editId)
    else await supabase.from('artistas').insert([{ nombre }])
    setNombre(''); setEditId(null); fetchItems()
  }

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between mb-4"><h3>Artistas</h3><Link href="/admin" className="btn btn-outline-light">Volver al panel de control</Link></div>
      <form onSubmit={save} className="card bg-dark p-3 mb-4 border-warning shadow">
        <input className="form-control mb-2" placeholder="Nombre del Artista" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <button className="btn btn-warning fw-bold">{editId ? 'Guardar' : 'Agregar'}</button>
      </form>
      <div className="list-group">
        {items.map(i => (
          <div key={i.id_artista} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between">
            {i.nombre}
            <div>
              <button onClick={() => {setEditId(i.id_artista); setNombre(i.nombre)}} className="btn btn-sm btn-info me-2">Editar</button>
              <button onClick={async () => { if(confirm('¿Borrar?')) { await supabase.from('artistas').delete().eq('id_artista', i.id_artista); fetchItems() }}} className="btn btn-sm btn-danger">Borrar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}