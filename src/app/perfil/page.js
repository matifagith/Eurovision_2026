'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PerfilUsuario() {
  const [user, setUser] = useState(null)
  
  const [mostrarPassword, setMostrarPassword] = useState(false)
  
  const [editandoEmail, setEditandoEmail] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  const [editandoPassword, setEditandoPassword] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  // Estado para controlar el Pop-up (Toast flotante)
  const [toast, setToast] = useState({ visible: false, mensaje: '' })

  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)
  }, [router])

  // Función para lanzar el Pop-up
  const mostrarNotificacion = (mensaje) => {
    setToast({ visible: true, mensaje })
    setTimeout(() => {
      setToast({ visible: false, mensaje: '' })
    }, 3000) // Desaparece a los 3 segundos
  }

  const guardarEmail = async () => {
    if (!emailInput) return;
    
    const { error } = await supabase
      .from('usuarios')
      .update({ email: emailInput })
      .eq('id_usuario', user.id_usuario);

    if (error) {
      alert("Hubo un error al actualizar el correo.");
      console.error(error);
      return;
    }

    const updatedUser = { ...user, email: emailInput };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditandoEmail(false);
    
    mostrarNotificacion('✅ Correo electrónico actualizado');
  }

  const guardarPassword = async () => {
    if (!passwordInput) return;

    const { error } = await supabase
      .from('usuarios')
      .update({ contrasena: passwordInput }) 
      .eq('id_usuario', user.id_usuario);

    if (error) {
      alert("Hubo un error al actualizar la contraseña.");
      console.error(error);
      return;
    }

    const updatedUser = { ...user, contrasena: passwordInput, password: passwordInput };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setEditandoPassword(false);

    mostrarNotificacion('✅ Contraseña actualizada');
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando perfil...</span>
        </div>
      </div>
    )
  }

  const inicial = user.nombre ? user.nombre.charAt(0).toUpperCase() : '👤'

  return (
    <main className="container mt-5 pb-5 font-sans text-white" style={{ maxWidth: '800px' }}>
      
      {/* POP-UP FLOTANTE (TOAST) */}
      {toast.visible && (
        <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1050 }}>
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg" role="alert" style={{ borderRadius: '10px' }}>
            <div className="d-flex">
              <div className="toast-body fw-bold px-4 py-3">
                {toast.mensaje}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TÍTULO LIMPIO */}
      <div className="mb-4">
        <h2 className="fw-bold text-uppercase small opacity-50 m-0" style={{ letterSpacing: '3px' }}>
          Información de cuenta
        </h2>
      </div>

      {/* TARJETA PRINCIPAL DEL PERFIL */}
      <div className="card bg-dark border-secondary shadow-lg overflow-hidden" style={{ borderRadius: '24px' }}>
        
        {/* Cabecera con degradado */}
        <div className="position-relative" style={{ height: '120px', background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
          <div className="position-absolute shadow-lg d-flex align-items-center justify-content-center fw-bold" 
               style={{ 
                 width: '100px', 
                 height: '100px', 
                 background: '#1a1a1a', 
                 color: '#fff',
                 border: '4px solid #212529',
                 borderRadius: '50%',
                 bottom: '-50px',
                 left: '40px',
                 fontSize: '2.5rem'
               }}>
            {inicial}
          </div>
        </div>

        {/* Cuerpo del perfil */}
        <div className="card-body pt-5 px-sm-5 pb-5 position-relative mt-3">
          
          <div className="position-absolute top-0 end-0 mt-4 me-sm-5 me-3">
             <span className={`badge rounded-pill px-3 py-2 shadow-sm ${user.es_admin ? 'bg-warning text-dark' : 'bg-primary'}`} style={{ letterSpacing: '1px' }}>
               {user.es_admin ? '⭐ ADMINISTRADOR' : '🎙️ JUEZ OFICIAL'}
             </span>
          </div>

          <h3 className="fw-bold mb-1 text-white">{user.nombre}</h3>
          <p className="text-muted mb-5">Miembro del jurado activo</p>

          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-2">
            <h5 className="fw-bold text-white m-0 opacity-75">
              Detalles de Contacto
            </h5>
          </div>

          <div className="row g-4">
            
            {/* NOMBRE DE USUARIO (No editable) */}
            <div className="col-md-12">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="text-secondary small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>
                  Nombre de Usuario
                </label>
                <div className="fs-5 text-light">{user.nombre}</div>
              </div>
            </div>
            
            {/* CORREO ELECTRÓNICO */}
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="text-secondary small fw-bold text-uppercase m-0" style={{ letterSpacing: '1px' }}>
                    Correo Electrónico
                  </label>
                  {!editandoEmail && (
                    <button 
                      className="btn btn-sm p-0 border-0 shadow-none text-info" 
                      onClick={() => { setEmailInput(user.email || ''); setEditandoEmail(true); }}
                      title="Editar correo"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                
                {!editandoEmail ? (
                  <div className="fs-5 text-light mt-2" style={{ wordBreak: 'break-all' }}>
                    {user.email || <span className="text-muted fst-italic">No especificado</span>}
                  </div>
                ) : (
                  <div className="d-flex gap-2 mt-2">
                    <input 
                      type="email" 
                      className="form-control form-control-sm bg-black text-white border-secondary shadow-none" 
                      value={emailInput} 
                      onChange={(e) => setEmailInput(e.target.value)} 
                    />
                    <button className="btn btn-success btn-sm px-2" onClick={guardarEmail} title="Guardar">✅</button>
                    <button className="btn btn-danger btn-sm px-2" onClick={() => setEditandoEmail(false)} title="Cancelar">✖</button>
                  </div>
                )}
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div className="col-md-6">
              <div className="p-3 rounded h-100" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="text-secondary small fw-bold text-uppercase m-0" style={{ letterSpacing: '1px' }}>
                    Contraseña
                  </label>
                  {!editandoPassword && (
                    <button 
                      className="btn btn-sm p-0 border-0 shadow-none text-info" 
                      onClick={() => { setPasswordInput(user.password || user.contrasena || ''); setEditandoPassword(true); }}
                      title="Editar contraseña"
                    >
                      ✏️
                    </button>
                  )}
                </div>
                
                {!editandoPassword ? (
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div className="fs-5 text-light font-monospace">
                      {mostrarPassword ? (user.password || user.contrasena || 'No disponible') : '••••••••'}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-secondary border-0 shadow-none" 
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      title="Mostrar/Ocultar"
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                ) : (
                  <div className="d-flex gap-2 mt-2">
                    <div className="input-group input-group-sm">
                      <input 
                        type={mostrarPassword ? "text" : "password"} 
                        className="form-control bg-black text-white border-secondary shadow-none border-end-0" 
                        value={passwordInput} 
                        onChange={(e) => setPasswordInput(e.target.value)} 
                      />
                      <button 
                        className="btn border-secondary border-start-0 bg-black text-secondary shadow-none" 
                        type="button" 
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                      >
                        {mostrarPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <button className="btn btn-success btn-sm px-2" onClick={guardarPassword} title="Guardar">✅</button>
                    <button className="btn btn-danger btn-sm px-2" onClick={() => setEditandoPassword(false)} title="Cancelar">✖</button>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  )
}