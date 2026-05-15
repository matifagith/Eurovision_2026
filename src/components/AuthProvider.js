'use client'

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthProvider({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Escuchamos cambios en el estado de autenticación (Login con Google)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: usuario, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (error) console.error("Error buscando usuario:", error);

        if (usuario) {
          localStorage.setItem('user', JSON.stringify(usuario));
          
          if (usuario.es_admin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user');
        router.push('/');
      }
    });

    return () => {
      // Limpieza segura del listener
      if (authListener?.subscription) {
         authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // Renderiza el resto de la aplicación
  return <>{children}</>;
}