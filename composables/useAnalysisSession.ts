import type { Artwork, ArtworkAnalysisResult } from '~/stores/artwork'
import { ref, shallowRef } from 'vue'

export interface AnalysisDisplayResult extends ArtworkAnalysisResult {
  imageUrl?: string
}

export type AnalysisSubject =
  { type: 'artwork'; artwork: Artwork } | { type: 'local-file'; file: File; previewUrl: string }

export type AnalysisPhase = 'idle' | 'running' | 'error'
export type PersistPhase = 'idle' | 'saving' | 'updating'

function resultFromArtwork(artwork: Artwork): AnalysisDisplayResult | null {
  if (!artwork.analysisResult) return null
  return {
    ...artwork.analysisResult,
    imageUrl: artwork.imageUrl,
  }
}

export function useAnalysisSession() {
  const subject = shallowRef<AnalysisSubject | null>(null)
  const activeResult = ref<AnalysisDisplayResult | null>(null)
  const analysisPhase = ref<AnalysisPhase>('idle')
  const persistPhase = ref<PersistPhase>('idle')
  const errorMessage = ref('')
  let requestVersion = 0

  function nextRequest(): number {
    requestVersion += 1
    return requestVersion
  }

  function isCurrentRequest(requestId: number): boolean {
    return requestId === requestVersion
  }

  function invalidateRequests() {
    requestVersion += 1
  }

  function cancelAnalysis() {
    invalidateRequests()
    analysisPhase.value = 'idle'
  }

  function clearResult() {
    activeResult.value = null
  }

  function beginAnalysis(): number {
    const requestId = nextRequest()
    errorMessage.value = ''
    analysisPhase.value = 'running'
    return requestId
  }

  function resolveAnalysis(requestId: number, result: AnalysisDisplayResult): boolean {
    if (!isCurrentRequest(requestId)) return false
    activeResult.value = result
    analysisPhase.value = 'idle'
    errorMessage.value = ''
    return true
  }

  function rejectAnalysis(requestId: number, message: string): boolean {
    if (!isCurrentRequest(requestId)) return false
    analysisPhase.value = 'error'
    errorMessage.value = message
    return true
  }

  function setArtwork(artwork: Artwork, options: { preserveResult?: boolean } = {}) {
    subject.value = { type: 'artwork', artwork }
    errorMessage.value = ''
    if (options.preserveResult && activeResult.value) return
    activeResult.value = resultFromArtwork(artwork)
  }

  function syncRouteArtwork(artwork: Artwork) {
    const isSameArtwork =
      subject.value?.type === 'artwork' && subject.value.artwork.id === artwork.id
    setArtwork(artwork, { preserveResult: isSameArtwork })
  }

  function setLocalFile(file: File, previewUrl: string) {
    invalidateRequests()
    subject.value = { type: 'local-file', file, previewUrl }
    activeResult.value = null
    analysisPhase.value = 'idle'
    errorMessage.value = ''
  }

  function commitSavedArtwork(artwork: Artwork, fallbackResult?: AnalysisDisplayResult | null) {
    invalidateRequests()
    subject.value = { type: 'artwork', artwork }
    activeResult.value = resultFromArtwork(artwork) ?? fallbackResult ?? activeResult.value
    analysisPhase.value = 'idle'
    errorMessage.value = ''
  }

  function setPersistPhase(phase: PersistPhase) {
    persistPhase.value = phase
  }

  return {
    subject,
    activeResult,
    analysisPhase,
    persistPhase,
    errorMessage,
    beginAnalysis,
    cancelAnalysis,
    clearResult,
    commitSavedArtwork,
    invalidateRequests,
    isCurrentRequest,
    rejectAnalysis,
    resolveAnalysis,
    setArtwork,
    setLocalFile,
    setPersistPhase,
    syncRouteArtwork,
  }
}
