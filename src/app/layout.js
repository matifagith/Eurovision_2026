import 'bootstrap/dist/css/bootstrap.min.css';

export const metadata = {
  title: 'Eurovision 2026 - Salta Judges',
  description: 'App para puntuar el concurso en vivo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-dark text-light">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
          <div className="container">
            <a className="navbar-brand fw-bold" href="/">Eurovision 2026 🇦🇹</a>
            <div className="d-flex">
              <a href="/dashboard" className="btn btn-info btn-sm me-2 fw-bold text-dark">Lobby</a>              
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}