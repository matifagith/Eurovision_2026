import AbmPaises from '../../components/AbmPaises';

export default function AdminPage() {
  return (
    <main className="container py-5">
      <div className="row mb-5">
        <div className="col text-center">
          <h1 className="display-4 fw-bold text-primary">Panel de Control Viena 2026</h1>
          <p className="lead">Configura los participantes y las métricas de votación.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna de ABM Países */}
        <div className="col-md-6">
          <AbmPaises />
        </div>
        
        {/* Columna de Próximos Pasos / Control de Flujo */}
        <div className="col-md-6">
          <div className="card bg-dark border-primary shadow h-100">
            <div className="card-body p-4 text-center d-flex flex-column justify-content-center">
              <h3 className="text-primary mb-3">Control en Vivo</h3>
              <p>Próximamente: Botón para habilitar votaciones en tiempo real.</p>
              <button className="btn btn-outline-primary btn-lg disabled">Habilitar Siguiente País</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}