import { NextResponse } from 'next/server'

export function middleware(request) {
  // 1. Obtenemos los datos del usuario desde las cookies (forma más segura)
  // O en tu caso, como estamos usando localStorage para el MVP, 
  // haremos una verificación de redirección en el cliente.
  
  // Nota: El middleware corre en el servidor, por lo que no tiene acceso a localStorage.
  // Para una protección real de servidor, deberías usar cookies de Supabase.
  
  return NextResponse.next()
}

// Configuramos para que solo actúe en las rutas de admin
export const config = {
  matcher: '/admin/:path*',
}