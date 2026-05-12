'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AbmCategorias from '../../components/AbmCategorias';
import AbmPaises from '../../components/AbmPaises';

export default function AdminPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    const { data, error } = await supabase.from('categorias').select('*');
    if (!error) {
      setCategorias(data || []);
    }
    setLoading(false);
  };

  return (
    <main className="container py-5">
      <header className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary">Configuración Eurovisión 2026</h1>
        <p className="lead text-muted">Siga los pasos para configurar el panel de jueces</p>
      </header>

      <div className="row g-4">
        {/* PASO 1: Definir métricas (PBI, Performance, etc.) */}
        <div className="col-lg-6">
          <div className="p-4 border border-info rounded bg-dark shadow-sm h-100">
            <h3 className="text-info border-bottom pb-2 mb-4">1. Definir Métricas de Votación</h3>
            <p className="small text-secondary">Agregue aquí los criterios que los jueces puntuarán (ej: PBI, Feeling, Perfo).</p>
            <AbmCategorias onUpdate={fetchCategorias} />
          </div>
        </div>

        {/* PASO 2: Cargar países (Habilitado solo si hay métricas) */}
        <div className="col-lg-6">
          <div className={`p-4 border rounded bg-dark shadow-sm h-100 ${categorias.length === 0 ? 'border-secondary opacity-50' : 'border-warning'}`}>
            <h3 className="text-warning border-bottom pb-2 mb-4">2. Cargar Países Participantes</h3>
            {loading ? (
              <p>Cargando configuración...</p>
            ) : categorias.length === 0 ? (
              <div className="alert alert-secondary">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Primero debe agregar al menos una métrica de votación para habilitar la carga de países.
              </div>
            ) : (
              <>
                <p className="small text-secondary">Ahora puede cargar los participantes. Se evaluarán bajo las {categorias.length} métricas creadas.</p>
                <AbmPaises />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}