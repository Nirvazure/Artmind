export type AnalysisUploadPhase = 'idle' | 'ready' | 'analyzing' | 'resolved'

export interface AnalysisUploadProps {
  phase: AnalysisUploadPhase
  canAnalyze: boolean
  loading: boolean
  fileName?: string
  previewUrl?: string
}
