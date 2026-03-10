import paintersListData from '../../data/painters-list.json'

export interface PainterItem {
  name: string
  style: string
  verified?: boolean
}

/** 编译时导入，确保 Vercel 等 serverless 环境下可用 */
const list = paintersListData as Array<{ name: string; style: string; verified?: boolean }>

export default defineEventHandler((): PainterItem[] => list)
