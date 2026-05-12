'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Asegurate que esta ruta sea correcta

export default function AbmPaises() {
  const [loading, setLoading] = useState(false);
  const [pais, setPais] = useState({ nombre: '', artista: '', cancion: '', pbi: '' });

  const guardarPais = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Verificamos que la conexión exista
    if (!supabase) {
      alert("Error de conexión con Supabase");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('paises').insert([
      { 
        nombre: pais.nombre, 
        artista: pais.artista, 
        cancion: pais.cancion, 
        pbi: parseFloat(pais.pbi) 
      }
    ]);
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡País guardado con éxito!");
      setPais({ nombre: '', artista: '', cancion: '', pbi: '' });
    }
    setLoading(false);
  };

  return (
    <div className="card bg-dark border-primary text-white shadow">
      <div className="card-body">
        <h4 className="card-title mb-4">Cargar Participante</h4>
        <form onSubmit={guardarPais}>
          <input type="text" className="form-control mb-2 bg-secondary text-white border-0" placeholder="País" required
            value={pais.nombre} onChange={e => setPais({...pais, nombre: e.target.value})} />
          <input type="text" className="form-control mb-2 bg-secondary text-white border-0" placeholder="Artista" required
            value={pais.artista} onChange={e => setPais({...pais, artista: e.target.value})} />
          <input type="text" className="form-control mb-2 bg-secondary text-white border-0" placeholder="Canción" required
            value={pais.cancion} onChange={e => setPais({...pais, cancion: e.target.value})} />
          <input type="number" step="0.01" className="form-control mb-3 bg-secondary text-white border-0" placeholder="PBI" required
            value={pais.pbi} onChange={e => setPais({...pais, pbi: e.target.value})} />
          <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar País'}
          </button>
        </form>
      </div>
    </div>
  );
}