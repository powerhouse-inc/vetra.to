export interface CategoryStyle {
  border: string
  bg: string
  text: string
  dot: string
  label: string // for filter chip: "text bg border" combined
}

const categoryMap: Record<string, CategoryStyle> = {
  projectManagement: {
    border: 'border-t-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-400',
    label:
      'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  },
  analytics: {
    border: 'border-t-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-400',
    label:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
  },
  testing: {
    border: 'border-t-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400',
    label:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  },
  peopleCulture: {
    border: 'border-t-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-400',
    dot: 'bg-pink-400',
    label:
      'text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950 dark:border-pink-800',
  },
  collaboration: {
    border: 'border-t-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-400',
    label:
      'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950 dark:border-violet-800',
  },
  finance: {
    border: 'border-t-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-400',
    label:
      'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800',
  },
  governance: {
    border: 'border-t-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    dot: 'bg-cyan-400',
    label:
      'text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950 dark:border-cyan-800',
  },
  legal: {
    border: 'border-t-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-400',
    label:
      'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
  },
  engineering: {
    border: 'border-t-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-400',
    label:
      'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800',
  },
}

const fallbacks: CategoryStyle[] = [
  {
    border: 'border-t-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-400',
    label:
      'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  },
  {
    border: 'border-t-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-400',
    label:
      'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-800',
  },
  {
    border: 'border-t-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400',
    label:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  },
  {
    border: 'border-t-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    text: 'text-pink-700 dark:text-pink-400',
    dot: 'bg-pink-400',
    label:
      'text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950 dark:border-pink-800',
  },
  {
    border: 'border-t-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-400',
    dot: 'bg-violet-400',
    label:
      'text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950 dark:border-violet-800',
  },
]

const neutral: CategoryStyle = {
  border: 'border-t-gray-300',
  bg: 'bg-gray-50 dark:bg-gray-900/30',
  text: 'text-gray-600 dark:text-gray-400',
  dot: 'bg-gray-400',
  label:
    'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-800',
}

function hashCode(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getCategoryStyle(category: string | undefined) {
  if (!category) return neutral
  const key = category.replace(/[\s_-]+/g, '').replace(/^./, (c) => c.toLowerCase())
  if (categoryMap[key]) return categoryMap[key]
  return fallbacks[hashCode(category) % fallbacks.length]
}
