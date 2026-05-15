import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '@/components/Navbar';
import AuthProvider from '@/components/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-dark text-light" style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        
        {/* Envolvemos la app con nuestro proveedor de cliente */}
        <AuthProvider>
          <Navbar />
          <div className="pt-2">
            {children}
          </div>
        </AuthProvider>
        
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #0f0f0f; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #444; }
          body { overflow-x: hidden; }
        `}} />
      </body>
    </html>
  );
}