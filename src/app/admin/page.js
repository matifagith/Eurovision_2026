import AbmPaises from '../../components/AbmPaises';
import AbmCategorias from '../../components/AbmCategorias'; // Asegúrate de crear este archivo

export default function AdminPage() {
  return (
    <main className="container py-5">
      <header className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary">Panel de Control - Viena 2026</h1>
        <p className="lead text-muted">Configuración de participantes y métricas</p>
      </header>

      <div className="row g-4">
        {/* Sección de Países */}
        <div className="col-lg-6">
          <AbmPaises />
        </div>
        
        {/* Sección de Categorías Dinámicas */}
        <div className="col-lg-6">
          <AbmCategorias />
        </div>
      </div>
    </main>
  );
}