import AbmPaises from '../../components/AbmPaises';
import AbmCategorias from '../../components/AbmCategorias';

export default function AdminPage() {
  return (
    <main className="container py-5">
      <h1 className="text-center mb-5 text-primary fw-bold">Configuración Eurovisión 2026</h1>
      <div className="row g-4">
        <div className="col-lg-6">
          <AbmPaises />
        </div>
        <div className="col-lg-6">
          <AbmCategorias />
        </div>
      </div>
    </main>
  );
}