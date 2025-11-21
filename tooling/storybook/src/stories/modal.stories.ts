import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

import type { ModalCloseDetail } from '@virtual-ds/components/src/components/ui-modal';
import '@virtual-ds/components/src/components/ui-modal';
import '@virtual-ds/components/src/components/ui-button';

interface ModalArgs {
  headline: string;
  closable: boolean;
}

const meta: Meta<ModalArgs> = {
  title: 'Components/Modal',
  tags: ['autodocs'],
  args: {
    headline: 'Review changes',
    closable: true
  },
  render: ({ headline, closable }) => {
    const modalId = `storybook-modal-${Math.random().toString(36).slice(2, 7)}`;
    const openModal = () => {
      const modal = document.getElementById(modalId) as HTMLElement & { openModal?: () => void };
      modal?.openModal?.();
    };

    const handleClose = (event: CustomEvent<ModalCloseDetail>) => {
      // eslint-disable-next-line no-console
      console.log('Modal closed', event.detail);
    };

    return html`
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <ui-button @click=${openModal}>Open modal</ui-button>
        <ui-modal
          id=${modalId}
          .headline=${headline}
          ?closable=${closable}
          @ui-modal-close=${handleClose}
        >
          <p>
            Review the updates before publishing a new release of the component library. Accessibility tests must pass before the release pipeline continues.
          </p>
          <div slot="footer">
            <ui-button variant="ghost" size="sm">Cancel</ui-button>
            <ui-button size="sm">Confirm</ui-button>
          </div>
        </ui-modal>
      </div>
    `;
  }
};

export default meta;
type Story = StoryObj<ModalArgs>;

export const Default: Story = {};

export const NonClosable: Story = {
  args: {
    closable: false
  }
};
