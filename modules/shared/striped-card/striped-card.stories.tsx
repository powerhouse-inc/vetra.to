import { ArrowRight } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'
import {
  StripedCard,
  StripedCardAction,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from './striped-card'
import type { Meta, StoryObj } from '@storybook/nextjs'

const meta = {
  title: 'Shared/Components/StripedCard',
  component: StripedCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StripedCard>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <StripedCard style={{ width: 320 }}>
      <StripedCardHeader>
        <StripedCardTitle>Striped Card Title</StripedCardTitle>
      </StripedCardHeader>
      <StripedCardContent>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu
          tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.
        </p>
      </StripedCardContent>
    </StripedCard>
  ),
}

export const WithAction: Story = {
  render: () => (
    <StripedCard style={{ width: 320 }}>
      <StripedCardHeader className="py-0">
        <StripedCardTitle>Striped Card Title</StripedCardTitle>
        <StripedCardAction>
          <Button variant="ghost" className="group/action">
            Action{' '}
            <ArrowRight className="transition-transform duration-200 group-hover/action:translate-x-1" />
          </Button>
        </StripedCardAction>
      </StripedCardHeader>
      <StripedCardContent>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, urna eu
          tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisl quis neque.
        </p>
      </StripedCardContent>
    </StripedCard>
  ),
}
