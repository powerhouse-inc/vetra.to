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

    const json = await res.json()

    if (json.errors) {
      const { message } = json.errors[0]

      throw new Error(message)
    }

    return json.data
  }
}
