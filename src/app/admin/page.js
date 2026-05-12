'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AbmCategorias from '../../components/AbmCategorias';
import AbmPaises from '../../components/AbmPaises';

export default function AdminPage() {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias').select('*');
    setCategorias(data || []);
  };

  return (
    <main className="container py-5">
      <h1 className="text-center mb-5 text-primary fw-bold">Configuración Eurovisión 2026</h1>
      
      <div className="row g-4">
        {/* PASO 1: Métricas */}
        <div className="col-lg-6">
          <div className="border border-info rounded p-3 bg-dark shadow-sm h-100">
            <h3 className="text-info border-bottom pb-2">Paso 1: Definir Métricas</h3>
            <p className="small text-muted">Ejemplos: PBI, Performance, Feeling, Fact X.</p>
            <AbmCategorias onUpdate={fetchCategorias} />
          </div>
        </div>

        {/* PASO 2: Países */}
        <div className="col-lg-6">
          <div className={`border rounded p-3 bg-dark shadow-sm h-100 ${categorias.length === 0 ? 'border-secondary opacity-50' : 'border-warning'}`}>
            <h3 className="text-warning border-bottom pb-2">Paso 2: Cargar Países</h3>
            {categorias.length === 0 ? (
              <div className="alert alert-secondary mt-3">
                ⚠️ Debes agregar al menos una métrica de votación para habilitar la carga de países.
              </div>
            ) : (
              <AbmPaises />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}