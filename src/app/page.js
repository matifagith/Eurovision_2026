'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CrudTest() {
  const [categorias, setCategorias] = useState([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [loading, setLoading] = useState(true)

  // GET: Leer datos al cargar la página
  const fetchCategorias = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('id_categoria', { ascending: true })
    
    if (error) console.error("Error cargando:", error)
    else setCategorias(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  // POST & EDIT: Crear o Actualizar
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editandoId) {
      // MODO EDITAR
      const { error } = await supabase
        .from('categorias')
        .update({ nombre, descripcion })
        .eq('id_categoria', editandoId)
        
      if (error) alert('Error al editar')
    } else {
      // MODO CREAR
      const { error } = await supabase
        .from('categorias')
        .insert([{ nombre, descripcion }])
        
      if (error) alert('Error al crear')
    }

    // Limpiar formulario y recargar
    setNombre('')
    setDescripcion('')
    setEditandoId(null)
    fetchCategorias()
  }

  // DELETE: Borrar registro
  const handleDelete = async (id) => {
    if (!confirm('¿Seguro que querés borrar esta categoría?')) return

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id_categoria', id)
      
    if (error) alert('Error al borrar')
    else fetchCategorias()
  }

  // Preparar formulario para editar
  const iniciarEdicion = (cat) => {
    setEditandoId(cat.id_categoria)
    setNombre(cat.nombre)
    setDescripcion(cat.descripcion)
  }

  return (
    <main className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Testing CRUD - Categorías</h1>
      
      {/* Formulario (POST / EDIT) */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          {editandoId ? 'Editando Categoría' : 'Nueva Categoría'}
        </h2>
        <div className="flex flex-col gap-3">
          <input 
            type="text" 
            placeholder="Nombre de la categoría" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="p-2 border rounded"
          />
          <input 
            type="text" 
            placeholder="Descripción" 
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="p-2 border rounded"
          />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {editandoId ? 'Guardar Cambios' : 'Agregar'}
            </button>
            {editandoId && (
              <button 
                type="button" 
                onClick={() => { setEditandoId(null); setNombre(''); setDescripcion(''); }} 
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Lista de Registros (GET / DELETE) */}
      <h2 className="text-2xl font-bold mb-4">Registros Actuales</h2>
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {categorias.map(cat => (
            <li key={cat.id_categoria} className="flex justify-between items-center p-3 border rounded bg-white shadow-sm">
              <div>
                <span className="font-bold">{cat.nombre}</span>
                <p className="text-sm text-gray-600">{cat.descripcion}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => iniciarEdicion(cat)} 
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(cat.id_categoria)} 
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}