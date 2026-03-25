import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, RefreshCw, Trash2, Bot, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDashboardStore } from '../../store/dashboard.store'
import { useLLM, SUGERENCIAS } from '../../hooks/useLLM'
import { TooltipGlosario } from '../glossary/GlossaryText'

const ROLE_COLORS = {
  ciudadano:    { hex: '#0066CC', light: '#E3F2FD', name: 'Ciudadano' },
  comerciante:  { hex: '#FF6B35', light: '#FFE5D9', name: 'Comerciante' },
  gobierno:     { hex: '#00A651', light: '#E8F5E9', name: 'Gobierno' },
  investigador: { hex: '#6C5CE7', light: '#F3E5F5', name: 'Investigador' },
}

// ─── BURBUJA DE MENSAJE ───────────────────────────────────────────────────────
function Burbuja({ mensaje, roleColor }) {
  const esUsuario = mensaje.rol === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}
    >
      {!esUsuario && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0"
          style={{ backgroundColor: roleColor + '20', border: `1.5px solid ${roleColor}40` }}>
          <Bot size={13} style={{ color: roleColor }} />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
        esUsuario
          ? 'text-white rounded-br-sm'
          : 'bg-gray-50 text-gray-800 ring-1 ring-gray-100 rounded-bl-sm'
      }`}
        style={esUsuario ? { backgroundColor: roleColor } : {}}
      >
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
              strong: ({ children }) => <strong className="font-semibold" style={{ color: roleColor }}>{children}</strong>,
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
  const { rol, barrioActivo, indicadorActivo, historialChat, llmCargando, llmError, limpiarChat } = useDashboardStore()
  const { enviar, respuestaStreaming } = useLLM()
  const [query, setQuery]   = useState('')
  const [sugs, setSugs]     = useState([])
  const bottomRef           = useRef(null)

  const rc = ROLE_COLORS[rol] ?? ROLE_COLORS.ciudadano
  const roleColor = rc.hex
  const roleLight = rc.light

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
    <div className="flex flex-col h-full rounded-xl overflow-hidden ring-1"
      style={{ backgroundColor: 'white', borderColor: roleColor + '30' }}>

      {/* Header con color del rol */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: roleColor + '20', backgroundColor: roleLight }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: roleColor }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Asistente MedCity</p>
            <p className="text-xs text-gray-500">
              {barrioActivo ? `Analizando ${nombreBarrio}` : 'Selecciona un barrio'}
            </p>
          </div>
        </div>
        {historialChat.length > 0 && (
          <button
            onClick={limpiarChat}
            className="p-1.5 rounded-lg transition-colors text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="Limpiar conversación"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Historial de mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {/* Estado vacío: sugerencias contextuales */}
        {historialChat.length === 0 && !llmCargando && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 py-2 justify-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: roleLight, border: `1.5px solid ${roleColor}40` }}>
                <Bot size={15} style={{ color: roleColor }} />
              </div>
              <p className="text-xs text-gray-400">
                Pregunta sobre {nombreBarrio}
              </p>
            </div>
            {sugerencias.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => handleEnviar(s)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl ring-1 transition-all duration-150"
                style={{
                  backgroundColor: roleLight,
                  borderColor: roleColor + '30',
                  color: '#374151'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = roleColor + '20'
                  e.currentTarget.style.borderColor = roleColor + '60'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = roleLight
                  e.currentTarget.style.borderColor = roleColor + '30'
                }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Mensajes */}
        <AnimatePresence>
          {historialChat.map((msg, i) => (
            <Burbuja key={i} mensaje={msg} roleColor={roleColor} />
          ))}
        </AnimatePresence>

        {/* Respuesta en streaming */}
        {respuestaStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 mt-0.5 shrink-0"
              style={{ backgroundColor: roleColor + '20', border: `1.5px solid ${roleColor}40` }}>
              <Bot size={13} style={{ color: roleColor }} />
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5
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
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 shrink-0"
              style={{ backgroundColor: roleColor + '20' }}>
              <Bot size={13} style={{ color: roleColor }} />
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ backgroundColor: roleLight }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: roleColor }}
                    animate={{ y: [0, -5, 0], opacity: [1, 0.5, 1] }}
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
      <div className="px-3 pb-3 pt-2 border-t" style={{ borderColor: roleColor + '15' }}>

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
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-gray-50"
                  style={{ '--hover-color': roleLight }}
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
            onChange={e => handleInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviar()}
            placeholder="Pregunta lo que necesites..."
            disabled={llmCargando}
            className="flex-1 text-sm px-3 py-2.5 rounded-xl bg-gray-50
                       focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all ring-1"
            style={{ '--tw-ring-color': roleColor + '60' }}
            onFocus={e => e.target.style.boxShadow = `0 0 0 2px ${roleColor}40`}
            onBlur={e => e.target.style.boxShadow = 'none'}
          />
          <button
            onClick={() => handleEnviar()}
            disabled={llmCargando || !query.trim()}
            className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: query.trim() && !llmCargando ? roleColor : '#D1D5DB' }}
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
