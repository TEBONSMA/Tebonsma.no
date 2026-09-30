export interface GameConfig {
  slug: string
  title: string
  description: string
  thumbnail: string
  src: string
  aspectRatio: string
}

export const games: GameConfig[] = [
  {
    slug: 'flappy-teb',
    title: 'Flappy Teb',
    description: 'Fly Anders gjennom rørene og se hvor langt du kommer!',
    thumbnail: '/images/flappy/Jarritos-PNG-Pic-for-flappy.png',
    src: '/games/flappy-teb/index.html',
    aspectRatio: 'aspect-[2/3]',
  },
  {
    slug: 'snake-teb',
    title: 'Snake Teb',
    description: 'Før Schmid rundt brettet og jag Jarritos-flasker uten å bite deg selv!',
    thumbnail: '/images/flappy/Jarritos-PNG-Pic-for-flappy.png',
    src: '/games/snake-teb/index.html',
    aspectRatio: 'aspect-square',
  },
  {
    slug: '2048-teb',
    title: '2048 Teb',
    description: 'Slå sammen gjengen fra kontaktsiden og se hvor høyt du kommer!',
    thumbnail: '/images/contact/hacker.png',
    src: '/games/2048-teb/index.html',
    aspectRatio: 'aspect-[4/5]',
  },
]

export const getGameBySlug = (slug: string | undefined) =>
  games.find((game) => game.slug === slug)
