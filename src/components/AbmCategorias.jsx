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
      await fetchCategorias();
      if (onUpdate) onUpdate();
    } else {
      alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <form onSubmit={agregar} className="input-group mb-3">
        <input type="text" className="form-control" placeholder="Nombre (Ej: PBI)" 
          value={nombre} onChange={e => setNombre(e.target.value)} required />
        <button className="btn btn-info">Añadir</button>
      </form>
      <ul className="list-group">
        {categorias.map(c => (
          <li key={c.id} className="list-group-item bg-transparent text-white border-secondary">
            ✨ {c.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}