'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import '@virtual-ds/components';

interface ComponentPreviewProps {
  componentId: string;
}

const Placeholder = () => (
  <p className="text-sm text-slate-500">Preview coming soon. Check Storybook for interactive examples.</p>
);

export default function ComponentPreview({ componentId }: ComponentPreviewProps) {
  const modalRef = useRef<HTMLElement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const buttonPreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      (modalRef.current as any).open = modalOpen;
    }
  }, [modalOpen]);

  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;
    const handleClose = () => setModalOpen(false);
    modalEl.addEventListener('ui-modal-close', handleClose as EventListener);
    return () => modalEl.removeEventListener('ui-modal-close', handleClose as EventListener);
  }, []);

  useEffect(() => {
    if (componentId !== 'button') {
      if (buttonPreviewRef.current) {
        const shadow = buttonPreviewRef.current.shadowRoot;
        if (shadow) {
          shadow.innerHTML = '';
        } else {
          buttonPreviewRef.current.innerHTML = '';
        }
      }
      return;
    }

    const container = buttonPreviewRef.current;
    if (!container) {
      return;
    }

    const shadowRoot = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '';

    const baseCss = document.createElement('link');
    baseCss.rel = 'stylesheet';
    baseCss.href = 'https://www.renesas.com/themes/kachow/dist/components/base/base.css?v=1.0.3';
    shadowRoot.appendChild(baseCss);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://www.renesas.com/themes/kachow/dist/components/button/button.css?v=1.0.3';
    shadowRoot.appendChild(link);

    const overrideStyle = document.createElement('style');
    overrideStyle.textContent = `
      .renesas-button-demo, .renesas-button-demo .c-button, .renesas-button-demo .c-button * {
        font-family: "DM Sans", sans-serif !important;
      }
    `;
    shadowRoot.appendChild(overrideStyle);

    const wrapper = document.createElement('div');
    wrapper.className = 'renesas-button-demo';
    wrapper.style.display = 'flex';
    wrapper.style.flexWrap = 'wrap';
    wrapper.style.gap = '0.75rem';
    wrapper.style.fontFamily = '"DM Sans", sans-serif';
    wrapper.innerHTML = `
      <button type="button" class="c-button c-button--primary">Primary</button>
      <button type="button" class="c-button c-button--secondary">Secondary</button>
      <button type="button" class="c-button c-button--ghost">Ghost</button>
      <button type="button" class="c-button c-button--primary" disabled>Disabled</button>
      <button type="button" data-toggle-button class="c-button c-button--primary c-button--toggle">Toggle me</button>
    `;
    shadowRoot.appendChild(wrapper);

    const toggleButton = wrapper.querySelector<HTMLButtonElement>('[data-toggle-button]');

    const handleToggle = () => {
      if (!toggleButton) return;
      toggleButton.classList.toggle('is-active');
      toggleButton.textContent = toggleButton.classList.contains('is-active') ? 'Active state' : 'Toggle me';
    };

    toggleButton?.addEventListener('click', handleToggle);

    return () => {
      toggleButton?.removeEventListener('click', handleToggle);
      shadowRoot.innerHTML = '';
    };
  }, [componentId]);

  const preview = useMemo(() => {
    switch (componentId) {
      case 'button':
        return <div ref={buttonPreviewRef} />;
      case 'accordion':
        return (
          <div className="docs-accordion-wrapper">
            <ui-accordion className="docs-accordion-preview">
              <ui-accordion-item heading="Design tokens">
                <p>Tokens ensure visual consistency across platforms.</p>
              </ui-accordion-item>
              <ui-accordion-item heading="Developer notes">
                <p>Each item exposes slot content and keyboard support.</p>
              </ui-accordion-item>
            </ui-accordion>
          </div>
        );
      case 'card':
        return (
          <ui-card variant="elevated">
            <span slot="header">Usage guidelines</span>
            <p>Cards group related content and offer optional actions.</p>
            <div slot="footer" className="flex gap-2">
              <ui-button variant="ghost" size="sm">
                Dismiss
              </ui-button>
              <ui-button size="sm">View details</ui-button>
            </div>
          </ui-card>
        );
      case 'modal':
        return (
          <div className="space-y-3">
            <ui-button onClick={() => setModalOpen(true)}>Open modal</ui-button>
            <ui-modal
              ref={(node) => {
                modalRef.current = node as HTMLElement | null;
              }}
              headline="Review changes"
              closable
            >
              <p>Double-check content, tokens, and a11y notes before publishing.</p>
              <div slot="footer" className="flex gap-2">
                <ui-button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </ui-button>
                <ui-button size="sm" onClick={() => setModalOpen(false)}>
                  Confirm
                </ui-button>
              </div>
            </ui-modal>
          </div>
        );
      case 'tabs':
        return (
          <ui-tabs selected-index="0">
            <ui-tab>Overview</ui-tab>
            <ui-tab>Usage</ui-tab>
            <ui-tab>Accessibility</ui-tab>

            <ui-tab-panel>
              <p>Use tabs to organize closely related information.</p>
            </ui-tab-panel>
            <ui-tab-panel>
              <p>Labels should be short and descriptive.</p>
            </ui-tab-panel>
            <ui-tab-panel>
              <p>Keyboard and ARIA patterns follow WAI-ARIA guidelines.</p>
            </ui-tab-panel>
          </ui-tabs>
        );
      case 'text-field':
        return (
          <div className="max-w-sm">
            <ui-text-field
              label="Email"
              placeholder="you@example.com"
              helper="We only use this to send release updates."
            ></ui-text-field>
          </div>
        );
      default:
        return <Placeholder />;
    }
  }, [componentId, modalOpen]);

  return <div className="w-full space-y-4">{preview}</div>;
}
