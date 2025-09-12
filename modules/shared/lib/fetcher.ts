type FetchOptions = {
  cache?: RequestCache
  next?: NextFetchRequestConfig
}

type RequestInit = {
  headers: (HeadersInit & FetchOptions) | FetchOptions
}

export const fetcher = <TData, TVariables>(
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
) => {
  return async (): Promise<TData> => {
    const { next, cache, ...restOptions } = options || {}
    // TODO: move the URL to the .env file
    const res = await fetch('https://publish-dev-vpighsmr70zxa92r9w.herokuapp.com/graphql', {
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
