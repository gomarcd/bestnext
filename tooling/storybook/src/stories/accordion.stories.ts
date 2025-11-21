import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '@virtual-ds/components/src/components/ui-accordion';

interface AccordionArgs {
  multi: boolean;
}

const meta: Meta<AccordionArgs> = {
  title: 'Components/Accordion',
  tags: ['autodocs'],
  args: {
    multi: false
  },
  render: ({ multi }) => html`
    <ui-accordion ?multi=${multi} style="max-width: 32rem;">
      <ui-accordion-item heading="First section">
        <p>
          Accordions manage focus and keyboard navigation (Arrow keys, Home, End). Only one item is open at a time unless multi expansion is enabled.
        </p>
      </ui-accordion-item>
      <ui-accordion-item heading="Second section">
        <p>
          Components consume design tokens for colors, spacing, and typography so they stay in sync with the system.
        </p>
      </ui-accordion-item>
      <ui-accordion-item heading="Disabled section" disabled>
        <p>This section is disabled and cannot be expanded.</p>
      </ui-accordion-item>
    </ui-accordion>
  `
};

export default meta;
type Story = StoryObj<AccordionArgs>;

export const SingleExpand: Story = {};

export const MultiExpand: Story = {
  args: {
    multi: true
  }
};
