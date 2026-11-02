export function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const next = [...list]
  const [item] = next.splice(index, 1)
  next.splice(index + direction, 0, item)
  return next
}

export const removeItem = <T,>(list: T[], index: number): T[] => list.filter((_, i) => i !== index)

export const replaceItem = <T,>(list: T[], index: number, item: T): T[] => list.map((x, i) => (i === index ? item : x))
