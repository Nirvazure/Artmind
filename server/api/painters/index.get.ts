import { paintersListData } from '../../data/painters-list'
import type { StyleName } from '../../../utils/style-labels'

export interface PainterItem {
  name: string
  style: StyleName
  verified?: boolean
}

const list = paintersListData

export default defineEventHandler((): PainterItem[] => list)
