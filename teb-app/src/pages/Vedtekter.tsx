import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT } from '../components/feed/styles'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { getVedtekter, getVedtekterPdf, type Paragraf, type Vedtekter as Document } from '../lib/vedtekter'

const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

// "2026-10-26" as "26. oktober 2026"
const longDate = (day: string) => {
  const [year, month, date] = day.split('-').map(Number)
  return `${date}. ${MONTHS[month - 1]} ${year}`
}

// The HTML from the build: paragraphs, lists, links to other paragraphs, footnotes and sources
const TEXT =
  'text-white/80 leading-relaxed [&_p+p]:mt-2 [&_p+ul]:mt-2 [&_p+ol]:mt-2 [&_ul+p]:mt-2 [&_ol+p]:mt-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-1 [&_a]:text-teb-orange [&_a]:underline-offset-2 hover:[&_a]:underline [&_sup]:text-[0.7em]'

const HEADINGS = ['text-2xl font-bold text-white', 'text-xl font-semibold text-white', 'text-lg font-semibold text-white', 'text-base font-semibold text-white']

function Section({ paragraph }: { paragraph: Paragraf }) {
  const Heading = (['h2', 'h3', 'h4', 'h5'] as const)[paragraph.niva - 1] ?? 'h5'
  return (
    <section className={paragraph.niva === 1 ? 'pt-6' : 'pt-4'}>
      {/* Clear of the sticky header when jumped to */}
      <Heading id={paragraph.id} className={`scroll-mt-24 ${HEADINGS[paragraph.niva - 1] ?? HEADINGS[3]}`}>
        <a href={`#${paragraph.id}`} className="mr-2 text-teb-orange">
          § {paragraph.nummer}
        </a>
        <span dangerouslySetInnerHTML={{ __html: paragraph.tittelHtml }} />
      </Heading>
      {paragraph.html && <div className={`mt-2 ${TEXT}`} dangerouslySetInnerHTML={{ __html: paragraph.html }} />}
      {paragraph.barn.map(child => (
        <Section key={child.id} paragraph={child} />
      ))}
    </section>
  )
}

const Contents = ({ paragraphs }: { paragraphs: Paragraf[] }) => (
  <ol className="mt-3 space-y-1.5 text-sm">
    {paragraphs.map(paragraph => (
      <li key={paragraph.id}>
        <a href={`#${paragraph.id}`} className="text-white/60 hover:text-white">
          <span className="mr-1.5 text-white/40">§ {paragraph.nummer}</span>
          {paragraph.tittel}
        </a>
      </li>
    ))}
  </ol>
)

// The vedtekter, for members: as text with every paragraph linkable, and as the PDF
export default function Vedtekter() {
  const { user, isLoading, login } = useAuth()
  const token = user?.access_token ?? null
  const [document, setDocument] = useState<Document | null>(null)
  const [pdf, setPdf] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let active = true
    getVedtekter(token)
      .then(loaded => active && setDocument(loaded))
      .catch(err => active && setError(err instanceof ApiError && err.status === 404 ? 'Vedtektene er ikke lagt ut ennå.' : String(err.message ?? err)))
    return () => {
      active = false
    }
  }, [token])

  // The PDF needs the login too, so it is fetched here and opened from memory
  useEffect(() => {
    if (!token || !document) return
    let url: string | null = null
    let active = true
    getVedtekterPdf(token)
      .then(blob => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setPdf(url)
      })
      .catch(() => {})
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [token, document])

  // Jump to the paragraph in the address once the text is there
  useEffect(() => {
    if (!document || !window.location.hash) return
    window.document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView()
  }, [document])

  return (
    <Layout mainClassName="w-full max-w-5xl mx-auto px-4 pt-24 pb-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge>Vedtekter</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Vedtektene</h1>
        <p className="text-white/70 max-w-xl">Reglene TEBONSMA er bygget på. Bare for medlemmer.</p>
      </div>

      {!token ? (
        <div className={`${CARD} mx-auto mt-10 max-w-md p-6 text-center`}>
          <p className="text-sm text-white/70">Logg inn for å lese vedtektene.</p>
          <button type="button" className={`${BUTTON_PRIMARY} mt-4`} onClick={() => login()} disabled={isLoading}>
            Logg inn
          </button>
        </div>
      ) : error ? (
        <p className={`${ERROR_TEXT} mt-10 text-center`}>{error}</p>
      ) : !document ? (
        <p className="mt-10 text-center text-sm text-white/60">Henter vedtektene …</p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {/* Folded on a phone, so the text comes first; always there beside it on a wide screen */}
            <details className={`${CARD} p-4 lg:hidden`}>
              <summary className="cursor-pointer text-sm font-semibold text-white">Innhold</summary>
              <Contents paragraphs={document.paragrafer} />
            </details>
            <nav aria-label="Innhold" className="hidden lg:block">
              <p className="text-sm font-semibold text-white">Innhold</p>
              <Contents paragraphs={document.paragrafer} />
            </nav>
          </aside>

          <article className="min-w-0">
            <header className={`${CARD} p-5`}>
              <p className="text-lg text-white/80">{document.tittel}</p>
              <p className="text-2xl font-bold text-white">{document.navn}</p>
              <p className="mt-2 text-sm text-white/60">
                {document.vedtatt} · Versjon {document.versjon}, {longDate(document.dato)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {pdf ? (
                  <>
                    <a href={pdf} target="_blank" rel="noreferrer" className={BUTTON_PRIMARY}>
                      <FileText size={16} aria-hidden="true" />
                      Åpne PDF
                    </a>
                    <a href={pdf} download={`Vedtekter ${document.navn}.pdf`} className={BUTTON_GHOST}>
                      <Download size={16} aria-hidden="true" />
                      Last ned
                    </a>
                  </>
                ) : (
                  <span className="text-sm text-white/50">Henter PDF …</span>
                )}
              </div>
              <div className={`mt-5 border-t border-white/10 pt-4 text-sm ${TEXT}`}>
                <p className="mb-1 font-semibold text-white">Sammendrag</p>
                <div dangerouslySetInnerHTML={{ __html: document.sammendrag }} />
              </div>
            </header>

            {document.paragrafer.map(paragraph => (
              <Section key={paragraph.id} paragraph={paragraph} />
            ))}

            {(document.fotnoter.length > 0 || document.kilder.length > 0) && (
              <footer className="mt-10 space-y-6 border-t border-white/10 pt-6 text-sm">
                {document.fotnoter.length > 0 && (
                  <section>
                    <h2 className="font-semibold text-white">Fotnoter</h2>
                    <ol className="mt-2 space-y-1">
                      {document.fotnoter.map(note => (
                        <li key={note.nummer} id={`fotnote-${note.nummer}`} className={`scroll-mt-24 ${TEXT}`}>
                          <a href={`#fotnote-${note.nummer}-tilbake`} className="mr-2">
                            {note.nummer}
                          </a>
                          <span dangerouslySetInnerHTML={{ __html: note.html }} />
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {document.kilder.length > 0 && (
                  <section>
                    <h2 className="font-semibold text-white">Kilder</h2>
                    <ol className="mt-2 space-y-1">
                      {document.kilder.map(source => (
                        <li key={source.nummer} id={`kilde-${source.nummer}`} className={`scroll-mt-24 break-words ${TEXT}`}>
                          <span className="mr-2 text-white/50">[{source.nummer}]</span>
                          <span dangerouslySetInnerHTML={{ __html: source.html }} />
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </footer>
            )}

            <p className="mt-10 text-sm text-white/50">
              Vedtektene kan bare endres på årsmøtet, med 2/3 flertall (
              <a href="#vedtektsendring" className="text-teb-orange hover:underline">
                § 3.3
              </a>
              ).
            </p>
          </article>
        </div>
      )}
    </Layout>
  )
}
