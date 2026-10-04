// TebBet, the members' betting site for events, is its own app at bet.tebonsma.no
export const TEBBET_URL = 'https://bet.tebonsma.no'

export const tebbetEventLink = (id: string) => `${TEBBET_URL}/arrangement/${encodeURIComponent(id)}`
