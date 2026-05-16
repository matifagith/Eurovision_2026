'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Mini-componente para la cuenta regresiva
const ContadorGala = ({ fechaDestino }) => {
  const [tiempoRestante, setTiempoRestante] = useState('');

  useEffect(() => {
    if (!fechaDestino) {
      setTiempoRestante('COMING SOON ⏳');
      return;
    }

    const actualizarContador = () => {
      const ahora = new Date().getTime();
      const destino = new Date(fechaDestino).getTime();
      const distancia = destino - ahora;

      if (distancia < 0) {
        setTiempoRestante('¡ES HOY! 🎉');
        return;
      }

      const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

      const h = horas < 10 ? `0${horas}` : horas;
      const m = minutos < 10 ? `0${minutos}` : minutos;
      const s = segundos < 10 ? `0${segundos}` : segundos;

      if (dias > 0) {
        setTiempoRestante(`FALTAN ${dias}d ${h}h ${m}m`);
      } else {
        setTiempoRestante(`FALTAN ${h}:${m}:${s} ⏳`);
      }
    };

    actualizarContador();
    const intervalo = setInterval(actualizarContador, 1000);
    return () => clearInterval(intervalo);
  }, [fechaDestino]);

  return <>{tiempoRestante}</>;
};

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [ediciones, setEdiciones] = useState([])
  const [años, setAños] = useState([])
  const [cargando, setCargando] = useState(true) 
  
  // NUEVO: Estado para saber qué año está expandido (abierto)
  const [anioExpandido, setAnioExpandido] = useState(null)

  const router = useRouter()

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser) return router.push('/')
    setUser(storedUser)

    const fetchEdiciones = async () => {
      setCargando(true) 
      
      const { data, error } = await supabase
        .from('ediciones')
        .select(`
          *,
          participaciones ( id_participacion )
        `)
        .order('anio', { ascending: false })

      if (!error) {
        setEdiciones(data || [])
        const years = [...new Set((data || []).map(e => e.anio))]
        setAños(years)
        
        // Al cargar, abrimos la temporada más reciente por defecto
        if (years.length > 0) {
          setAnioExpandido(years[0])
        }
      } else {
        console.error("Error cargando galas:", error)
      }
      
      setCargando(false) 
    }
    
    fetchEdiciones()
  }, [router])

  // Función para alternar el acordeón
  const alternarTemporada = (anio) => {
    if (anioExpandido === anio) {
      setAnioExpandido(null); // Si ya estaba abierto, lo cerramos
    } else {
      setAnioExpandido(anio); // Abrimos el nuevo
    }
  };

  return (
    <main className="container mt-5 pb-5 font-sans text-white">
      
      {/* SECCIÓN DE BIENVENIDA (DISEÑO PREMIUM) */}
      <div className="card border-0 shadow-lg overflow-hidden mb-5 position-relative" 
           style={{ 
             background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
             borderRadius: '24px' 
           }}>
        
        <div className="position-absolute top-0 end-0 opacity-10 user-select-none" 
             style={{ transform: 'translate(10%, -15%)', fontSize: '15rem', pointerEvents: 'none' }}>
          🎤
        </div>

        <div className="card-body p-5 text-white position-relative z-1">
          <div className="row align-items-center">
            <div className="col-md-9">
              <h1 className="display-5 fw-bold mb-3" style={{ letterSpacing: '-1px' }}>
                ¡Hola, {user?.nombre}! <span className="fs-3 ms-2">👋</span>
              </h1>
              <p className="lead mb-0 text-white-50 fw-light">
                Bienvenido al sistema de votación para adictas a EV en vivo.
              </p>
            </div>
            <div className="col-md-3 text-end d-none d-md-flex justify-content-end">
              <div className="d-inline-flex align-items-center justify-content-center shadow-sm" 
                   style={{ 
                     width: '100px', 
                     height: '100px', 
                     background: 'rgba(255, 255, 255, 0.1)', 
                     borderRadius: '50%', 
                     backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(255, 255, 255, 0.2)'
                   }}>
                <span style={{ fontSize: '3rem' }}>🎙️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center mb-5">
        <h2 className="fw-bold me-3 text-uppercase small opacity-50" style={{ letterSpacing: '3px' }}>
          Historial de Galas
        </h2>
        <div className="flex-grow-1 border-bottom border-secondary opacity-25"></div>
      </div>

      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando galas...</span>
          </div>
          <p className="text-muted fw-bold tracking-widest">Sincronizando con el servidor...</p>
        </div>
      ) : años.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <h4>Aún no hay galas disponibles.</h4>
        </div>
      ) : (
        años.map(anio => {
          const edicionesDelAnio = ediciones.filter(e => e.anio === anio);
          const paisHost = edicionesDelAnio.find(e => e.pais_host)?.pais_host;
          const estaExpandido = anioExpandido === anio; // ¿Es esta la temporada activa?

          // Orden de las tarjetas
          const ordenTipos = { 'Semi 1': 1, 'Semi 2': 2, 'Final': 3 };
          const edicionesOrdenadas = edicionesDelAnio.sort((a, b) => {
            const pesoA = ordenTipos[a.tipo] || 99;
            const pesoB = ordenTipos[b.tipo] || 99;
            return pesoA - pesoB;
          });

          return (
            <section key={anio} className="mb-4">
              
              {/* BADGE DE AÑO Y HOST (AHORA ES CLICKABLE Y TIENE GLOW) */}
              <div 
                className="d-flex align-items-center mb-3" 
                onClick={() => alternarTemporada(anio)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className={`d-inline-flex align-items-center px-4 py-3 rounded-pill shadow-sm transition-all ${estaExpandido ? 'glow-active' : ''}`} 
                     style={{ 
                       background: estaExpandido ? 'rgba(13, 202, 240, 0.05)' : 'rgba(255, 255, 255, 0.03)', 
                       border: estaExpandido ? '1px solid #0dcaf0' : '1px solid rgba(255, 255, 255, 0.1)', 
                       backdropFilter: 'blur(5px)',
                       transition: 'all 0.3s ease'
                     }}>
                  <span className={`fw-bold text-uppercase ${estaExpandido ? 'text-info' : 'text-white'}`} style={{ letterSpacing: '2px', fontSize: '0.9rem', transition: 'color 0.3s' }}>
                    {anio}
                  </span>
                  {paisHost && (
                    <>
                      <span className="mx-3 text-secondary opacity-50">|</span>
                      <span className="fw-bold" style={{ color: '#0dcaf0', letterSpacing: '1px', fontSize: '0.9rem' }}>
                        📍 {paisHost.toUpperCase()}
                      </span>
                    </>
                  )}
                  {/* Icono indicador de estado */}
                  <span className="ms-3 text-secondary opacity-75" style={{ fontSize: '0.8rem', transition: 'transform 0.3s ease', transform: estaExpandido ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </div>
                <div className="flex-grow-1 border-bottom border-secondary opacity-25 ms-3 d-none d-md-block"></div>
              </div>
              
              {/* CONTENEDOR COLAPSABLE DE LAS TARJETAS */}
              {estaExpandido && (
                <div className="row g-4 mt-1 fade-in-section pb-4">
                  {edicionesOrdenadas.map(ed => {
                    const estaLista = ed.edicion_lista;
                    const abierta = ed.votacion_abierta;

                    return (
                      <div key={ed.id_edicion} className="col-md-4">
                        <div 
                          onClick={() => estaLista && router.push(`/vote?edicionId=${ed.id_edicion}`)}
                          className={`card bg-dark border-secondary h-100 shadow-sm position-relative overflow-hidden ${estaLista ? 'btn-hover-effect' : 'opacity-50'}`}
                          style={{ cursor: estaLista ? 'pointer' : 'default', borderRadius: '15px', transition: 'all 0.3s ease' }}
                        >
                          <div className="card-body p-4 text-center">
                            <div className="mb-3">
                              {ed.tipo.toLowerCase().includes('final') ? (
                                <span style={{ fontSize: '2.5rem' }}>🏆</span>
                              ) : (
                                <span style={{ fontSize: '2.5rem' }}>✨</span>
                              )}
                            </div>
                            
                            <h4 className={`fw-bold mb-1 ${estaLista ? 'text-warning' : 'text-secondary opacity-75'}`}>
                              {ed.tipo}
                            </h4>
                            <p className="text-muted small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>{anio}</p>
                            
                            {/* Botón de Video YouTube */}
                            {ed.url_video ? (
                              <div className="mb-4">
                                <a 
                                  href={ed.url_video} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="badge bg-danger text-white text-decoration-none py-2 px-3 shadow-sm"
                                  onClick={(e) => e.stopPropagation()} 
                                >
                                  ▶ VER VIDEO
                                </a>
                              </div>
                            ) : (
                              <div className="mb-4" style={{ height: '26px' }}></div>
                            )}

                            <div className="d-grid gap-2">
                              {!estaLista ? (
                                <div className="btn btn-outline-secondary disabled fw-bold opacity-75 font-monospace" style={{ border: '1px solid #444', letterSpacing: '0.5px' }}>
                                  <ContadorGala fechaDestino={ed.fecha_gala} />
                                </div>
                              ) : abierta ? (
                                <button className="btn btn-primary fw-bold shadow-sm">VOTAR AHORA →</button>
                              ) : (
                                <>
                                  <button className="btn btn-outline-light fw-bold opacity-75">MI VOTACIÓN 📊</button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation(); 
                                      const esSemi = ed.tipo.toLowerCase().includes('semi');
                                      const ruta = esSemi ? 'semifinal' : 'final';
                                      router.push(`/estadisticas/${ruta}?edicionId=${ed.id_edicion}`);
                                    }}
                                    className="btn btn-outline-light fw-bold opacity-75"
                                  >
                                    ESTADÍSTICA GLOBAL 📈
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {estaLista && (
                            <div className="position-absolute top-0 end-0 p-3">
                              <span className={`badge rounded-pill ${abierta ? 'bg-success shadow-sm' : 'bg-danger opacity-75'}`} 
                                    style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>
                                {abierta ? 'LIVE' : 'CLOSED'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      {/* ESTILOS CSS */}
      <style jsx>{`
        .btn-hover-effect:hover {
          transform: translateY(-10px);
          border-color: #0d6efd !important;
          box-shadow: 0 10px 30px rgba(13, 110, 253, 0.3) !important;
        }

        /* Efecto Glow para la temporada seleccionada */
        .glow-active {
          box-shadow: 0 0 20px rgba(13, 202, 240, 0.3) !important;
          transform: scale(1.02);
        }

        /* Animación de entrada para las tarjetas */
        .fade-in-section {
          animation: fadeIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  )
}