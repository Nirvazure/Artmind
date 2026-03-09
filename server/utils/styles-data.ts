/** keremberke/yolov8m-painting-classification 27 流派 -> 中文 */
export const KEREMBERKE_TO_STYLE: Record<string, string> = {
  Abstract_Expressionism: '抽象表现主义',
  Action_painting: '行动绘画',
  Analytical_Cubism: '分析立体主义',
  Art_Nouveau_Modern: '新艺术运动',
  Baroque: '巴洛克',
  Color_Field_Painting: '色域绘画',
  Contemporary_Realism: '当代现实主义',
  Cubism: '立体主义',
  Early_Renaissance: '早期文艺复兴',
  Expressionism: '表现主义',
  Fauvism: '野兽派',
  High_Renaissance: '盛期文艺复兴',
  Impressionism: '印象派',
  Mannerism_Late_Renaissance: '样式主义',
  Minimalism: '极简主义',
  Naive_Art_Primitivism: '素人艺术',
  New_Realism: '新现实主义',
  Northern_Renaissance: '北方文艺复兴',
  Pointillism: '点彩派',
  Pop_Art: '波普艺术',
  Post_Impressionism: '后印象派',
  Realism: '现实主义',
  Rococo: '洛可可',
  Romanticism: '浪漫主义',
  Symbolism: '象征主义',
  Synthetic_Cubism: '综合立体主义',
  Ukiyo_e: '浮世绘',
}

/** AI 可识别的 27 种艺术流派（中文名，去重后顺序固定） */
export const STYLE_NAMES = [
  ...new Set(Object.values(KEREMBERKE_TO_STYLE)),
].sort() as readonly string[]

/** 流派默认封面（无本地作品时使用，部分为公共领域画作） */
export const STYLE_COVER_URLS: Partial<Record<string, string>> = {
  印象派: '/starry-night.jpg',
  立体主义: '/guernica.jpg',
  抽象表现主义: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Jackson_Pollock_-_Number_31_-_1950.jpg/640px-Jackson_Pollock_-_Number_31_-_1950.jpg',
  巴洛克: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Peter_Paul_Rubens_018.jpg/640px-Peter_Paul_Rubens_018.jpg',
  表现主义: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/The_Scream.jpg/640px-The_Scream.jpg',
  点彩派: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_-_1884.jpg/640px-Georges_Seurat_-_A_Sunday_on_La_Grande_Jatte_-_1884.jpg',
  浮世绘: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Hokusai_The_Great_Wave_off_Kanagawa.jpg/640px-Hokusai_The_Great_Wave_off_Kanagawa.jpg',
  后印象派: '/starry-night.jpg',
  浪漫主义: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg/640px-Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg',
  洛可可: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Watteau_-_The_Embarkation_for_Cythera.jpg/640px-Watteau_-_The_Embarkation_for_Cythera.jpg',
  现实主义: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Millet_Angelus.jpg/640px-Millet_Angelus.jpg',
}
