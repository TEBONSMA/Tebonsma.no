import { apiFetch } from './api'

// The vedtekter as the vedtekter repo builds them, for members only (the API's /vedtekter)
export interface Paragraf {
  id: string
  // "9.4"
  nummer: string
  niva: number
  tittel: string
  tittelHtml: string
  // The text as written in the repo, for proposals that change it
  kilde: string
  html: string
  barn: Paragraf[]
}

export interface Note {
  nummer: number
  html: string
}

export interface Vedtekter {
  tittel: string
  navn: string
  vedtatt: string
  versjon: string
  // YYYY-MM-DD: the last change
  dato: string
  commit: string
  publisert: string
  sammendrag: string
  paragrafer: Paragraf[]
  fotnoter: Note[]
  kilder: Note[]
}

export const getVedtekter = (token: string) => apiFetch<Vedtekter>('/vedtekter', token)

// A link the browser can open like any other PDF, for an hour
export const getPdfLink = (token: string) => apiFetch<{ url: string; utloper: string }>('/vedtekter/pdf/lenke', token)
