'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: usuario, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('nombre', nombre)
      .eq('contrasena', contrasena)
      .single()

    if (dbError || !usuario) {
      setError('Usuario o contraseña incorrectos ❌')
      setLoading(false)
    } else {
      // Guardamos al usuario en el navegador para usar su ID después
      localStorage.setItem('user', JSON.stringify(usuario))
      
      if (usuario.es_admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center min-vh-100">
      <div className="text-center mb-5">
        <h1 className="display-2 fw-bold text-primary">Eurovision vote app</h1>
        <p className="lead text-secondary">Iniciá sesión para evaluar las presentaciones en vivo</p>
      </div>

      <div className="card shadow-lg p-4 bg-dark text-white" style={{ maxWidth: '400px', width: '100%' }}>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Nombre de Usuario</label>
            <input 
              type="text" 
              className="form-control" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-control" 
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-danger small mb-3">{error}</p>}
          <button 
            type="submit" 
            className="btn btn-primary w-100 fw-bold py-2"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}