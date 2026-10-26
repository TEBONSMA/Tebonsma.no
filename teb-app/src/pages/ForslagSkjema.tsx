import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ERROR_TEXT } from '../components/feed/styles'
import ForslagForm, { type FormValues } from '../components/vedtekter/ForslagForm'
import VedtekterLayout from '../components/vedtekter/VedtekterLayout'
import { draftAt, draftOf, type Draft } from '../components/vedtekter/changes'
import { useVedtekter } from '../components/vedtekter/useVedtekter'
import { errorMessage } from '../lib/feed'
import {
  createForslag,
  getForslag,
  listForslag,
  submitForslag,
  toInput,
  updateForslag,
  type Arsmote,
  type Forslag,
  type Vedtekter,
} from '../lib/vedtekter'

// The changes a new proposal starts with, from the link that led here: a paragraph to change,
// delete or add after or under, or a proposal to amend
function startingChanges(document: Vedtekter, params: URLSearchParams, parent: Forslag | null): Draft[] {
  if (parent) return parent.changes.map(change => draftOf(toInput(change)))
  for (const [param, type] of [
    ['endre', 'endre'],
    ['slette', 'slette'],
    ['etter', 'legge-til'],
  ] as const) {
    const id = params.get(param)
    if (id) return [draftAt(document, type, id)]
  }
  const under = params.get('under')
  if (under) return [{ ...draftAt(document, 'legge-til', under), position: 'under' }]
  return [draftAt(document, 'endre', '')]
}

function useArsmote(token: string) {
  const [arsmote, setArsmote] = useState<Arsmote | null>(null)
  useEffect(() => {
    let active = true
    listForslag(token)
      .then(list => active && setArsmote(list.arsmote))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [token])
  return arsmote
}

function New({ token }: { token: string }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { document, error } = useVedtekter(token)
  const arsmote = useArsmote(token)
  const amend = Number(params.get('endringsforslag')) || null
  const [parent, setParent] = useState<Forslag | null>(null)
  const [parentError, setParentError] = useState<string | null>(null)

  useEffect(() => {
    if (!amend) return
    let active = true
    getForslag(token, amend)
      .then(loaded => active && setParent(loaded))
      .catch(err => active && setParentError(errorMessage(err)))
    return () => {
      active = false
    }
  }, [token, amend])

  if (error || parentError) return <p className={`${ERROR_TEXT} mt-10 text-center`}>{error ?? parentError}</p>
  if (!document || (amend && !parent)) return <p className="mt-10 text-center text-sm text-white/60">Henter vedtektene …</p>

  const save = async (values: FormValues, submit: boolean) => {
    const made = await createForslag(token, { ...values, submit, ...(parent && { parent: parent.number }) })
    navigate(`/vedtekter/forslag/${made.number}`)
  }

  return (
    <ForslagForm
      document={document}
      heading={parent ? `Endringsforslag til forslag ${parent.number}` : 'Nytt forslag til endring av vedtektene'}
      initial={{ title: parent ? parent.title : '', reason: '', changes: startingChanges(document, params, parent) }}
      arsmote={arsmote}
      actions={[
        { label: 'Lagre som utkast', submit: false },
        { label: 'Send inn', submit: true, primary: true },
      ]}
      onSave={save}
      onCancel={() => navigate(parent ? `/vedtekter/forslag/${parent.number}` : '/vedtekter/forslag')}
    />
  )
}

function Edit({ token, number }: { token: string; number: number }) {
  const navigate = useNavigate()
  const { document, error } = useVedtekter(token)
  const arsmote = useArsmote(token)
  const [proposal, setProposal] = useState<Forslag | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getForslag(token, number)
      .then(loaded => active && setProposal(loaded))
      .catch(err => active && setLoadError(errorMessage(err)))
    return () => {
      active = false
    }
  }, [token, number])

  if (error || loadError) return <p className={`${ERROR_TEXT} mt-10 text-center`}>{error ?? loadError}</p>
  if (!document || !proposal) return <p className="mt-10 text-center text-sm text-white/60">Henter forslaget …</p>
  if (!proposal.can.edit) return <p className={`${ERROR_TEXT} mt-10 text-center`}>Du kan ikke endre dette forslaget.</p>

  const save = async (values: FormValues, submit: boolean) => {
    await updateForslag(token, number, values)
    if (submit) await submitForslag(token, number)
    navigate(`/vedtekter/forslag/${number}`)
  }

  return (
    <ForslagForm
      document={document}
      heading={`Rediger forslag ${number}`}
      initial={{ title: proposal.title, reason: proposal.reason, changes: proposal.changes.map(change => draftOf(toInput(change))) }}
      arsmote={arsmote}
      actions={
        proposal.status === 'utkast'
          ? [
              { label: 'Lagre utkast', submit: false },
              { label: 'Lagre og send inn', submit: true, primary: true },
            ]
          : [{ label: 'Lagre', submit: false, primary: true }]
      }
      onSave={save}
      onCancel={() => navigate(`/vedtekter/forslag/${number}`)}
    />
  )
}

// A new proposal, or an amendment to one
export function NyttForslag() {
  return <VedtekterLayout tab="forslag">{token => <New token={token} />}</VedtekterLayout>
}

export function RedigerForslag() {
  const number = Number(useParams().number)
  return <VedtekterLayout tab="forslag">{token => <Edit key={number} token={token} number={number} />}</VedtekterLayout>
}
