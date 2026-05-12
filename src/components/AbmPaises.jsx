'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AbmPaises() {
  const [loading, setLoading] = useState(false);
  const [pais, setPais] = useState({ nombre: '', artista: '', cancion: '', pbi: '' });

  const guardarPais = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('paises').insert([pais]);
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡País guardado con éxito!");
      setPais({ nombre: '', artista: '', cancion: '', pbi: '' });
    }
    setLoading(false);
  };

  return (
    <div className="card bg-secondary text-white shadow">
      <div className="card-body">
        <h4 className="card-title mb-4">Cargar Participante</h4>
        <form onSubmit={guardarPais}>
          <input type="text" className="form-control mb-2" placeholder="País (Ej: Iceland)" required
            value={pais.nombre} onChange={e => setPais({...pais, nombre: e.target.value})} />
          <input type="text" className="form-control mb-2" placeholder="Artista" required
            value={pais.artista} onChange={e => setPais({...pais, artista: e.target.value})} />
          <input type="text" className="form-control mb-2" placeholder="Canción" required
            value={pais.cancion} onChange={e => setPais({...pais, cancion: e.target.value})} />
          <input type="number" step="0.01" className="form-control mb-3" placeholder="PBI (U$D Trillones)" required
            value={pais.pbi} onChange={e => setPais({...pais, pbi: e.target.value})} />
          <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar País'}
          </button>
        </form>
      </div>
    </div>
  );
}