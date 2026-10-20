import type { StyleName } from '../utils/style-labels'

export interface ArtSource {
  title: string
  institution: string
  url: string
}

export interface StyleKnowledge {
  name: StyleName
  englishName: string
  era: string
  summary: string
  characteristics: string[]
  representativePainters: string[]
  sources: ArtSource[]
  verifiedAt: string
}

export interface PainterPortrait {
  url: string
  source: ArtSource
  license: string
  credit: string
}

export interface PainterKnowledge {
  /** 保存于历史作品中的匹配键，修正译名请使用 displayName。 */
  name: string
  style: StyleName
  displayName: string
  era: string
  bio: string
  verified: boolean
  verificationNote: string
  sources: ArtSource[]
  verifiedAt: string
  portrait?: PainterPortrait
}
