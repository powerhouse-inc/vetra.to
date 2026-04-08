import { createLoader, parseAsArrayOf, parseAsString, parseAsStringLiteral } from 'nuqs/server'
import { packageModuleTypes } from '../constants'

export const filterParsers = {
  moduleTypes: parseAsArrayOf(parseAsStringLiteral(packageModuleTypes)),
  categories: parseAsArrayOf(parseAsString),
  publisherNames: parseAsArrayOf(parseAsString),
  search: parseAsString,
}

export const loadSearchParams = createLoader(filterParsers)
