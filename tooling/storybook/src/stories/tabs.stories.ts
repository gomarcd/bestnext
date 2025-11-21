import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import '@virtual-ds/components/src/components/ui-tabs';
import '@virtual-ds/components/src/components/ui-button';

interface TabsArgs {
  selectedIndex: number;
}

const meta: Meta<TabsArgs> = {
  title: 'Components/Tabs',
  tags: ['autodocs'],
  args: {
    selectedIndex: 0
  },
  render: ({ selectedIndex }) => html`
    <ui-tabs .selectedIndex=${selectedIndex} style="max-width: 40rem;">
      <ui-tab>Overview</ui-tab>
      <ui-tab>Guidelines</ui-tab>
      <ui-tab>Accessibility</ui-tab>

      <ui-tab-panel>
        <p>
          Tabs organize content by grouping related context into panels. Use short, descriptive labels and keep tab order consistent.
        </p>
      </ui-tab-panel>
      <ui-tab-panel>
        <ul>
          <li>Use sentence case capitalization for tab labels.</li>
          <li>Tabs should not wrap to multiple lines—consider another pattern if space is constrained.</li>
        </ul>
      </ui-tab-panel>
      <ui-tab-panel>
        <p>
          The component follows the WAI-ARIA authoring practices: roving tab index, arrow-key navigation, and `aria-selected` state management.
        </p>
      </ui-tab-panel>
    </ui-tabs>
  `
};

export default meta;
type Story = StoryObj<TabsArgs>;

export const Default: Story = {};

export const Preselected: Story = {
  args: {
    selectedIndex: 1
  }
};
