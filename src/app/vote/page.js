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
        {/* PASO 1: METRICAS (PBI, Perfo, Feeling...) */}
        <div className="col-lg-6">
          <div className="p-4 border border-info rounded bg-dark shadow-sm">
            <h3 className="text-info border-bottom pb-2 mb-4">1. Definir Métricas de Votación</h3>
            <AbmCategorias onUpdate={fetchCategorias} />
          </div>
        </div>

        {/* PASO 2: PAISES (Bloqueado visualmente si no hay métricas) */}
        <div className="col-lg-6">
          <div className={`p-4 border rounded bg-dark shadow-sm ${categorias.length === 0 ? 'border-secondary opacity-50' : 'border-warning'}`}>
            <h3 className="text-warning border-bottom pb-2 mb-4">2. Cargar Países Participantes</h3>
            {categorias.length === 0 ? (
              <div className="alert alert-secondary">
                ⚠️ Primero debes agregar al menos una métrica (ej: PBI) para habilitar la carga de países.
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