import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

let accordionInstanceCounter = 0;

@customElement('ui-accordion')
export class UIAccordion extends LitElement {
  @property({ type: Boolean, reflect: true })
  multi = false;

  @state()
  private items: UIAccordionItem[] = [];

  private readonly instanceId = ++accordionInstanceCounter;

  static override styles = css`
    :host {
      display: block;
      border: 1px solid transparent;
      border-radius: var(--radius-md, 4px);
      background-color: var(--surface-background, #FFFFFF);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('ui-accordion-item-toggle', this.handleItemToggle as EventListener);
    this.addEventListener('keydown', this.handleKeydown as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('ui-accordion-item-toggle', this.handleItemToggle as EventListener);
    this.removeEventListener('keydown', this.handleKeydown as EventListener);
  }

  override render() {
    return html`<div role="presentation"><slot @slotchange=${this.handleSlotChange}></slot></div>`;
  }

  private handleSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const elements = slot
      .assignedElements({ flatten: true })
      .filter((el): el is UIAccordionItem => el instanceof UIAccordionItem);
    this.items = elements;
    this.items.forEach((item, index) => {
      const tabIndex = index === 0 ? 0 : -1;
      item.setAccordionContext({ accordionId: this.instanceId, tabIndex });
    });
  };

  private handleItemToggle = (event: CustomEvent<{ item: UIAccordionItem; open: boolean }>) => {
    const { item, open } = event.detail;
    const activeIndex = this.items.indexOf(item);
    if (!this.multi && open) {
      this.items.forEach((accordionItem) => {
        if (accordionItem !== item) {
          accordionItem.closePanel();
        }
      });
    }
    this.items.forEach((accordionItem, index) => {
      accordionItem.setAccordionContext({
        accordionId: this.instanceId,
        tabIndex: index === activeIndex ? 0 : -1
      });
    });
  };

  private handleKeydown = (event: KeyboardEvent) => {
    const targetButton = (event.target as HTMLElement)?.closest<HTMLButtonElement>('button[data-accordion-header]');
    if (!targetButton) return;

    const actionableItems = this.items.filter((item) => !item.disabled);
    const buttons = actionableItems
      .map((item) => item.headerButton)
      .filter((button): button is HTMLButtonElement => !!button);
    const currentIndex = buttons.findIndex((button) => button === targetButton);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % buttons.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = buttons.length - 1;
        break;
      default:
        nextIndex = null;
    }

    if (nextIndex != null && buttons[nextIndex]) {
      event.preventDefault();
      buttons[nextIndex].focus();
    }
  };
}

interface AccordionContext {
  accordionId: number;
  tabIndex: number;
}

@customElement('ui-accordion-item')
export class UIAccordionItem extends LitElement {
  private static counter = 0;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  heading = '';

  @state()
  private headerTabIndex = -1;

  private accordionId = 0;
  private uniqueId = ++UIAccordionItem.counter;

  private get headerId() {
    return `ui-accordion-header-${this.accordionId}-${this.uniqueId}`;
  }

  private get panelId() {
    return `ui-accordion-panel-${this.accordionId}-${this.uniqueId}`;
  }

  get headerButton(): HTMLButtonElement | null {
    return this.renderRoot?.querySelector('button[data-accordion-header]') ?? null;
  }

  static override styles = css`
    :host {
      display: block;
      border-top: 1px solid transparent;
    }

    :host(:first-of-type) {
      border-top: none;
    }

    button[data-accordion-header] {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: var(--spacing-sm, 0.75rem);
      width: 100%;
      padding: var(--spacing-sm, 0.75rem) var(--spacing-md, 1rem);
      cursor: pointer;
      background-color: var(--cmp-accordion-header-background, var(--surface-subtle, #F8FAFC));
      color: var(--cmp-accordion-header-foreground, var(--text-primary, #0F172A));
      font: inherit;
      text-align: left;
      border: none;
      border-radius: var(--radius-md, 4px);
      transition: background-color 0.2s ease;
    }

    button[data-accordion-header]:hover {
      background-color: var(--cmp-accordion-header-background-hover, rgba(15, 23, 42, 0.06));
    }

    button[data-accordion-header]:focus-visible {
      outline: 2px solid var(--border-focus, #2563EB);
      outline-offset: 2px;
    }

    button[data-accordion-header][disabled] {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .icon {
      transition: transform 0.2s ease;
      color: var(--cmp-accordion-header-icon, var(--text-secondary, #475569));
    }

    :host([open]) .icon {
      transform: rotate(180deg);
    }

    :host([open]) button[data-accordion-header] {
      background-color: var(--cmp-accordion-header-background-active, rgba(37, 82, 204, 0.12));
      color: var(--cmp-accordion-header-foreground-active, #0F172A);
    }

    .panel {
      padding: var(--spacing-sm, 0.75rem) var(--spacing-md, 1rem) var(--spacing-md, 1rem);
      color: var(--text-secondary, #475569);
      background-color: var(--cmp-accordion-panel-background, var(--surface-background, #FFFFFF));
    }

    .panel[hidden] {
      display: none;
    }
  `;

  setAccordionContext(context: AccordionContext) {
    this.accordionId = context.accordionId;
    this.headerTabIndex = context.tabIndex;
    this.requestUpdate();
  }

  override updated() {
    const button = this.headerButton;
    if (button) {
      button.tabIndex = this.headerTabIndex;
    }
  }

  override render() {
    const labelId = this.headerId;
    const panelId = this.panelId;

    return html`
      <button
        data-accordion-header
        id=${labelId}
        type="button"
        role="button"
        aria-controls=${panelId}
        aria-expanded=${this.open}
        ?disabled=${this.disabled}
        tabindex=${this.headerTabIndex}
        @click=${this.toggleOpen}
      >
        <span class="label">
          <slot name="heading">${this.heading}</slot>
        </span>
        <span class="icon" aria-hidden="true">⌄</span>
      </button>
      <div
        id=${panelId}
        class="panel"
        role="region"
        aria-labelledby=${labelId}
        ?hidden=${!this.open}
      >
        <slot></slot>
      </div>
    `;
  }

  openPanel() {
    if (this.disabled || this.open) return;
    this.open = true;
    this.dispatchToggleEvent();
  }

  closePanel() {
    if (this.disabled || !this.open) return;
    this.open = false;
    this.dispatchToggleEvent();
  }

  private toggleOpen = () => {
    if (this.disabled) return;
    this.open = !this.open;
    this.dispatchToggleEvent();
  };

  private dispatchToggleEvent() {
    this.dispatchEvent(
      new CustomEvent('ui-accordion-item-toggle', {
        bubbles: true,
        composed: true,
        detail: { item: this, open: this.open }
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-accordion': UIAccordion;
    'ui-accordion-item': UIAccordionItem;
  }
}
