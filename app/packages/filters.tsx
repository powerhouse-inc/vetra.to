'use client'
import { useQueryStates } from 'nuqs'
import { filterParsers } from './lib/search-params'
import { type PackageFilters, type PackageModuleType } from './types'
import { capitalCase } from 'change-case'
import { Button } from '@/modules/shared/components/ui/button'
import { Search } from './search'
import { cn } from '@/modules/shared/lib/utils'
import { PackagesCheckbox } from './checkbox'

export function Filters(props: {
  moduleTypeOptions: PackageModuleType[]
  categoryOptions: string[]
  publisherNameOptions: string[]
}) {
  const { categoryOptions, publisherNameOptions } = props
  const [{ moduleTypes, categories, publisherNames }, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  })

  function clearFilters() {
    setFilters(null).catch(console.error)
  }

  function addFilter<TKey extends keyof PackageFilters>(
    key: TKey,
    value: NonNullable<PackageFilters[TKey]>[number],
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: [...new Set([...(prev[key] ?? []), value])],
    })).catch(console.error)
  }

  function removeFilter<TKey extends keyof PackageFilters>(
    key: TKey,
    value: NonNullable<PackageFilters[TKey]>[number],
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: [...new Set(prev[key]?.filter((v) => v !== value))],
    })).catch(console.error)
  }

  return (
    <div
      className="min-w-76 rounded-lg bg-white p-4"
      style={{
        boxShadow: '1px 4px 15px 0px #4A587340',
      }}
    >
      <div className="flex h-10 items-center justify-between text-sm">
        <h3 className="text-slate-60 h-fit w-fit font-semibold">Filters</h3>
        <Button
          onClick={clearFilters}
          variant="ghost"
          size="sm"
          className="font-semibold text-slate-400"
        >
          Reset Filters
        </Button>
      </div>
      <Search />
      <h3 className="mt-4 mb-2 font-bold">Modules</h3>
      <div className="rounded-md bg-slate-50 p-1">
        <Filter
          filterKey="moduleTypes"
          title="user experiences"
          options={['apps', 'editors']}
          values={moduleTypes ?? []}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
        <Filter
          filterKey="moduleTypes"
          title="document models"
          options={['documentModels']}
          values={moduleTypes ?? []}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
        <Filter
          filterKey="moduleTypes"
          title="data integrations"
          options={['subgraphs', 'processors']}
          values={moduleTypes ?? []}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
      </div>
      <h3 className="mt-4 mb-2 font-bold">Categories</h3>
      <div className="rounded-md bg-slate-50 p-1">
        <Filter
          filterKey="categories"
          options={categoryOptions}
          values={categories ?? []}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
      </div>
      <h3 className="mt-4 mb-2 font-bold">Publishers</h3>
      <div className="rounded-md bg-slate-50 p-1">
        <Filter
          filterKey="publisherNames"
          options={publisherNameOptions}
          values={publisherNames ?? []}
          addFilter={addFilter}
          removeFilter={removeFilter}
        />
      </div>
    </div>
  )
}

const colors = {
  purple: 'text-purple-700 bg-purple-50 border-purple-700',
  orange: 'text-orange-700 bg-orange-50 border-orange-700',
  red: 'text-red-700 bg-red-50 border-red-700',
  blue: 'text-blue-700 bg-blue-50 border-blue-700',
  green: 'text-green-700 bg-green-50 border-green-700',
} as const

function getLabelColorStyles(option: string, index: number) {
  if (option === 'documentModels') return colors.red
  if (option === 'editors' || option === 'apps') return colors.orange
  if (option === 'subgraphs' || option === 'processors') return colors.blue
  const colorsArray = Object.values(colors)
  const colorsCount = colorsArray.length
  const optionColorIndex = index % colorsCount
  return colorsArray[optionColorIndex]
}

function Filter<
  TKey extends keyof PackageFilters,
  TValues extends NonNullable<PackageFilters[TKey]>,
>(props: {
  filterKey: TKey
  options: TValues
  values: TValues
  title?: string
  addFilter: (filterKey: TKey, value: TValues[number]) => void
  removeFilter: (filterKey: TKey, value: TValues[number]) => void
}) {
  const { filterKey, options, values, title, addFilter, removeFilter } = props
  return (
    <div>
      {!!title && <h3 className="py-2 font-semibold">{capitalCase(title)}</h3>}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => (
          <div key={option} className="flex items-center justify-between">
            <label
              htmlFor={option}
              className={cn(
                'rounded-sm border-2 px-2 py-px text-sm font-semibold',
                getLabelColorStyles(option, index),
              )}
            >
              {capitalCase(option)}
            </label>
            <PackagesCheckbox
              id={option}
              checked={(values as string[]).includes(option) ?? false}
              onCheckedChange={(checked) => {
                if (checked) addFilter(filterKey, option)
                else removeFilter(filterKey, option)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
