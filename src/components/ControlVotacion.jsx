'use client';
import { supabase } from '../lib/supabase';

export default function ControlVotacion({ paises, onUpdate }) {
  const habilitarPais = async (id) => {
    // Primero deshabilitamos todos
    await supabase.from('paises').update({ habilitado: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    // Habilitamos el seleccionado
    await supabase.from('paises').update({ habilitado: true }).eq('id', id);
    onUpdate();
  };

  return (
    <div className="mt-4">
      <h4>Control de Votación en Vivo</h4>
      <div className="list-group">
        {paises.map(p => (
          <button key={p.id} onClick={() => habilitarPais(p.id)} 
            className={`list-group-item list-group-item-action ${p.habilitado ? 'active' : ''}`}>
            {p.nombre} {p.habilitado ? '(VOTANDO AHORA)' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
