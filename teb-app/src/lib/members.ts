export interface Member {
  image: string
  name: string
  role: string
  handle?: string
  url?: string
  bio?: string
  age?: number
  email?: string
  skills?: string[]
  achievements?: string[]
}

export const members: Member[] = [
  {
    image: '/images/Gummert.jpg',
    name: 'Eirik "Peter" Engum',
    role: 'Generalkommisær',
    handle: '@eirik.engum',
    url: 'https://www.instagram.com/eirik.engum/',
    bio: 'TEBONSMAs egen Doktor Proktor. Det er hos Eirik, på toppen av sjetnemarka, de beste festene i Trondheim arrangeres.',
    age: 22,
    email: 'eirik@tebonsma.no',
    skills: ['Diagnosering', 'Kickflip', 'Tarmutleggelse'],
    achievements: ['Grunnlegger av TEBONSMA', 'Vinner av årets leder 2024'],
  },
  {
    image: '/images/Gøran.jpg',
    name: 'Oskar "Gjøran" Larsen',
    role: 'Generalsuperintendant',
    handle: '@larsen_oskar',
    url: 'https://www.instagram.com/larsen_oskar/',
    bio: 'Oskar er udugelig. Han er kjent for sin evne til å skape kaos og forvirring hvor enn han går.',
    age: 22,
    email: 'oskar@tebonsma.no',
    skills: ['Webutvikling', 'Design', 'Prosjektledelse'],
    achievements: ['Utvikler av TEBONSMA nettside', 'Flappy-Teb skaperen'],
  },
  {
    image: '/images/Garbae.jpg',
    name: 'Anders "Johan" Garberg',
    role: 'Buran Baddie',
    handle: '@andersmgar',
    url: 'https://www.instagram.com/andersmgar/',
    bio: 'Anders er helt håpløs. Han påstår han bor på Rosendal, men alle vet han bor på buran.',
    age: 22,
    skills: ['Lodding', 'Freak in the sheets', 'Økonomisk teft'],
    achievements: ['Beste Buran-beboer 2024'],
  },
  {
    image: '/images/Smid.jpg',
    name: 'Fredrik "Magne" Bjørge',
    role: 'Mann med hatt',
    handle: '@fredrikschmidbjorge',
    url: 'https://www.instagram.com/fredrikschmidbjorge/',
    bio: 'Fredrik er kjent for sin elegante stil og profesjonalitet.',
    age: 22,
    skills: ['GitHub', 'Sikkerhetsproffen', 'Infrarød struktur'],
    achievements: ['Hatt-maestro', 'Stilikon 2024'],
  },
  {
    image: '/images/Pete.jpg',
    name: 'Petter "Abraham" Lona',
    role: 'Promillepoliti',
    handle: '@petterlona',
    url: 'https://www.instagram.com/petterlona/',
    bio: 'Petter er vår egne Journalist. Grunnlegger av The Tebonsma Times. Har alltid en avisartikkel på lur.',
    age: 22,
    skills: ['Modig', 'Krøller', 'Anarkist'],
    achievements: ['Årets journalist 2024'],
  },
  {
    image: '/images/Bingo.jpg',
    name: 'Eivind "Kris" Sundet',
    role: 'Meksikaner',
    handle: '@eivind.f.sundet',
    url: 'https://www.instagram.com/eivind.f.sundet/',
    bio: 'Eivind er gjengens "moroklump". Har alltid en vits på lur, men vi forstår de egentlig aldri.',
    age: 22,
    skills: ['Dårlige vitser', 'Standup', 'Latino vibes'],
    achievements: ['Beste vits 2024'],
  },
  {
    image: '/images/Remi.jpg',
    name: 'Claus "Remi" Brøttem',
    role: 'Blitzkrieger',
    handle: '@clausloge',
    url: 'https://www.instagram.com/clausloge/',
    bio: 'Claus er 7-ende Claus i huset. Kommer fra Brøttem og er kjent for sin gård.',
    age: 22,
    skills: ['Bonde', 'Traktor', 'Saus'],
    achievements: ['Beste bonde 2024'],
  },
  {
    image: '/images/Slangen.jpg',
    name: 'August "Knut" Rø',
    role: 'Militærmann',
    handle: '@august.dyrendal',
    url: 'https://www.instagram.com/august.dyrendal/',
    bio: 'August er vår militant. Han er for tiden opp i nord og tjener fedrelandet.',
    age: 22,
    skills: ['Mot', 'Disiplin', 'Lojalitet'],
    achievements: ['Beste soldat 2024'],
  },
  {
    image: '/images/Adam.jpg',
    name: 'Theo "Adam" Holgersen',
    role: 'Alkohol-liker',
    handle: '@theoholgersen',
    url: 'https://www.instagram.com/theoholgersen/',
    bio: 'Theo er gutten som er mest alkohol-liker. Han kan et par ekstra ting om hver eneste vin på polet.',
    age: 22,
    skills: ['Vin', 'Adam', 'La vin'],
    achievements: ['Årets ansatt vinmonopolet 2024'],
  },
]
