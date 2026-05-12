'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function VotacionPage() {
  const [categorias, setCategorias] = useState([]);
  const [paisActivo, setPaisActivo] = useState(null);
  const [votos, setVotos] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      // Trae el país que marcaste como habilitado en Supabase
      const { data: pais } = await supabase.from('paises').select('*').eq('habilitado', true).single();
      setPaisActivo(pais);
      
      // Trae las categorías (PBI, Perfo, etc.)
      const { data: cats } = await supabase.from('categorias').select('*');
      setCategorias(cats || []);
    };
    loadInitialData();
  }, []);

  const enviarVotacion = async () => {
    // Aquí irá la lógica para guardar en la tabla 'votaciones'
    alert("Votos enviados. ¡Gracias Juez!");
  };

  if (!paisActivo) return <div className="container mt-5 text-center"><h3>Esperando que el Admin habilite un país...</h3></div>;

  return (
    <div className="container py-4">
      <div className="card bg-dark border-warning shadow">
        <div className="card-header bg-warning text-dark text-center">
          <h2 className="mb-0">{paisActivo.nombre.toUpperCase()}</h2>
          <small>{paisActivo.artista} - {paisActivo.cancion}</small>
        </div>
        <div className="card-body p-4">
          {categorias.map(cat => (
            <div key={cat.id} className="mb-4">
              <label className="form-label d-flex justify-content-between">
                <strong>{cat.nombre}</strong>
                <span className="badge bg-primary">{votos[cat.id] || 5}</span>
              </label>
              <input type="range" className="form-range" min="1" max="10" step="0.5" 
                onChange={(e) => setVotos({...votos, [cat.id]: e.target.value})} />
            </div>
          ))}
          <button onClick={enviarVotacion} className="btn btn-warning w-100 btn-lg fw-bold mt-3">
            GUARDAR PUNTUACIÓN
          </button>
        </div>
      </div>
    </div>
  );
}