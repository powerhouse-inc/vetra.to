export function splitInRows<T = unknown>(arr: T[], rowLength: number): T[][] {
  const result: T[][] = []

  for (let i = 0; i < arr?.length; i += rowLength) {
    const row = arr.slice(i, i + rowLength)
    result.push(row)
  }

  return result
}
