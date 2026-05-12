'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AbmCategorias({ onUpdate }) {
  const [nombre, setNombre] = useState('');
  const [categorias, setCategorias] = useState([]);

  useEffect(() => { fetchCategorias(); }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategorias(data || []);
  };

  

  const agregar = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('categorias').insert([{ nombre }]);
    if (!error) { 
      setNombre('');
      onUpdate(); // Esto actualiza el estado en la página padre (page.js)
    }
  };

  return (
    <div className="card bg-dark border-info text-white shadow h-100">
      <div className="card-body">
        <h4 className="text-info mb-4">Métricas de Votación</h4>
        <form onSubmit={agregar} className="mb-4">
          <div className="input-group">
            <input type="text" className="form-control" placeholder="Ej: PBI, Perfo..." 
              value={nombre} onChange={e => setNombre(e.target.value)} required />
            <button className="btn btn-info">Añadir</button>
          </div>
        </form>
        <ul className="list-group list-group-flush">
          {categorias.map(c => (
            <li key={c.id} className="list-group-item bg-transparent text-light border-secondary">
              ✨ {c.nombre}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}