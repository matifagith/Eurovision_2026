'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ABMUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [nombre, setNombre] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [esAdmin, setEsAdmin] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUsuarios = async () => {
    setLoading(true)
    const { data } = await supabase.from('usuarios').select('*').order('id_usuario', { ascending: true })
    setUsuarios(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsuarios() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editandoId) {
      await supabase.from('usuarios').update({ nombre, contrasena, es_admin: esAdmin }).eq('id_usuario', editandoId)
    } else {
      await supabase.from('usuarios').insert([{ nombre, contrasena, es_admin: esAdmin }])
    }
    
    // Limpiar formulario
    setNombre('')
    setContrasena('')
    setEsAdmin(false)
    setEditandoId(null)
    fetchUsuarios()
  }

  const handleDelete = async (id) => {
    if (!confirm('⚠️ ¡ATENCIÓN! Si borrás este usuario se eliminarán TODOS SUS VOTOS históricos. ¿Estás seguro?')) return
    await supabase.from('usuarios').delete().eq('id_usuario', id)
    fetchUsuarios()
  }

  const iniciarEdicion = (user) => {
    setEditandoId(user.id_usuario)
    setNombre(user.nombre)
    setContrasena(user.contrasena)
    setEsAdmin(user.es_admin)
  }

  return (
    <main className="container mt-5 max-w-3xl mx-auto">
      <div className="d-flex justify-content-between mb-4">
        <h1 className="h3 fw-bold">Gestión de Usuarios</h1>
        <Link href="/admin" className="btn btn-outline-light">Volver al panel de control</Link>
      </div>

      <form onSubmit={handleSubmit} className="card bg-dark text-light p-4 mb-5 shadow border-info">
        <h5 className="mb-3 text-info">{editandoId ? 'Editando Usuario' : 'Nuevo Usuario'}</h5>
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <label className="form-label small text-muted">Nombre</label>
            <input type="text" className="form-control" placeholder="Ej: Matias" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted">Contraseña</label>
            <input type="text" className="form-control" placeholder="Contraseña de acceso" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
          </div>
        </div>
        
        <div className="form-check form-switch mb-4">
          <input className="form-check-input" type="checkbox" role="switch" id="esAdminSwitch" checked={esAdmin} onChange={(e) => setEsAdmin(e.target.checked)} />
          <label className="form-check-label text-warning fw-bold" htmlFor="esAdminSwitch">
            Dar permisos de Administrador
          </label>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-info fw-bold text-dark">{editandoId ? 'Guardar Cambios' : 'Crear Usuario'}</button>
          {editandoId && <button type="button" className="btn btn-secondary" onClick={() => { setEditandoId(null); setNombre(''); setContrasena(''); setEsAdmin(false) }}>Cancelar</button>}
        </div>
      </form>

      <div className="table-responsive shadow-sm rounded">
        <table className="table table-dark table-hover align-middle mb-0">
          <thead className="table-secondary text-dark">
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Nombre</th>
              <th scope="col">Contraseña</th>
              <th scope="col">Rol</th>
              <th scope="col" className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(user => (
              <tr key={user.id_usuario}>
                <th scope="row" className="text-muted">{user.id_usuario}</th>
                <td className="fw-bold text-light">{user.nombre}</td>
                <td><span className="badge bg-secondary font-monospace">{user.contrasena}</span></td>
                <td>
                  {user.es_admin ? <span className="badge bg-warning text-dark">Admin</span> : <span className="badge bg-info text-dark">Juez</span>}
                </td>
                <td className="text-end">
                  <button onClick={() => iniciarEdicion(user)} className="btn btn-sm btn-outline-info me-2">Editar</button>
                  <button onClick={() => handleDelete(user.id_usuario)} className="btn btn-sm btn-outline-danger">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}