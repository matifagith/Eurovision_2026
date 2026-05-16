'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

// Login Tradicional
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 🧹 LA SOLUCIÓN: Limpiar el rastro de Supabase Auth/Google antes de entrar
    await supabase.auth.signOut()

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
      localStorage.setItem('user', JSON.stringify(usuario))
      usuario.es_admin ? router.push('/admin') : router.push('/dashboard')
    }
  }

  // Login con Google (Modularizado)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard` 
      }
    })
    if (error) setError('Error al conectar con Google ❌')
  }

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center min-vh-100 font-sans">
      <div className="text-center mb-5">
        <h1 className="display-2 fw-bold text-primary">Eurovision vote app</h1>
        <p className="lead text-secondary opacity-75">Iniciá sesión para evaluar las presentaciones</p>
      </div>

      <div className="card shadow-lg p-4 bg-dark text-white border-secondary" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold">NOMBRE DE USUARIO</label>
            <input 
              type="text" 
              className="form-control bg-black text-white border-secondary shadow-none" 
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label small fw-bold">CONTRASEÑA</label>
            <div className="input-group">
              <input 
                type={verContrasena ? "text" : "password"} 
                className="form-control bg-black text-white border-secondary shadow-none" 
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="btn btn-outline-secondary border-secondary"
                onClick={() => setVerContrasena(!verContrasena)}
              >
                {verContrasena ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-end mb-3">
            <button type="button" onClick={() => alert("Uf que pena: hablar con mauro.")} className="btn btn-link btn-sm text-secondary text-decoration-none p-0">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && <p className="text-danger small mb-3 text-center">{error}</p>}

          <button 
            type="submit" 
            className="btn btn-primary w-100 fw-bold py-2 shadow-sm"
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        {/*
        DESCOMENTAR ESTO PARA VISUALIZAR AUTH GOOGLE EN LANDING PAGE
        <div className="text-center my-3 opacity-50 small">O CONTINUAR CON</div>

        <button 
          onClick={handleGoogleLogin}
          className="btn btn-outline-light w-100 fw-bold d-flex align-items-center justify-content-center gap-2 border-secondary py-2"
        >
          <img src="https://www.google.com/favicon.ico" alt="google" width="16" />
          Google
        </button>
        */}
      </div>
    </main>
  )
}