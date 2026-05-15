// src/app/estadisticas/final/page.js
'use client'
import { useSearchParams } from 'next/navigation'

export default function FinalStats() {
  const searchParams = useSearchParams()
  const edicionId = searchParams.get('edicionId')

  return (
    <div className="container mt-5 text-white">
      <h2 className="fw-bold text-warning">Ranking Final (ID: {edicionId})</h2>
      <p>Análisis detallado de promedios por categoría y juez.</p>
      {/* Tu tabla de promedios aquí */}
    </div>
  )
}