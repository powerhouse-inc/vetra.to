interface FetchOptions {
  cache?: RequestCache
  next?: NextFetchRequestConfig
}

interface RequestInit {
  headers: (HeadersInit & FetchOptions) | FetchOptions
}

export const switchboardFetcher = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
) => {
  return graphqlFetcher<TData, TVariables>(
    process.env.NEXT_PUBLIC_SWITCHBOARD_URL,
    query,
    variables,
    options,
  )
}

type GraphQLResponse<TData> = {
  data?: TData
  errors?: Array<{ message?: string }>
}

const graphqlFetcher = <TData, TVariables>(
  url: string,
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
) => {
  return async (): Promise<TData> => {
    const { next, cache, ...restOptions } = options ?? {}
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...restOptions,
      },
      body: JSON.stringify({ query, variables }),
      next,
      cache,
    })

    const json = (await res.json()) as GraphQLResponse<TData>

    if (json.errors?.length) {
      throw new Error(json.errors[0].message ?? 'GraphQL error')
    }

    return json.data as TData
  }
}
