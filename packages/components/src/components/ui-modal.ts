import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

let modalCounter = 0;

export interface ModalCloseDetail {
  reason: 'escape' | 'backdrop' | 'close-button' | 'programmatic';
}

const FOCUSABLE = '[tabindex]:not([tabindex="-1"]), button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"], [role="link"], [data-focusable]';

@customElement('ui-modal')
export class UIModal extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String })
  headline = '';

  @property({ type: Boolean, reflect: true })
  closable = true;

  @query('[data-modal]')
  private modalElement!: HTMLElement | null;

  @state()
  private hasDescription = false;

  private readonly labelId = `ui-modal-title-${++modalCounter}`;
  private readonly descId = `ui-modal-desc-${modalCounter}`;
  private previouslyFocused: Element | null = null;

  static override styles = css`
    :host {
      position: fixed;
      inset: 0;
      display: contents;
      z-index: 1040;
    }

    :host(:not([open])) .portal {
      display: none;
    }

    .portal {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
    }

    .backdrop {
      position: absolute;
      inset: 0;
      background-color: var(--cmp-modal-backdrop, rgba(15, 23, 42, 0.6));
      backdrop-filter: blur(2px);
    }

    .dialog {
      position: relative;
      min-width: min(90vw, 24rem);
      max-width: min(90vw, 40rem);
      max-height: 90vh;
      overflow: auto;
      border-radius: var(--radius-lg, 8px);
      background-color: var(--cmp-modal-background, var(--surface-background, #FFFFFF));
      box-shadow: var(--cmp-modal-shadow, 0 24px 48px rgba(15, 23, 42, 0.2));
      padding: var(--spacing-lg, 1.5rem);
      color: var(--text-primary, #0F172A);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md, 1rem);
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-md, 1rem);
    }

    h2 {
      margin: 0;
      font-size: var(--font-size-xl, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
    }

    button[data-close] {
      border: none;
      background: transparent;
      color: var(--text-muted, #64748B);
      cursor: pointer;
      padding: var(--spacing-2xs, 0.25rem);
      border-radius: var(--radius-sm, 2px);
    }

    button[data-close]:focus-visible {
      outline: 2px solid var(--border-focus, #2563EB);
      outline-offset: 2px;
    }

    footer {
      margin-top: auto;
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm, 0.75rem);
    }

    footer:empty {
      display: none;
    }
  `;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('open')) {
      if (this.open) {
        this.previouslyFocused = document.activeElement;
        this.updateComplete.then(() => {
          this.focusFirstElement();
        });
      } else {
        this.restoreFocus();
      }
    }
  }

  override render() {
    return html`
      <div class="portal" aria-hidden=${this.open ? 'false' : 'true'}>
        <div class="backdrop" @click=${this.onBackdropClick}></div>
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby=${this.headline ? this.labelId : undefined}
          aria-describedby=${this.hasDescription ? this.descId : undefined}
          data-modal
          tabindex="-1"
          @keydown=${this.onKeydown}
        >
          <header>
            <div>
              ${this.headline
                ? html`<h2 id=${this.labelId}>${this.headline}</h2>`
                : html`<slot name="header"></slot>`}
              <div id=${this.descId} ?hidden=${!this.hasDescription}>
                <slot name="description" @slotchange=${this.onDescriptionSlot}></slot>
              </div>
            </div>
            ${this.closable
              ? html`<button data-close type="button" aria-label="Close" @click=${() => this.requestClose('close-button')}>&times;</button>`
              : null}
          </header>
          <div class="body">
            <slot></slot>
          </div>
          <footer>
            <slot name="footer"></slot>
          </footer>
        </section>
      </div>
    `;
  }

  openModal() {
    if (!this.open) {
      this.open = true;
    }
  }

  closeModal(reason: ModalCloseDetail['reason'] = 'programmatic') {
    if (this.open) {
      this.requestClose(reason, false);
    }
  }

  private focusFirstElement() {
    const dialog = this.modalElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
    if (focusable.length) {
      focusable[0].focus();
    } else {
      dialog.focus();
    }
  }

  private restoreFocus() {
    if (this.previouslyFocused instanceof HTMLElement) {
      this.previouslyFocused.focus();
    }
    this.previouslyFocused = null;
  }

  private onBackdropClick = () => {
    if (!this.closable) return;
    this.requestClose('backdrop');
  };

  private onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.closable) {
      event.stopPropagation();
      event.preventDefault();
      this.requestClose('escape');
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  };

  private trapFocus(event: KeyboardEvent) {
    const dialog = this.modalElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  }

  private onDescriptionSlot = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const hasContent = slot.assignedNodes({ flatten: true }).some((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim();
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        return true;
      }
      return false;
    });
    this.hasDescription = hasContent;
  };

  private requestClose(reason: ModalCloseDetail['reason'], allowPrevent = true) {
    if (!this.open) return;
    const event = new CustomEvent<ModalCloseDetail>('ui-modal-request-close', {
      bubbles: true,
      composed: true,
      cancelable: allowPrevent,
      detail: { reason }
    });

    const shouldClose = this.dispatchEvent(event);
    if (!shouldClose && allowPrevent) {
      return;
    }

    this.open = false;
    this.dispatchEvent(
      new CustomEvent<ModalCloseDetail>('ui-modal-close', {
        bubbles: true,
        composed: true,
        detail: { reason }
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-modal': UIModal;
  }
}
