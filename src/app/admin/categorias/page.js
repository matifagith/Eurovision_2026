'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMCategorias() {
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCategorias = async () => {
    setLoading(true)
    const { data } = await supabase.from('categorias').select('*').order('id_categoria', { ascending: true })
    setCategorias(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCategorias() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editandoId) {
      await supabase.from('categorias').update({ nombre, descripcion }).eq('id_categoria', editandoId)
    } else {
      await supabase.from('categorias').insert([{ nombre, descripcion }])
    }
    setNombre(''); setDescripcion(''); setEditandoId(null); fetchCategorias()
  }

  const handleDelete = async (id) => {
    if (!confirm('⚠️ ¡ATENCIÓN! Si borrás esta categoría se eliminarán TODOS LOS VOTOS históricos asociados a la misma. ¿Estás seguro?')) return
    await supabase.from('categorias').delete().eq('id_categoria', id)
    fetchCategorias()
  }

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between mb-4">
        <h1 className="h3 fw-bold">Gestión de Categorías Globales</h1>
        <Link href="/admin" className="btn btn-outline-light">Volver al panel de control</Link>
      </div>

      <form onSubmit={handleSubmit} className="card bg-dark text-light p-4 mb-5 shadow border-primary">
        <h5 className="mb-3 text-warning">{editandoId ? 'Editando Categoría' : 'Nueva Categoría'}</h5>
        <input type="text" className="form-control mb-2" placeholder="Nombre (Ej: Performance)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input type="text" className="form-control mb-3" placeholder="Descripción breve" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary fw-bold">{editandoId ? 'Guardar Cambios' : 'Agregar'}</button>
          {editandoId && <button type="button" className="btn btn-secondary" onClick={() => { setEditandoId(null); setNombre(''); }}>Cancelar</button>}
        </div>
      </form>

      <ul className="list-group shadow">
        {categorias.map(cat => (
          <li key={cat.id_categoria} className="list-group-item bg-dark text-light border-secondary d-flex justify-content-between align-items-center p-3">
            <div>
              <strong className="text-warning">{cat.nombre}</strong> <br/>
              <small className="text-muted">{cat.descripcion}</small>
            </div>
            <div>
              <button onClick={() => {setEditandoId(cat.id_categoria); setNombre(cat.nombre); setDescripcion(cat.descripcion||'')}} className="btn btn-sm btn-info me-2">Editar</button>
              <button onClick={() => handleDelete(cat.id_categoria)} className="btn btn-sm btn-danger">Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}