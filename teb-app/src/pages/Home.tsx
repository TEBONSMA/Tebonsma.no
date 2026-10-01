import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import MediaBetweenText from '../components/fancy/blocks/media-between-text'
import WallOfLove from '../components/WallOfLove'
import EventsSection from '../components/EventsSection'
import FAQ from '../components/FAQ'
import Reveal from '../components/Reveal'
import FeedPreview from '../components/feed/FeedPreview'

const Home = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
  const faqItems = [
    {
      id: 1,
      question: 'Hvor ofte har dere arrangementer?',
      answer: "Vi har 3 arrangementer i året: Pulebord i desember, Nyttårsaften og Sommerfesten. Sommerfesten er et offentlig arrangment hvor venner er invitert. De to andre er kun for medlemmer."
    },
    {
      id: 2,
      question: 'Hvor mange medlemmer har dere?',
      answer: 'Per nå har vi 9 medlemmer i TEBONSMA. Vi holder medlemskapet eksklusivt for å sikre en tett og god atmosfære blant medlemmene.'
    },
    {
      id: 3,
      question: 'Hvor morsom er egentlig Anders "Johann" Mo Garberg?',
      answer: 'Anders er ganske tullete av seg og bidrar ofte til god stemning på våre arrangementer. Han er kjent for morsomme utsagn en gang i blant.'
    },
    {
      id: 4,
      question: 'Har dere merch?',
      answer: 'Vi har ikke offisiell merch for øyeblikket, men vi er en slags ambassadør for Jarritos, så vi serverer alltid Jarritos på våre arrangementer! Du vil derfor se oss i merch fra Jarritos av og til.'
    },
    {
      id: 5,
      question: 'Hvem er det som er minst morsom i TEBONSMA?',
      answer: 'Det er hard konkurranse her, men mange vil nok si at Fredrik Schmid Bjørge tar den tittelen. Han prøver virkelig sitt beste.'
    },
    {
      id: 6,
      question: 'Hvordan kan jeg nå ut til dere?',
      answer: 'Du kan kontakte oss via e-post på post@tebonsma.no eller finne oss på sosiale medier. Vi ser frem til å høre fra deg!'
    }
  ]

  return (
    <Layout mainClassName="flex flex-col items-center p-8 pt-24">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-6 mb-4">
        <Badge>Etablert 2021</Badge>
        <h1 className="text-6xl md:text-8xl font-bold text-teb-orange tracking-tight">
          TEBONSMA
        </h1>
        <p className="text-lg md:text-xl text-white/70 max-w-xl">
          En eksklusiv vennegjeng dedikert til ærlighet, transparens og uforglemmelige arrangementer.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            to="/kalender"
            className="inline-flex items-center justify-center rounded-md bg-teb-orange px-6 py-3 text-sm font-semibold text-white hover:bg-teb-orange-light transition-colors"
          >
            Se arrangementer
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors"
          >
            Om oss
          </Link>
        </div>
      </div>

      {/* Latest posts from the members */}
      <FeedPreview />

      {/* Events */}
      <Reveal className="w-full">
        <EventsSection />
      </Reveal>

      {/* FAQ Section */}
      <Reveal className="w-full">
        <FAQ items={faqItems} />
      </Reveal>

      {/* Wall of Love Section */}
      <Reveal className="w-full">
        <WallOfLove />
      </Reveal>

      {/* Media Between Text */}
      <Reveal className="max-w-4xl mx-auto mb-2">
        <MediaBetweenText
          firstText="That's a nice"
          secondText="jarritos"
          mediaUrl="/images/Jarritos-PNG-Pic.png"
          mediaType="image"
          alt="jarritos"
          triggerType="hover"
          className="text-3xl md:text-4xl font-semibold text-white/90 justify-center items-center"
          animationVariants={{
            initial: { width: '0', opacity: 0},
            animate: { width: '10%', opacity: 1 },
          }}
          leftTextClassName="text-white/90"
          rightTextClassName="text-teb-orange font-bold"
          mediaContainerClassName="mx-1.5 h-16 overflow-hidden rounded-lg"
          mediaLink="https://www.jarritos.com/"
          mediaLinkTarget="_blank"
        />
      </Reveal>
    </Layout>
  )
}

export default Home