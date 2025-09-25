import slugifyLib from 'slugify'

/**
 * Slugify a text
 *
 * @param text - The text to slugify
 * @returns The slugified text
 */
export function slugify(text: string) {
  return slugifyLib(text, { lower: true })
}
