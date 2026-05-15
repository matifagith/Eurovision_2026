'use client' // Convertimos a Client Component para manejar el estado de Auth global

import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '@/components/Navbar';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RootLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Escuchamos cambios en el estado de autenticación (Login con Google)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 1. Buscamos al usuario en nuestra tabla pública 'usuarios' usando el email
        const { data: usuario, error } = await supabase
  .from('usuarios')
  .select('*')
  .eq('email', session.user.email)
  .single();

if (error) console.error("Error buscando usuario en tabla pública:", error);

        if (usuario) {
          // 2. Sincronizamos con tu lógica de localStorage
          localStorage.setItem('user', JSON.stringify(usuario));
          
          // 3. Redirigimos según el rol
          if (usuario.es_admin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      }

      // Si el usuario cierra sesión en Supabase, limpiamos el localStorage
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user');
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-dark text-light" style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <Navbar />
        <div className="pt-2">
          {children}
        </div>
        
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