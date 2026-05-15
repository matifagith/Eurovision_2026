'use client'

import { useState, useEffect, Suspense } from 'react' // 1. Importar Suspense
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// 2. Mover toda tu lógica a un componente interno
function EstadisticasFinalContenido() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')
  
  // ... todos tus estados y useEffects actuales aquí ...
  // const [votos, setVotos] = useState([]) ...

  return (
    <main className="container mt-5 text-white">
       {/* Todo tu JSX actual */}
       <h1>Estadísticas Final - Edición {edicionId}</h1>
    </main>
  )
}

// 3. El export default debe envolver al componente en Suspense
export default function EstadisticasFinalPage() {
  return (
    <Suspense fallback={
      <div className="text-center mt-5 text-white opacity-50">
        Cargando estadísticas...
      </div>
    }>
      <EstadisticasFinalContenido />
    </Suspense>
  )
}