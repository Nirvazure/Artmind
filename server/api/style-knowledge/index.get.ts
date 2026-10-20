import { knowledgeForRequest } from '../../utils/art-knowledge'

export default defineEventHandler(async (event) => (await knowledgeForRequest(event)).styles)
