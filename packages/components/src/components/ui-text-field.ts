import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

let textFieldCounter = 0;

/**
 * Accessible text field component with label, helper, and error messaging.
 */
@customElement('ui-text-field')
export class UITextField extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: String })
  name = '';

  @property({ type: String })
  value = '';

  @property({ type: String })
  type: 'text' | 'email' | 'password' | 'search' | 'url' = 'text';

  @property({ type: String })
  placeholder = '';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  helper = '';

  @property({ type: String })
  error = '';

  @property({ type: String })
  autocomplete?: string;

  @query('input')
  private inputElement!: HTMLInputElement | null;

  private readonly inputId = `ui-text-field-${++textFieldCounter}`;

  static override styles = css`
    :host {
      display: block;
      font: inherit;
      color: var(--text-primary, #0F172A);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xs, 0.25rem);
    }

    label {
      font-weight: var(--font-weight-medium, 500);
    }

    .control {
      display: flex;
      align-items: center;
      gap: var(--spacing-2xs, 0.25rem);
      border: 1px solid var(--cmp-text-field-border-default, #CBD5F5);
      border-radius: var(--radius-md, 4px);
      padding: 0 var(--spacing-sm, 0.75rem);
      background-color: var(--cmp-text-field-background, var(--surface-background, #FFFFFF));
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .control:focus-within {
      border-color: var(--cmp-text-field-border-focus, var(--border-focus, #2563EB));
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--cmp-text-field-border-focus, #2563EB) 20%, transparent);
    }

    :host([disabled]) .control {
      opacity: 0.7;
      cursor: not-allowed;
      background-color: var(--surface-muted, #E2E8F0);
    }

    input {
      flex: 1 1 auto;
      border: none;
      outline: none;
      font: inherit;
      padding: var(--spacing-2xs, 0.25rem) 0;
      background: transparent;
      color: inherit;
    }

    input::placeholder {
      color: var(--cmp-text-field-placeholder, var(--text-muted, #64748B));
    }

    :host([data-has-error]) .control {
      border-color: var(--cmp-text-field-border-error, #DC2626);
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.24);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--cmp-text-field-border-error, #DC2626) 20%, transparent);
    }

    .helper {
      color: var(--text-muted, #64748B);
      font-size: var(--font-size-sm, 0.875rem);
    }

    .error {
      color: var(--state-danger, #DC2626);
      font-size: var(--font-size-sm, 0.875rem);
    }
  `;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('error')) {
      if (this.error) {
        this.setAttribute('data-has-error', '');
      } else {
        this.removeAttribute('data-has-error');
      }
    }

    if (changed.has('value') && this.inputElement && this.inputElement.value !== this.value) {
      this.inputElement.value = this.value;
    }
  }

  override render() {
    const describedBy = [this.helper ? `${this.inputId}-helper` : '', this.error ? `${this.inputId}-error` : '']
      .filter(Boolean)
      .join(' ');

    return html`
      <div class="field">
        ${this.label
          ? html`<label for=${this.inputId}>${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : null}</label>`
          : null}
        <div class="control">
          <slot name="prefix"></slot>
          <input
            id=${this.inputId}
            .value=${this.value}
            name=${this.name || this.inputId}
            type=${this.type}
            placeholder=${this.placeholder}
            ?disabled=${this.disabled}
            ?required=${this.required}
            autocomplete=${ifDefined(this.autocomplete)}
            aria-invalid=${this.error ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy || undefined)}
            @input=${this.onInput}
            @change=${this.onChange}
          />
          <slot name="suffix"></slot>
        </div>
        ${this.helper ? html`<div class="helper" id=${`${this.inputId}-helper`}>${this.helper}</div>` : null}
        ${this.error ? html`<div class="error" id=${`${this.inputId}-error`}>${this.error}</div>` : null}
      </div>
    `;
  }

  private onInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  private onChange = () => {
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-text-field': UITextField;
  }
}
