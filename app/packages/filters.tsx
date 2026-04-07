'use client'
import { useQueryState, useQueryStates } from 'nuqs'
import { filterParsers } from './lib/search-params'
import { packageModuleTypes } from './constants'
import { type PackageFilters, type PackageModuleType } from './types'
import { capitalCase } from 'change-case'

export function Filters(props: {
  moduleTypeOptions: PackageModuleType[];
  categoryOptions: string[];
  publisherNameOptions: string[];
}) {
  const { moduleTypeOptions, categoryOptions, publisherNameOptions } = props;
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
      <button onClick={clearFilters}>Clear filters</button>
      <Filter
        filterKey="moduleTypes"
        options={moduleTypeOptions}
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
  addFilter: (filterKey: TKey, value: TValues[number]) => void
  removeFilter: (filterKey: TKey, value: TValues[number]) => void
}) {
  const { filterKey, options, values, addFilter, removeFilter } = props
  console.log({ filterKey, options, values })
  return (
    <div>
      <h3 className="font-semibold">{capitalCase(filterKey)}</h3>
      {options.map((option) => (
        <div key={option} className='flex gap-2 align-middle'>
          <label htmlFor={option}>{capitalCase(option)}</label>
          <input
            id={option}
            type="checkbox"
            checked={(values as string[]).includes(option) ?? false}
            onChange={(e) => {
              if (e.currentTarget.checked) addFilter(filterKey, option)
              else removeFilter(filterKey, option)
            }}
          />
        </div>
      ))}
    </div>
  )
}
