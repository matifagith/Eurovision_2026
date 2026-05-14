'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMPaises() {
  const [items, setItems] = useState([])
  const [nombre, setNombre] = useState('')
  const [editId, setEditId] = useState(null)

  const fetchItems = async () => {
    const { data } = await supabase.from('paises').select('*').order('nombre')
    setItems(data || [])
  }
  
  useEffect(() => { fetchItems() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('paises').update({ nombre }).eq('id_pais', editId)
    } else {
      await supabase.from('paises').insert([{ nombre }])
    }
    setNombre('')
    setEditId(null)
    fetchItems()
  }

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between mb-4">
        <h3>Países</h3>
        <Link href="/admin" className="btn btn-outline-light">Volver al panel de control</Link>
      </div>
      
      <form onSubmit={save} className="card bg-dark p-3 mb-4 border-danger shadow">
        <input 
          className="form-control mb-2" 
          placeholder="Nombre del País (Ej: España)" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
        />
        <button className="btn btn-danger fw-bold">{editId ? 'Guardar Cambios' : 'Agregar País'}</button>
      </form>
      
      <div className="list-group">
        {items.map(i => (
          <div key={i.id_pais} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
            <span className="fw-bold">{i.nombre}</span>
            <div>
              <button 
                onClick={() => { setEditId(i.id_pais); setNombre(i.nombre) }} 
                className="btn btn-sm btn-info me-2"
              >
                Editar
              </button>
              <button 
                onClick={async () => { 
                  if(confirm('⚠️ ¿Borrar este país? Se eliminarán todas sus participaciones y votos asociados en la base de datos.')) { 
                    await supabase.from('paises').delete().eq('id_pais', i.id_pais); 
                    fetchItems() 
                  }
                }} 
                className="btn btn-sm btn-danger"
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}