import { paintersListData } from '../../data/painters-list'

export interface PainterItem {
  name: string
  style: string
  verified?: boolean
}

const list = paintersListData

export default defineEventHandler((): PainterItem[] => list)
