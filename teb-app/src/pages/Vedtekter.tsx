import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText } from 'lucide-react'
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ERROR_TEXT } from '../components/feed/styles'
import VedtekterLayout from '../components/vedtekter/VedtekterLayout'
import { useVedtekter } from '../components/vedtekter/useVedtekter'
import { apiUrl } from '../lib/api'
import { getPdfLink, listForslag, type ForslagSummary, type Paragraf, type Vedtekter as Document } from '../lib/vedtekter'

const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

// "2026-10-26" as "26. oktober 2026"
const longDate = (day: string) => {
  const [year, month, date] = day.split('-').map(Number)
  return `${date}. ${MONTHS[month - 1]} ${year}`
}

// The PDF link works for an hour; a new one well before that
const LINK_REFRESH_MS = 45 * 60 * 1000

// The HTML from the build: paragraphs, lists, links to other paragraphs, footnotes and sources
const TEXT =
  'text-white/80 leading-relaxed [&_p+p]:mt-2 [&_p+ul]:mt-2 [&_p+ol]:mt-2 [&_ul+p]:mt-2 [&_ol+p]:mt-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-1 [&_a]:text-teb-orange [&_a]:underline-offset-2 hover:[&_a]:underline [&_sup]:text-[0.7em]'

const HEADINGS = ['text-2xl font-bold text-white', 'text-xl font-semibold text-white', 'text-lg font-semibold text-white', 'text-base font-semibold text-white']

// Proposals still open, by the paragraph they change
type Open = Map<string, ForslagSummary[]>

function Section({ paragraph, open }: { paragraph: Paragraf; open: Open }) {
  const Heading = (['h2', 'h3', 'h4', 'h5'] as const)[paragraph.niva - 1] ?? 'h5'
  const proposals = open.get(paragraph.id) ?? []
  return (
    <section className={paragraph.niva === 1 ? 'pt-6' : 'pt-4'}>
      <div className="group flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* Clear of the sticky header when jumped to */}
        <Heading id={paragraph.id} className={`scroll-mt-24 ${HEADINGS[paragraph.niva - 1] ?? HEADINGS[3]}`}>
          <a href={`#${paragraph.id}`} className="mr-2 text-teb-orange">
            § {paragraph.nummer}
          </a>
          <span dangerouslySetInnerHTML={{ __html: paragraph.tittelHtml }} />
        </Heading>
        {proposals.map(proposal => (
          <Link
            key={proposal.number}
            to={`/vedtekter/forslag/${proposal.number}`}
            className="rounded-full border border-teb-orange/40 px-2 py-0.5 text-xs font-semibold text-teb-orange-light hover:bg-teb-orange/10"
          >
            Forslag {proposal.number}
          </Link>
        ))}
        {/* On a screen without hover the link is always there */}
        <Link
          to={`/vedtekter/forslag/ny?endre=${paragraph.id}`}
          className="text-xs text-white/40 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          Foreslå endring
        </Link>
      </div>
      {paragraph.html && <div className={`mt-2 ${TEXT}`} dangerouslySetInnerHTML={{ __html: paragraph.html }} />}
      {paragraph.barn.map(child => (
        <Section key={child.id} paragraph={child} open={open} />
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

function Text({ token }: { token: string }) {
  const { document, error } = useVedtekter(token)
  const [pdf, setPdf] = useState<string | null>(null)
  const [open, setOpen] = useState<Open>(new Map())

  // A link the browser opens like any PDF, renewed while the page is open
  useEffect(() => {
    let active = true
    const fetchLink = () =>
      getPdfLink(token)
        .then(link => active && setPdf(apiUrl(link.url)))
        .catch(() => {})
    void fetchLink()
    const timer = window.setInterval(fetchLink, LINK_REFRESH_MS)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [token])

  useEffect(() => {
    let active = true
    listForslag(token)
      .then(list => {
        if (!active) return
        const byParagraph: Open = new Map()
        for (const proposal of list.forslag) {
          if (proposal.status !== 'utkast' && proposal.status !== 'innsendt') continue
          for (const change of proposal.changes) {
            if (change.type === 'legge-til') continue
            byParagraph.set(change.target, [...(byParagraph.get(change.target) ?? []), proposal])
          }
        }
        setOpen(byParagraph)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])

  // Jump to the paragraph in the address once the text is there
  useEffect(() => {
    if (!document || !window.location.hash) return
    window.document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView()
  }, [document])

  if (error) return <p className={`${ERROR_TEXT} mt-10 text-center`}>{error}</p>
  if (!document) return <p className="mt-10 text-center text-sm text-white/60">Henter vedtektene …</p>
  return <Full document={document} pdf={pdf} open={open} />
}

// The whole text, with the table of contents beside it
function Full({ document, pdf, open }: { document: Document; pdf: string | null; open: Open }) {
  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
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
                <a href={pdf} target="_blank" rel="noopener" className={BUTTON_PRIMARY}>
                  <FileText size={16} aria-hidden="true" />
                  Åpne PDF
                </a>
                <a href={`${pdf}&last-ned=1`} className={BUTTON_GHOST}>
                  <Download size={16} aria-hidden="true" />
                  Last ned
                </a>
              </>
            ) : (
              <span className="text-sm text-white/50">Henter PDF …</span>
            )}
            <Link to="/vedtekter/forslag/ny" className={BUTTON_GHOST}>
              Foreslå en endring
            </Link>
          </div>
          <div className={`mt-5 border-t border-white/10 pt-4 text-sm ${TEXT}`}>
            <p className="mb-1 font-semibold text-white">Sammendrag</p>
            <div dangerouslySetInnerHTML={{ __html: document.sammendrag }} />
          </div>
        </header>

        {document.paragrafer.map(paragraph => (
          <Section key={paragraph.id} paragraph={paragraph} open={open} />
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
          ). <Link to="/vedtekter/forslag" className="text-teb-orange hover:underline">Se forslagene til endringer</Link>.
        </p>
      </article>
    </div>
  )
}

// The vedtekter, for members: as text with every paragraph linkable, and as the PDF
export default function Vedtekter() {
  return <VedtekterLayout tab="tekst">{token => <Text token={token} />}</VedtekterLayout>
}
