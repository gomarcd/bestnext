import type { Preview } from '@storybook/web-components';
import { html } from 'lit';

import '@virtual-ds/tokens/css';
import '@virtual-ds/components';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
    a11y: {
      options: {
        runOnly: ['wcag2aa']
      }
    }
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Design token theme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme ?? 'light';
      return html`<div data-theme=${theme} class="story-wrapper">${story()}</div>`;
    }
  ]
};

export default preview;
