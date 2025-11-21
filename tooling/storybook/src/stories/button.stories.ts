import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import type { ButtonVariant, ButtonSize } from '@virtual-ds/components/src/components/ui-button';
import '@virtual-ds/components/src/components/ui-button';

interface ButtonArgs {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  fullWidth: boolean;
}

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  tags: ['autodocs'],
  args: {
    label: 'Primary action',
    variant: 'primary',
    size: 'md',
    disabled: false,
    fullWidth: false
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }]
      }
    }
  },
  render: ({ label, variant, size, disabled, fullWidth }) => html`
    <ui-button
      variant=${variant}
      size=${size}
      ?disabled=${disabled}
      ?full-width=${fullWidth}
    >
      ${label}
    </ui-button>
  `
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: 'Secondary'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    label: 'Ghost button'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled'
  }
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 1rem;">
      <ui-button size="sm">Small</ui-button>
      <ui-button size="md">Medium</ui-button>
      <ui-button size="lg">Large</ui-button>
    </div>
  `
};
