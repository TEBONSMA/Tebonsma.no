import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { members, type Member } from '../lib/members'
import Tag from './Tag'

const MembersGrid = () => {
  const [selected, setSelected] = useState<Member | null>(null)

  useEffect(() => {
    if (!selected) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [selected])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {members.map((member) => (
          <button
            key={member.handle ?? member.name}
            onClick={() => setSelected(member)}
            className="group text-left rounded-lg p-2 hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-full aspect-[3/4] rounded-md border border-white/10 bg-white/5 p-1.5">
              <div className="w-full h-full rounded-sm overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-300"
                />
              </div>
            </div>
            <div className="pt-2.5 px-0.5">
              <h3 className="text-sm font-semibold text-white truncate">{member.name}</h3>
              <p className="text-xs text-white/60 truncate">{member.role}</p>
              {member.handle && (
                <p className="font-mono text-[11px] text-white/40 truncate mt-0.5">{member.handle}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {createPortal(
        <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative max-w-3xl w-full max-h-[90vh] bg-neutral-900 border border-white/10 rounded-lg overflow-y-auto shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                aria-label="Lukk"
                className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex flex-col md:flex-row gap-6 p-6">
                <div className="w-full md:w-1/3 flex-shrink-0">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
                    <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="w-full md:w-2/3 flex flex-col gap-3 text-white md:max-h-[500px] md:overflow-y-auto">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{selected.name}</h2>
                    <p className="text-white/60 mt-1">{selected.role}</p>
                    {selected.handle && (
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-white/40 hover:text-white transition-colors inline-block mt-1"
                      >
                        {selected.handle}
                      </a>
                    )}
                  </div>

                  {selected.bio && (
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40 mb-1">Om</h3>
                      <p className="text-sm text-white/80 leading-relaxed">{selected.bio}</p>
                    </div>
                  )}

                  {selected.age && (
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40 mb-1">Alder</h3>
                      <p className="text-sm text-white/80">{selected.age} år</p>
                    </div>
                  )}

                  {selected.email && (
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40 mb-1">Kontakt</h3>
                      <a href={`mailto:${selected.email}`} className="text-sm text-white/80 hover:text-white transition-colors">
                        {selected.email}
                      </a>
                    </div>
                  )}

                  {selected.skills && selected.skills.length > 0 && (
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40 mb-2">Ferdigheter</h3>
                      <div className="flex flex-wrap gap-2">
                        {selected.skills.map((skill) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.achievements && selected.achievements.length > 0 && (
                    <div>
                      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40 mb-2">Prestasjoner</h3>
                      <div className="flex flex-wrap gap-2">
                        {selected.achievements.map((achievement) => (
                          <Tag key={achievement}>{achievement}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

export default MembersGrid
