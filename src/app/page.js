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

  // --- ESTADOS PARA MODULO DE SOLICITUD DE CAMBIO DE CONTRASEÑA ---
  const [modoRecuperacion, setModoRecuperacion] = useState(false)
  const [usuarioRecuperacion, setUsuarioRecuperacion] = useState('')
  const [emailRecuperacion, setEmailRecuperacion] = useState('')
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState(null)

  // Login Tradicional
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
      localStorage.setItem('user', JSON.stringify(usuario))
      usuario.es_admin ? router.push('/admin') : router.push('/dashboard')
    }
  }

  // Flujo de Validación de Correo y Envío de Solicitud a la Tabla
  const handleRecuperarPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMensajeRecuperacion(null)

    try {
      // 1. Verificar si el nombre de usuario existe en la tabla manual
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nombre', usuarioRecuperacion)
        .single()

      if (userError || !usuario) {
        setError('El nombre de usuario ingresado no existe ❌')
        setLoading(false)
        return
      }

      // 2. NUEVO BLINDAJE: Validar si ya posee una solicitud pendiente en trámite
      const { data: solicitudExistente, error: checkError } = await supabase
        .from('solicitudes_cambio')
        .select('id')
        .eq('nombre_usuario', usuario.nombre)
        .eq('estado', 'pendiente')
        .maybeSingle()

      if (checkError) throw checkError

      if (solicitudExistente) {
        setError('Ya poseés una solicitud de cambio de contraseña en trámite. Por favor, aguardá a que el admin la apruebe. ⚠️')
        setLoading(false)
        return
      }

      // 3. Lógica de control de correos electrónicos
      if (!usuario.email && !usuario.correo) {
        // CASO A: No tiene correo vinculado, se lo asignamos ahora mismo en su perfil
        const columnaEmail = usuario.email !== undefined ? 'email' : 'correo';
        
        await supabase
          .from('usuarios')
          .update({ [columnaEmail]: emailRecuperacion })
          .eq('id_usuario', usuario.id_usuario)
      } 
      else {
        // Obtenemos el mail que ya tiene guardado (venga de la columna que venga)
        const emailRegistrado = usuario.email || usuario.correo;
        
        if (emailRegistrado.toLowerCase() !== emailRecuperacion.toLowerCase()) {
          // CASO C: El correo ingresado no coincide con el que ya tiene registrado
          setError('El correo electrónico asociado no corresponde al usuario, hablar con el admin. ⚠️')
          setLoading(false)
          return
        }
        // CASO B: Si coincide, pasa de largo directamente a crear la solicitud
      }

      // 4. Insertar la solicitud en tu nueva tabla 'solicitudes_cambio'
      const { error: insertError } = await supabase
        .from('solicitudes_cambio')
        .insert([
          { 
            id_usuario: usuario.id_usuario, 
            nombre_usuario: usuario.nombre, 
            correo_solicitud: emailRecuperacion,
            estado: 'pendiente'
          }
        ])

      if (insertError) throw insertError

      // Mensaje de éxito final indicando el link default por mail
      setMensajeRecuperacion('Su solicitud fue enviada correctamente. Se le enviará un mail con la nueva contraseña default. ✉️')
      setUsuarioRecuperacion('')
      setEmailRecuperacion('')

    } catch (err) {
      console.error(err)
      setError('Error al procesar la solicitud en el servidor. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center min-vh-100 font-sans">
      <div className="text-center mb-5">
        <h1 className="display-2 fw-bold text-primary">Eurovision vote app</h1>
        <p className="lead text-secondary opacity-75">Iniciá sesión para evaluar las presentaciones</p>
      </div>

      <div className="card shadow-lg p-4 bg-dark text-white border-secondary position-relative overflow-hidden" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
        
        {/* --- PANEL DE RECUPERACIÓN --- */}
        {modoRecuperacion ? (
          <form onSubmit={handleRecuperarPassword} className="fade-in">
            <h5 className="fw-bold mb-3 text-center text-info">Solicitar Nueva Contraseña</h5>
            <p className="small text-secondary mb-4 text-center">
              Ingresá tu usuario y correo. Si tus datos son correctos, el administrador generará una contraseña temporal y te llegará por mail.
            </p>

            <div className="mb-3">
              <label className="form-label small fw-bold">NOMBRE DE USUARIO</label>
              <input 
                type="text" 
                className="form-control bg-black text-white border-secondary shadow-none" 
                value={usuarioRecuperacion}
                onChange={(e) => setUsuarioRecuperacion(e.target.value)}
                placeholder="Ej: mauro_sa"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold">CORREO ELECTRÓNICO</label>
              <input 
                type="email" 
                className="form-control bg-black text-white border-secondary shadow-none" 
                value={emailRecuperacion}
                onChange={(e) => setEmailRecuperacion(e.target.value)}
                placeholder="tu_correo@ejemplo.com"
                required
              />
            </div>

            {error && <p className="text-danger small mb-3 text-center">{error}</p>}
            {mensajeRecuperacion && <p className="text-success small mb-3 text-center fw-bold">{mensajeRecuperacion}</p>}

            <button 
              type="submit" 
              className="btn btn-info w-100 fw-bold py-2 shadow-sm text-white mb-3"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Enviar Solicitud'}
            </button>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => { setModoRecuperacion(false); setError(null); setMensajeRecuperacion(null); }} 
                className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        ) : (
          
          /* --- PANEL DE LOGIN TRADICIONAL --- */
          <form onSubmit={handleLogin} className="fade-in">
            <div className="mb-3">
              <label className="form-label small fw-bold">NOMBRE DE USUARIO</label>
              <input 
                type="text" 
                autoComplete="username" 
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
                  autoComplete="current-password" 
                  className="form-control bg-black text-white border-secondary shadow-none border-end-0" 
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="btn border-secondary border-start-0 bg-black text-secondary"
                  onClick={() => setVerContrasena(!verContrasena)}
                >
                  {verContrasena ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-end mb-3">
              <button 
                type="button" 
                onClick={() => { setModoRecuperacion(true); setError(null); }} 
                className="btn btn-link btn-sm text-secondary text-decoration-none p-0"
              >
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
        )}
      </div>

      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}