'use client'
import { useQueryStates } from 'nuqs'
import { filterParsers } from './lib/search-params'
import { type PackageFilters, type PackageModuleType } from './types'
import { capitalCase } from 'change-case'
import { Button } from '@/modules/shared/components/ui/button'
import { Search } from './search'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'

export function Filters(props: {
  moduleTypeOptions: PackageModuleType[]
  categoryOptions: string[]
  publisherNameOptions: string[]
}) {
  const { moduleTypeOptions, categoryOptions, publisherNameOptions } = props
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
    <div>
      <div className="flex align-middle">
        <h3>Filters</h3>
        <Button onClick={clearFilters}>Reset Filters</Button>
      </div>
      <Search />
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
      <Filter
        filterKey="categories"
        options={categoryOptions}
        values={categories ?? []}
        addFilter={addFilter}
        removeFilter={removeFilter}
      />
      <Filter
        filterKey="publisherNames"
        title="publishers"
        options={publisherNameOptions}
        values={publisherNames ?? []}
        addFilter={addFilter}
        removeFilter={removeFilter}
      />
    </div>
  )
}

function Filter<
  TKey extends keyof PackageFilters,
  TValues extends NonNullable<PackageFilters[TKey]>,
>(props: {
  filterKey: TKey
  options: TValues
  values: TValues
  title?: string;
  addFilter: (filterKey: TKey, value: TValues[number]) => void
  removeFilter: (filterKey: TKey, value: TValues[number]) => void
}) {
  const { filterKey, options, values, title, addFilter, removeFilter } = props
  return (
    <div>
      <h3 className="font-semibold">{capitalCase(title ?? filterKey)}</h3>
      <div className='bg-gray-50'>
        {options.map((option) => (
        <div key={option} className="flex justify-between items-center">
          <label htmlFor={option}>{capitalCase(option)}</label>
          <Checkbox
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
