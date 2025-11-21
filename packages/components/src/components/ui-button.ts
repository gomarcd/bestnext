import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * UI button component backed by design tokens.
 *
 * Tokens consumed:
 * - `--cmp-button-background-{default|hover|active|ghost|disabled}`
 * - `--cmp-button-foreground-{default|ghost|disabled}`
 * - `--cmp-button-border-radius`
 * - `--cmp-button-padding-inline`
 * - `--cmp-button-padding-block`
 */
@customElement('ui-button')
export class UIButton extends LitElement {
  @property({ type: String, reflect: true })
  variant: ButtonVariant = 'primary';

  @property({ type: String, reflect: true })
  size: ButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false;

  @property({ type: String })
  type: 'button' | 'submit' | 'reset' = 'button';

  static override styles = css`
    :host {
      display: inline-flex;
    }

    :host([full-width]) {
      width: 100%;
    }

    button {
      font: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--cmp-button-gap, 0.5rem);
      padding: var(--cmp-button-padding-block, 0.5rem) var(--cmp-button-padding-inline, 1rem);
      border-radius: var(--cmp-button-border-radius, 4px);
      border: 1px solid transparent;
      cursor: pointer;
      position: relative;
      transition: background-color var(--motion-duration-fast, 120ms) ease, color 120ms ease, box-shadow 120ms ease;
      background-color: var(--cmp-button-background-default, var(--brand-primary-600, #1D4ED8));
      color: var(--cmp-button-foreground-default, var(--surface-on-primary, #FFFFFF));
      min-height: 2.5rem;
      width: 100%;
    }

    :host(:not([full-width])) button {
      width: auto;
    }

    button:focus-visible {
      outline: 2px solid var(--border-focus, #2563EB);
      outline-offset: 2px;
    }

    button:hover:not(:disabled) {
      background-color: var(--cmp-button-background-hover, var(--brand-primary-500, #2563EB));
    }

    button:active:not(:disabled) {
      background-color: var(--cmp-button-background-active, var(--brand-primary-400, #3B82F6));
    }

    button:disabled {
      background-color: var(--cmp-button-background-disabled, #E2E8F0);
      color: var(--cmp-button-foreground-disabled, #94A3B8);
      cursor: not-allowed;
      box-shadow: none;
    }

    :host([variant='ghost']) button {
      background-color: var(--cmp-button-background-ghost, transparent);
      color: var(--cmp-button-foreground-ghost, var(--brand-primary-600, #2563EB));
      border-color: transparent;
    }

    :host([variant='ghost']) button:hover:not(:disabled) {
      background-color: var(--cmp-button-background-ghost-hover, rgba(37, 99, 235, 0.08));
    }

    :host([variant='secondary']) button {
      background-color: var(--cmp-button-background-secondary, var(--surface-subtle, #F8FAFC));
      color: var(--cmp-button-foreground-secondary, var(--brand-primary-600, #2563EB));
      border-color: var(--border-default, #CBD5F5);
    }

    :host([variant='secondary']) button:hover:not(:disabled) {
      background-color: var(--cmp-button-background-secondary-hover, rgba(37, 99, 235, 0.08));
    }

    :host([size='sm']) button {
      padding: calc(var(--cmp-button-padding-block, 0.5rem) - 0.125rem) calc(var(--cmp-button-padding-inline, 1rem) - 0.375rem);
      font-size: var(--font-size-sm, 0.875rem);
      min-height: 2.125rem;
    }

    :host([size='lg']) button {
      padding: calc(var(--cmp-button-padding-block, 0.5rem) + 0.25rem) calc(var(--cmp-button-padding-inline, 1rem) + 0.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      min-height: 3rem;
    }

    button ::slotted(ui-icon) {
      font-size: 1.25em;
    }
  `;

  override render() {
    return html`
      <button class="vds-button" type=${this.type} ?disabled=${this.disabled}>
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UIButton;
  }
}
