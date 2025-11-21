import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '@virtual-ds/components/src/components/ui-text-field';
import '@virtual-ds/components/src/components/ui-button';

interface TextFieldArgs {
  label: string;
  helper: string;
  error: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
}

const meta: Meta<TextFieldArgs> = {
  title: 'Components/Text Field',
  tags: ['autodocs'],
  args: {
    label: 'Email address',
    helper: 'We will never share your email.',
    error: '',
    placeholder: 'name@example.com',
    required: true,
    disabled: false
  },
  render: ({ label, helper, error, placeholder, required, disabled }) => html`
    <ui-text-field
      label=${label}
      helper=${helper}
      error=${error}
      placeholder=${placeholder}
      ?required=${required}
      ?disabled=${disabled}
    >
      <span slot="prefix" aria-hidden="true" style="color: var(--text-muted);">@</span>
    </ui-text-field>
  `
};

export default meta;
type Story = StoryObj<TextFieldArgs>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: 'Please enter a valid email address.'
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    required: false,
    helper: ''
  }
};
