'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CategoriasPorEdicion() {
  const { id: idEdicion } = useParams()
  const router = useRouter()
  const [edicion, setEdicion] = useState(null)
  const [todasCategorias, setTodasCategorias] = useState([])
  const [activas, setActivas] = useState([]) // IDs de categorías activas para esta edición
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Info de la edición
      const { data: ed } = await supabase.from('ediciones').select('*').eq('id_edicion', idEdicion).single()
      setEdicion(ed)

      // Todas las categorías
      const { data: catGlob } = await supabase.from('categorias').select('*').order('id_categoria')
      setTodasCategorias(catGlob || [])

      // Categorías vinculadas a esta edición
      const { data: vinculadas } = await supabase.from('edicion_categorias').select('id_categoria').eq('id_edicion', idEdicion)
      setActivas((vinculadas || []).map(v => v.id_categoria))
      
      setLoading(false)
    }
    fetchData()
  }, [idEdicion])

  const toggleCategoria = async (idCategoria) => {
    const estaActiva = activas.includes(idCategoria)
    
    if (estaActiva) {
      // Quitarla de la edición
      await supabase.from('edicion_categorias').delete().match({ id_edicion: idEdicion, id_categoria: idCategoria })
      setActivas(activas.filter(id => id !== idCategoria))
    } else {
      // Agregarla a la edición
      await supabase.from('edicion_categorias').insert([{ id_edicion: idEdicion, id_categoria: idCategoria }])
      setActivas([...activas, idCategoria])
    }
  }

  if (loading) return <div className="container mt-5">Cargando...</div>

  return (
    <main className="container mt-5 max-w-2xl mx-auto">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-warning">Categorías de: {edicion?.tipo} {edicion?.anio}</h2>
        <button onClick={() => router.push('/admin')} className="btn btn-outline-light">Volver</button>
      </div>
      
      <p className="text-muted mb-4">Seleccioná qué categorías evaluarán los jueces en esta edición específica. Los cambios se guardan automáticamente.</p>

      <div className="list-group shadow">
        {todasCategorias.map(cat => {
          const isChecked = activas.includes(cat.id_categoria)
          return (
            <label key={cat.id_categoria} className={`list-group-item list-group-item-action d-flex align-items-center p-3 cursor-pointer ${isChecked ? 'bg-primary text-white border-primary' : 'bg-dark text-light border-secondary'}`}>
              <input 
                className="form-check-input me-3" 
                type="checkbox" 
                checked={isChecked}
                onChange={() => toggleCategoria(cat.id_categoria)}
                style={{ transform: 'scale(1.5)' }}
              />
              <div>
                <h5 className="mb-0 fw-bold">{cat.nombre}</h5>
                {cat.descripcion && <small className={isChecked ? 'text-white-50' : 'text-muted'}>{cat.descripcion}</small>}
              </div>
            </label>
          )
        })}
      </div>
    </main>
  )
}