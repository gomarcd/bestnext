import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type CardVariant = 'elevated' | 'outlined' | 'subtle';

/**
 * Card container component that provides consistent spacing and surface styles.
 */
@customElement('ui-card')
export class UICard extends LitElement {
  @property({ type: String, reflect: true })
  variant: CardVariant = 'elevated';

  @property({ type: Boolean, reflect: true })
  interactive = false;

  static override styles = css`
    :host {
      display: block;
      background-color: var(--cmp-card-background, var(--surface-background, #FFFFFF));
      border: 1px solid var(--cmp-card-border, #E2E8F0);
      border-radius: var(--radius-lg, 8px);
      padding: var(--cmp-card-padding, var(--spacing-lg, 1.5rem));
      box-shadow: var(--cmp-card-shadow, 0 4px 8px rgba(15, 23, 42, 0.08));
      color: var(--text-primary, #0F172A);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    :host([variant='outlined']) {
      box-shadow: none;
      border-color: var(--cmp-card-border, #CBD5F5);
    }

    :host([variant='subtle']) {
      background-color: var(--surface-subtle, #F8FAFC);
      box-shadow: none;
      border-color: transparent;
    }

    :host([interactive]) {
      cursor: pointer;
    }

    :host([interactive]):hover {
      box-shadow: var(--cmp-card-shadow-hover, 0 6px 18px rgba(15, 23, 42, 0.12));
      transform: translateY(-2px);
    }

    header {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      margin-bottom: var(--spacing-sm, 0.75rem);
      color: inherit;
    }

    header:empty,
    footer:empty {
      display: none;
    }

    footer {
      margin-top: var(--spacing-md, 1rem);
      color: var(--text-secondary, #475569);
    }
  `;

  override render() {
    return html`
      <article part="container">
        <header part="header">
          <slot name="header"></slot>
        </header>
        <div part="body">
          <slot></slot>
        </div>
        <footer part="footer">
          <slot name="footer"></slot>
        </footer>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-card': UICard;
  }
}
