import { getArtKnowledge } from './art-knowledge'

type DirectoryLoader = () => Promise<{ data: { painters: Array<{ name: string; style: string }> } }>

export async function getPaintersByStyle(
  style: string,
  load: DirectoryLoader = getArtKnowledge,
): Promise<string[]> {
  try {
    const { data } = await load()
    return data.painters
      .filter((painter) => painter.style === style.trim())
      .map((painter) => painter.name)
  } catch {
    console.warn('[art-knowledge] Painter directory unavailable; classification continues')
    return []
  }
}

export async function getTopPaintersByStyle(
  style: string,
  n: number,
  load: DirectoryLoader = getArtKnowledge,
): Promise<string[]> {
  return (await getPaintersByStyle(style, load)).slice(0, Math.max(0, n))
}
