'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AbmCategorias() {
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategorias(data || []);
  };

  const agregarCategoria = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('categorias').insert([{ nombre }]);
    if (error) alert(error.message);
    else {
      setNombre('');
      fetchCategorias();
    }
  };

  return (
    <div className="card bg-dark border-info text-white shadow h-100">
      <div className="card-body">
        <h4 className="card-title text-info mb-4">Métricas de Votación</h4>
        <form onSubmit={agregarCategoria} className="mb-4">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Ej: Feeling, Vestuario..." 
              value={nombre} onChange={e => setNombre(e.target.value)} required />
            <button className="btn btn-info">Añadir</button>
          </div>
        </form>
        <ul className="list-group list-group-flush">
          {categorias.map(cat => (
            <li key={cat.id} className="list-group-item bg-transparent text-light border-secondary d-flex justify-content-between">
              <span>✨ {cat.nombre}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}