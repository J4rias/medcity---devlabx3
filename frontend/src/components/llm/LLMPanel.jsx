import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RefreshCw, Trash2, Minimize2, Maximize2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDashboardStore } from '../../store/dashboard.store'
import { useLLM, SUGERENCIAS } from '../../hooks/useLLM'
import { TooltipGlosario } from '../glossary/GlossaryText'

// ─── BURBUJA DE MENSAJE ───────────────────────────────────────────────────────
function Burbuja({ mensaje }) {
  const esUsuario = mensaje.rol === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${
        esUsuario
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-gray-50 text-gray-800 ring-1 ring-gray-100 rounded-bl-sm'
      }`}>
        {esUsuario ? (
          <p>{mensaje.contenido}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={(value) => value}
            components={{
              p:      ({ children }) => <p className="leading-relaxed mb-1.5 last:mb-0">{children}</p>,
              ul:     ({ children }) => <ul className="list-disc ml-4 space-y-0.5">{children}</ul>,
              ol:     ({ children }) => <ol className="list-decimal ml-4 space-y-0.5">{children}</ol>,
              li:     ({ children }) => <li className="leading-snug">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-blue-700">{children}</strong>,
              code:   ({ children }) => <code className="bg-gray-200 px-1 rounded text-xs">{children}</code>,
              a:      ({ href, children }) => href?.startsWith('glosario:') 
                        ? <TooltipGlosario termino={decodeURIComponent(href.split(':')[1])}>{children}</TooltipGlosario> 
                        : <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>
            }}
          >
            {mensaje.contenido.replace(/\[\[T:([^\]]+)\]\]/g, (m, t) => `[${t}](glosario:${encodeURIComponent(t)})`)}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  )
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────────────────────
export function LLMPanel() {
  const { rol, barrioActivo, indicadorActivo, historialChat, llmCargando, llmError, limpiarChat, chatExpandido, setChatExpandido } = useDashboardStore()
  const { enviar, respuestaStreaming } = useLLM()
  const [query, setQuery]   = useState('')
  const [sugs, setSugs]     = useState([])
  const bottomRef           = useRef(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historialChat, respuestaStreaming])

  // Sugerencias contextuales según rol e indicador
  const sugerencias = SUGERENCIAS[rol]?.[indicadorActivo] ??
                      SUGERENCIAS[rol]?.icv ?? []

  const handleEnviar = (texto) => {
    const q = texto ?? query
    if (!q.trim()) return
    setQuery('')
    setSugs([])
    enviar(q)
  }

  const handleInput = (val) => {
    setQuery(val)
    if (val.length < 2) { setSugs([]); return }
    const todas = Object.values(SUGERENCIAS[rol] ?? {}).flat()
    setSugs(todas.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 4))
  }

  const nombreBarrio = barrioActivo?.nombre ?? 'un barrio'

  return (
    <div className={`flex flex-col h-full bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden transition-all duration-300 ${
      chatExpandido ? 'shadow-xl' : ''
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            🤖 Asistente MedCity
          </p>
          <p className="text-xs text-gray-400">
            {barrioActivo ? `Analizando ${nombreBarrio}` : 'Selecciona un barrio en el mapa'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {historialChat.length > 0 && (
            <button
              onClick={limpiarChat}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Limpiar conversación"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => setChatExpandido(!chatExpandido)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title={chatExpandido ? "Contraer" : "Expandir"}
          >
            {chatExpandido ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Historial de mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Estado vacío: sugerencias contextuales */}
        {historialChat.length === 0 && !llmCargando && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center py-2">
              Pregunta lo que necesites sobre {nombreBarrio}
            </p>
            {sugerencias.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => handleEnviar(s)}
                className="w-full text-left text-sm px-3 py-2 rounded-xl
                           bg-gray-50 hover:bg-blue-50 hover:text-blue-700
                           ring-1 ring-gray-100 hover:ring-blue-200
                           transition-all duration-150"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Mensajes */}
        <AnimatePresence>
          {historialChat.map((msg, i) => (
            <Burbuja key={i} mensaje={msg} />
          ))}
        </AnimatePresence>

        {/* Respuesta en streaming */}
        {respuestaStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm px-3.5 py-2.5
                            bg-gray-50 text-gray-800 text-sm ring-1 ring-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                urlTransform={(value) => value}
                components={{
                  p:      ({ children }) => <span className="leading-relaxed">{children}</span>,
                  ul:     ({ children }) => <ul className="list-disc ml-4 space-y-0.5">{children}</ul>,
                  ol:     ({ children }) => <ol className="list-decimal ml-4 space-y-0.5">{children}</ol>,
                  li:     ({ children }) => <li className="leading-snug">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-blue-700">{children}</strong>,
                  code:   ({ children }) => <code className="bg-gray-200 px-1 rounded text-xs">{children}</code>,
                  a:      ({ href, children }) => href?.startsWith('glosario:') 
                            ? <TooltipGlosario termino={decodeURIComponent(href.split(':')[1])}>{children}</TooltipGlosario> 
                            : <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>
                }}
              >
                {respuestaStreaming.replace(/\[\[T:([^\]]+)\]\]/g, (m, t) => `[${t}](glosario:${encodeURIComponent(t)})`)}
              </ReactMarkdown>
              <span className="llm-cursor" />
            </div>
          </motion.div>
        )}

        {/* Indicador de carga */}
        {llmCargando && !respuestaStreaming && (
          <div className="flex justify-start">
            <div className="bg-gray-50 ring-1 ring-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {llmError && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl ring-1 ring-red-100">
            ⚠️ {llmError}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input con autocompletado */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-50">

        {/* Dropdown de sugerencias mientras escribe */}
        <AnimatePresence>
          {sugs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2 bg-white ring-1 ring-gray-100 rounded-xl shadow-sm overflow-hidden"
            >
              {sugs.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleEnviar(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50
                             hover:text-blue-700 transition-colors"
                >
                  🔍 {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campo de texto */}
        <div className="flex gap-2">
          <input
            value={query}
            onFocus={() => setChatExpandido(true)}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
            placeholder="Pregunta lo que necesites..."
            disabled={llmCargando}
            className="flex-1 text-sm px-3 py-2.5 rounded-xl ring-1 ring-gray-200
                       focus:ring-blue-300 focus:outline-none bg-gray-50
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleEnviar()}
            disabled={llmCargando || !query.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200
                       text-white rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {llmCargando
              ? <RefreshCw size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
