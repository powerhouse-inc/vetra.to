export const ROUTES_WITH_BLUR_BACKGROUND = ['/networks']

export const hasBlurBackground = (pathname: string) =>
  ROUTES_WITH_BLUR_BACKGROUND.some((route) => pathname.startsWith(route))
