import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import type { CardVariant } from '@virtual-ds/components/src/components/ui-card';
import '@virtual-ds/components/src/components/ui-card';
import '@virtual-ds/components/src/components/ui-button';

interface CardArgs {
  variant: CardVariant;
  interactive: boolean;
}

const meta: Meta<CardArgs> = {
  title: 'Components/Card',
  tags: ['autodocs'],
  args: {
    variant: 'elevated',
    interactive: false
  },
  render: ({ variant, interactive }) => html`
    <ui-card variant=${variant} ?interactive=${interactive} style="max-width: 28rem;">
      <span slot="header">Design System</span>
      <p>
        Cards group related content and actions. They respect container spacing tokens and adapt to surface themes automatically.
      </p>
      <div slot="footer">
        <ui-button variant="ghost" size="sm">Secondary</ui-button>
        <ui-button size="sm">Primary</ui-button>
      </div>
    </ui-card>
  `
};

export default meta;
type Story = StoryObj<CardArgs>;

export const Elevated: Story = {};

export const Outlined: Story = {
  args: {
    variant: 'outlined'
  }
};

export const Subtle: Story = {
  args: {
    variant: 'subtle'
  }
};

export const Interactive: Story = {
  args: {
    interactive: true
  }
};
