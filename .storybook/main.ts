import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../modules/**/*.mdx', '../modules/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-themes',
  ],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
  webpackFinal(config) {
    if (config.module?.rules) {
      const imageRule = config.module.rules.find(
        (rule) =>
          typeof rule === 'object' && rule?.test instanceof RegExp && rule.test.test('.svg'),
      )
      if (imageRule && typeof imageRule === 'object') {
        imageRule.exclude = /\.svg$/
      }

      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      })
    }

    return config
  },
}

export default config
