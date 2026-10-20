import { knowledgeForRequest } from '../../utils/art-knowledge'
import type { PainterKnowledge } from '../../../types/art-knowledge'

export type PainterItem = PainterKnowledge

export default defineEventHandler(
  async (event): Promise<PainterItem[]> => (await knowledgeForRequest(event)).painters,
)
