// This file is a workaround for Storybook's RSC, it is a copy/paste from the docs so keep it as is
/* eslint-disable @typescript-eslint/promise-function-async */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { Decorator } from '@storybook/nextjs'

export type DecoratorStory = Parameters<Decorator>[0]

const DEBUG = false
const LOG_FILTER: string | null = null

let storyPromises: Record<string, Promise<React.ReactNode>> = {}

function getComponentName(reactElement: React.JSX.Element | string | symbol) {
  if (typeof reactElement === 'string') return reactElement
  if (typeof reactElement === 'symbol') return reactElement.description as string

  if (
    '__docgenInfo' in reactElement &&
    'displayName' in (reactElement.__docgenInfo as { displayName?: string })
  ) {
    return (reactElement.__docgenInfo as { displayName: string }).displayName
  }

  if (typeof reactElement.type === 'string') return reactElement.type
  if (typeof reactElement.type === 'undefined') return '*'
  if (typeof reactElement.type === 'symbol') return reactElement.type.description as string

  if ('name' in reactElement.type) return reactElement.type.name as string

  return getComponentName(reactElement.type)
}

function shouldLog(test: string) {
  if (!DEBUG) return false

  if (LOG_FILTER === null || LOG_FILTER.length === 0) return true

  return test.includes(LOG_FILTER)
}

function logWrapperFactory(label: string) {
  const wrapper = function logWrapper(...params: unknown[]) {
    if (!shouldLog(label)) return

    // biome-ignore lint/suspicious/noConsole: Debugging
    console.log(label, '|', ...params)
  }

  wrapper.meta = { label }

  return wrapper
}

function elementIsAsync(element: React.JSX.Element) {
  return typeof element.type === 'function' && element.type.constructor.name === 'AsyncFunction'
}

function traverse(
  reactElement: React.JSX.Element,
  reactElementPropsPassed: unknown,
  previousLabel?: string,
): React.ReactNode | Promise<React.ReactNode> {
  const reactElementProps = Array.isArray(reactElementPropsPassed)
    ? reactElementPropsPassed.at(0)
    : reactElementPropsPassed

  const componentName = getComponentName(reactElement) ?? '*'

  const label = previousLabel ? `${previousLabel} > ${componentName}` : componentName

  // biome-ignore lint/suspicious/noConsole: Debugging
  shouldLog(label) && console.log('starting =======>', label)

  const logWrapper = logWrapperFactory(label)

  logWrapper('reactElement', typeof reactElement === 'function' ? 'function' : reactElement)
  logWrapper(
    'reactElement.type',
    typeof reactElement.type,
    typeof reactElement.type === 'function' ? 'function' : reactElement.type,
  )
  logWrapper('reactElementProps', reactElementProps)

  const isString = typeof reactElement === 'string'
  const noChildren = !reactElementProps?.children
  const stringChildren = typeof reactElementProps?.children === 'string'
  const noType = reactElement.type === undefined
  const isSvg = componentName === 'svg'
  const isAsync = elementIsAsync(reactElement)

  if (
    !isAsync &&
    (isSvg ||
      noChildren ||
      stringChildren ||
      (noType && stringChildren) ||
      (isString && noChildren))
  ) {
    logWrapper('termination condition reached')

    return reactElement
  }

  if (isAsync) {
    logWrapper('is an async component')

    if (storyPromises[label] !== undefined) {
      logWrapper('promise exists', storyPromises[label])

      return storyPromises[label]
    }

    const elementResult = reactElement
      .type(reactElementProps)
      .then((child: React.JSX.Element) => {
        logWrapper('async result', child)

        return traverse(child, child.props, label)
      })
      .catch((err: unknown) => {
        throw err
      })

    storyPromises[label] = elementResult
    return elementResult
  }

  const children: React.JSX.Element[] = !Array.isArray(reactElementProps.children)
    ? [reactElementProps.children]
    : reactElementProps.children

  // const traversedChildren = traverseChildren(children, logWrapper);
  const traversedChildren = children.map((c) => traverse(c, c.props, logWrapper.meta.label))

  logWrapper('traversedChildren', traversedChildren)
  logWrapper('for:', reactElement)

  return {
    ...reactElement,
    props: {
      ...reactElement.props,
      children: traversedChildren,
    },
  }
}

let storyId = ''

/**
 * Used to prevent infinite re-renders of async RSC. Supports nested async RSC.
 *
 * Modified from https://github.com/storybookjs/storybook/issues/30317#issuecomment-2615462131
 *
 * This decorator expects the root component to be async.
 *
 * @example
 *
 * ```
 * async function MyComponent() {
 * 	return new Promise(resolve => {
 * 		setTimeout(() => {
 * 			resolve(<div>My Component</div>);
 * 		}, 2000);
 * 	});
 * }
 *
 * const meta = {
 * 	decorators: [ReactServerComponentDecorator],
 * } satisfies Meta<typeof MyComponent>;
 * ```
 *
 * This decorator must also be the first decorator in the array for story meta.
 *
 * @example
 * No additional decorators on individual stories
 *
 * ```
 * const meta = {
 * 	decorators: [ReactServerComponentDecorator, SomeOtherDecorator],
 * } satisfies Meta<typeof MyComponent>;
 *
 * export default meta;
 * type Story = StoryObj<typeof meta>;
 *
 * export const MyStory: Story = {};
 * ```
 *
 * @example
 * Additional decorators on individual stories
 *
 * ```
 * const meta = {
 * 	decorators: [SomeOtherDecorator],
 * } satisfies Meta<typeof MyComponent>;
 *
 * export default meta;
 * type Story = StoryObj<typeof meta>;
 *
 * export const MyStory: Story = {
 * 	decorators: [ReactServerComponentDecorator, StorySpecificDecorator],
 * };
 * ```
 */
export function withReactServerComponentDecorator(Story: DecoratorStory) {
  const storyObj = Story()
  const decoratorStoryId = storyObj.props.id

  if (storyId !== decoratorStoryId) {
    storyId = decoratorStoryId
    storyPromises = {}
  }

  return {
    ...storyObj,
    type: (args: unknown) => {
      const rootStoryElement = storyObj.type(args)

      return {
        ...rootStoryElement,
        type: (args2: unknown) => {
          const promises = Object.values(storyPromises)

          if (promises.length > 0) return promises.at(0)

          return traverse(rootStoryElement, args2)
        },
      }
    },
  }
}
