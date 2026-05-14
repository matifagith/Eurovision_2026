'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLayout({ children }) {
  const [autorizado, setAutorizado] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))

    // Bloqueo total: Si no hay usuario o no es admin, fuera.
    if (!storedUser || storedUser.es_admin !== true) {
      router.push('/dashboard')
    } else {
      setAutorizado(true)
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