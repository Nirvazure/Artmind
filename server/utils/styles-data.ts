import { STYLE_NAMES, type StyleName } from '../../utils/style-labels'

export { KEREMBERKE_TO_STYLE, STYLE_NAMES } from '../../utils/style-labels'

export const DEFAULT_STYLE_COVER_URL = '/icon.png'

/** 流派默认封面（Wikimedia 公共领域画作） */
export const STYLE_COVER_URLS: Partial<Record<StyleName, string>> = {
  印象派:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
  立体主义:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Picasso_Guernica.jpg/640px-Picasso_Guernica.jpg',
  抽象表现主义:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Jackson_Pollock_-_Number_31_-_1950.jpg/640px-Jackson_Pollock_-_Number_31_-_1950.jpg',
  巴洛克:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Peter_Paul_Rubens_018.jpg/640px-Peter_Paul_Rubens_018.jpg',
  表现主义:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/The_Scream.jpg/640px-The_Scream.jpg',
  点彩派:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_-_1884.jpg/640px-Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_-_1884.jpg',
  浮世绘:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hokusai_The_Great_Wave_off_Kanagawa.jpg/640px-Hokusai_The_Great_Wave_off_Kanagawa.jpg',
  后印象派:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg',
  浪漫主义:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg/640px-Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg',
  洛可可:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Watteau_-_The_Embarkation_for_Cythera.jpg/640px-Watteau_-_The_Embarkation_for_Cythera.jpg',
  现实主义:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Millet_Angelus.jpg/640px-Millet_Angelus.jpg',
}

export function getStyleCoverMap(): Record<StyleName, string> {
  return Object.fromEntries(
    STYLE_NAMES.map((style) => [style, STYLE_COVER_URLS[style] ?? DEFAULT_STYLE_COVER_URL]),
  ) as Record<StyleName, string>
}
