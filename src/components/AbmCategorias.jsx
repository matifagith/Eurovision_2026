'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AbmCategorias({ onUpdate }) {
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategorias(data || []);
  };

  const agregarCategoria = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('categorias').insert([{ nombre }]);
    
    if (error) {
      alert("Error al guardar métrica: " + error.message);
    } else {
      setNombre('');
      await fetchCategorias();
      if (onUpdate) onUpdate(); // Avisa a la página principal para desbloquear países
    }
    setLoading(false);
  };

  const eliminarCategoria = async (id) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (!error) {
      await fetchCategorias();
      if (onUpdate) onUpdate();
    }
  };

  return (
    <div>
      <form onSubmit={agregarCategoria} className="mb-4">
        <div className="input-group">
          <input 
            type="text" 
            className="form-control bg-secondary text-white border-0" 
            placeholder="Ej: PBI, Feeling, Perfo..." 
            value={nombre} 
            onChange={(e) => setNombre(e.target.value)} 
            required 
          />
          <button className="btn btn-info fw-bold" type="submit" disabled={loading}>
            {loading ? '...' : 'Añadir'}
          </button>
        </div>
      </form>

      <ul className="list-group list-group-flush border-top border-secondary">
        {categorias.map((cat) => (
          <li key={cat.id} className="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between align-items-center px-0">
            <span><i className="bi bi-star-fill text-info me-2"></i>{cat.nombre}</span>
            <button 
              onClick={() => eliminarCategoria(cat.id)} 
              className="btn btn-sm btn-outline-danger border-0"
              title="Eliminar métrica"
            >
              &times;
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}