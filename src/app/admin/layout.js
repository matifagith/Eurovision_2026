'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }) {
  const [autorizado, setAutorizado] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 1. Leemos exactamente qué hay en el localStorage al llegar a /admin
    const userString = localStorage.getItem('user');
    //console.log("👀 Admin Layout detectó en localStorage:", userString);

    const storedUser = JSON.parse(userString);

    // 2. Evaluamos paso a paso para saber dónde falla
    if (!storedUser) {
      console.log("🚫 No hay usuario. Redirigiendo al Login (/).");
      router.push('/'); // Es mejor mandarlo al login que al dashboard si no hay nadie
    } else if (storedUser.es_admin !== true) {
      console.log("✋ Usuario normal detectado. Redirigiendo al Dashboard.");
      router.push('/dashboard');
    } else {
      //console.log("✅ Acceso de administrador concedido.");
      setAutorizado(true);
    }
  }, [router])

  if (!autorizado) {
    return (
      <div className="container mt-5 text-center text-white opacity-50">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Verificando acceso de administrador...</p>
      </div>
    )
  }

  // Solo si está autorizado se renderiza el contenido de la subruta
  return <>{children}</>
}