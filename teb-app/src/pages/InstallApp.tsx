import { useEffect, type ReactNode } from 'react'
import Badge from '../components/Badge'
import Layout from '../components/Layout'
import { CARD } from '../components/feed/styles'

const Steps = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className={`${CARD} p-5`}>
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-white/75 leading-relaxed">{children}</ol>
  </section>
)

// How to put the site on the home screen as an app, and turn on notifications there
const InstallApp = () => {
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <Layout mainClassName="w-full max-w-3xl mx-auto px-4 pt-24 pb-16 space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <Badge>App</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-teb-orange tracking-tight">Installer appen</h1>
        <p className="text-white/70 max-w-xl">
          Legg TEBONSMA på hjemskjermen. Da åpner den som en egen app og kan gi deg varsler, også når den er lukket.
        </p>
      </div>

      <div className="grid gap-4">
        <Steps title="iPhone og iPad">
          <li>Åpne tebonsma.no i Safari.</li>
          <li>Trykk på Del-knappen (firkanten med pil opp). Ser du den ikke, trykk på «…» først.</li>
          <li>Velg «Legg til på Hjem-skjerm». Står det «Åpne som nettapp», la den være på. Trykk «Legg til».</li>
          <li>Åpne TEBONSMA fra Hjem-skjermen og logg inn. Appen har sin egen innlogging, så du logger inn én gang til der.</li>
        </Steps>
        <Steps title="Android">
          <li>Åpne tebonsma.no i Chrome.</li>
          <li>Trykk på menyen (de tre prikkene) og velg «Installer app» eller «Legg til på startskjermen».</li>
          <li>Åpne TEBONSMA fra startskjermen.</li>
        </Steps>
        <Steps title="PC og Mac">
          <li>Åpne tebonsma.no i Chrome eller Edge.</li>
          <li>Klikk på installer-ikonet til høyre i adressefeltet, eller velg «Installer TEBONSMA» i menyen.</li>
        </Steps>
        <section className={`${CARD} p-5 space-y-3 text-white/75 leading-relaxed`}>
          <h2 className="text-lg font-semibold text-white">Varsler</h2>
          <p>
            Trykk på klokka øverst og velg «Slå på» nederst i lista. Da får du beskjed om kommentarer og svar, nye arrangementer og
            kunngjøringer. På iPhone og iPad kommer varsler bare til appen på Hjem-skjermen, og den må ha iOS 16.4 eller nyere.
          </p>
          <p>
            BetTeb er en egen app. Installer den fra{' '}
            <a href="https://bet.tebonsma.no/slik-fungerer-det#app" className="text-teb-orange hover:underline">
              bet.tebonsma.no
            </a>{' '}
            på samme måte.
          </p>
        </section>
      </div>
    </Layout>
  )
}

export default InstallApp
