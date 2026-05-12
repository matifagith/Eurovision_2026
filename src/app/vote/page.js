'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function VotacionPage() {
  const [categorias, setCategorias] = useState([]);
  const [paisActivo, setPaisActivo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Traer el país que marcaste como "habilitado" en el Admin
      const { data: pais } = await supabase.from('paises').select('*').eq('habilitado', true).single();
      setPaisActivo(pais);
      
      // 2. Traer las categorías que creaste en el ABM
      const { data: cats } = await supabase.from('categorias').select('*');
      setCategorias(cats || []);
    };
    fetchData();
  }, []);

  if (!paisActivo) return <div className="container mt-5 text-center"><h3>Esperando que el Admin habilite un país...</h3></div>;

  return (
    <main className="container py-4">
      <div className="card bg-dark border-warning shadow">
        <div className="card-header bg-warning text-dark text-center">
          <h2 className="mb-0">{paisActivo.nombre} - {paisActivo.artista}</h2>
        </div>
        <div className="card-body">
          {categorias.map(cat => (
            <div key={cat.id} className="mb-4">
              <label className="form-label d-flex justify-content-between">
                <span>{cat.nombre}</span>
                <span className="badge bg-primary">Puntaje</span>
              </label>
              <input type="range" className="form-range" min="0" max="10" step="0.5" />
            </div>
          ))}
          <button className="btn btn-success w-100 btn-lg fw-bold">ENVIAR VOTOS</button>
        </div>
      </div>
    </main>
  );
}