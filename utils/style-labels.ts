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

const STYLE_TO_KEREMBERKE: Record<string, string> = Object.fromEntries(
  Object.entries(KEREMBERKE_TO_STYLE).map(([en, zh]) => [zh, en]),
)

/** keremberke label → 可读英文，如 Impressionism */
export function formatKeremberkeLabel(label: string): string {
  return label.replace(/_/g, ' ').trim()
}

/** 中文流派名 → 英文副标；优先 rawLabels[0]，兜底反查映射 */
export function getEnglishStyleName(
  zhName: string,
  rawLabels?: Array<{ label: string; score: number }>,
): string {
  if (rawLabels?.[0]?.label) {
    return formatKeremberkeLabel(rawLabels[0].label)
  }
  const key = STYLE_TO_KEREMBERKE[zhName.trim()]
  return key ? formatKeremberkeLabel(key) : ''
}

export const STYLE_NAMES = [
  ...new Set(Object.values(KEREMBERKE_TO_STYLE)),
].sort() as readonly string[]
