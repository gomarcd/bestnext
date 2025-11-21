import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

let tabsCounter = 0;

@customElement('ui-tabs')
export class UITabs extends LitElement {
  @property({ type: Number, reflect: true, attribute: 'selected-index' })
  selectedIndex = 0;

  @state()
  private tabs: UITab[] = [];

  @state()
  private panels: UITabPanel[] = [];

  private readonly instanceId = ++tabsCounter;

  static override styles = css`
    :host {
      display: block;
      color: var(--text-primary, #0F172A);
    }

    .tablist {
      display: flex;
      gap: var(--spacing-xs, 0.5rem);
      border-bottom: 1px solid var(--border-default, #CBD5F5);
    }

    ::slotted(ui-tab) {
      flex: none;
    }

    .panels {
      margin-top: var(--spacing-md, 1rem);
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('ui-tab-activate', this.onTabActivate as EventListener);
    this.addEventListener('keydown', this.onKeydown as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('ui-tab-activate', this.onTabActivate as EventListener);
    this.removeEventListener('keydown', this.onKeydown as EventListener);
  }

  override render() {
    return html`
      <div class="tablist" role="tablist">
        <slot name="tab" @slotchange=${this.onTabsSlotChange}></slot>
      </div>
      <div class="panels">
        <slot name="panel" @slotchange=${this.onPanelsSlotChange}></slot>
      </div>
    `;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('selectedIndex')) {
      this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, Math.max(this.tabs.length - 1, 0)));
      this.syncAssociations();
    }
  }

  private onTabsSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const elements = slot
      .assignedElements({ flatten: true })
      .filter((el): el is UITab => el instanceof UITab);
    this.tabs = elements;
    this.syncAssociations();
  };

  private onPanelsSlotChange = (event: Event) => {
    const slot = event.target as HTMLSlotElement;
    const elements = slot
      .assignedElements({ flatten: true })
      .filter((el): el is UITabPanel => el instanceof UITabPanel);
    this.panels = elements;
    this.syncAssociations();
  };

  private syncAssociations() {
    this.tabs.forEach((tab, index) => {
      tab.setContext({
        index,
        selected: index === this.selectedIndex,
        tabsId: this.instanceId,
        panelId: this.panels[index]?.panelId(this.instanceId, index)
      });
    });

    this.panels.forEach((panel, index) => {
      panel.setContext({
        index,
        selected: index === this.selectedIndex,
        tabsId: this.instanceId,
        tabId: this.tabs[index]?.tabId(this.instanceId, index)
      });
    });
  }

  private onTabActivate = (event: CustomEvent<{ index: number }>) => {
    const { index } = event.detail;
    if (index === this.selectedIndex) return;
    this.selectedIndex = index;
    this.syncAssociations();
    this.dispatchEvent(
      new CustomEvent('ui-tabs-change', {
        bubbles: true,
        composed: true,
        detail: { index }
      })
    );
  };

  private onKeydown = (event: KeyboardEvent) => {
    const targetTab = (event.target as HTMLElement)?.closest<UITab>('ui-tab');
    if (!targetTab) return;

    const currentIndex = this.tabs.indexOf(targetTab);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        this.onTabActivate(new CustomEvent('ui-tab-activate', { detail: { index: currentIndex }, bubbles: false }));
        return;
      default:
        return;
    }

    if (nextIndex != null) {
      event.preventDefault();
      const nextTab = this.tabs[nextIndex];
      nextTab?.focus();
    }
  };
}

interface TabContext {
  index: number;
  selected: boolean;
  tabsId: number;
  panelId?: string;
}

@customElement('ui-tab')
export class UITab extends LitElement {
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @state()
  private selected = false;

  private index = 0;
  private tabsId = 0;
  private controlledPanel?: string;

  static override styles = css`
    :host {
      display: inline-flex;
    }

    button {
      all: unset;
      cursor: pointer;
      position: relative;
      padding: var(--spacing-2xs, 0.25rem) var(--spacing-sm, 0.75rem);
      font: inherit;
      color: var(--cmp-tabs-inactive-foreground, var(--text-secondary, #475569));
    }

    :host([disabled]) button {
      cursor: not-allowed;
      opacity: 0.6;
    }

    :host([selected]) button {
      color: var(--cmp-tabs-active-foreground, var(--text-primary, #0F172A));
    }

    button::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 3px;
      border-radius: 999px 999px 0 0;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }

    :host([selected]) button::after {
      background-color: var(--cmp-tabs-active-indicator, var(--brand-primary-600, #2563EB));
    }

    button:focus-visible {
      outline: 2px solid var(--border-focus, #2563EB);
      outline-offset: 2px;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.slot) {
      this.slot = 'tab';
    }
    this.addEventListener('click', this.onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.onClick);
  }

  override render() {
    const tabId = this.tabId(this.tabsId, this.index);
    const panelId = this.controlledPanel;

    return html`
      <button
        id=${tabId}
        role="tab"
        aria-selected=${this.selected}
        aria-controls=${ifDefined(panelId)}
        ?disabled=${this.disabled}
        tabindex=${this.selected ? 0 : -1}
      >
        <slot></slot>
      </button>
    `;
  }

  focus() {
    this.renderRoot.querySelector<HTMLButtonElement>('button')?.focus();
  }

  setContext({ index, selected, tabsId, panelId }: TabContext) {
    this.index = index;
    this.tabsId = tabsId;
    this.selected = selected;
    this.toggleAttribute('selected', selected);
    this.controlledPanel = panelId;
    this.requestUpdate();
  }

  tabId(tabsId: number, index: number) {
    return `ui-tab-${tabsId}-${index}`;
  }

  private onClick = () => {
    if (this.disabled) return;
    this.dispatchEvent(
      new CustomEvent('ui-tab-activate', {
        bubbles: true,
        composed: true,
        detail: { index: this.index }
      })
    );
  };
}

interface PanelContext {
  index: number;
  selected: boolean;
  tabsId: number;
  tabId?: string;
}

@customElement('ui-tab-panel')
export class UITabPanel extends LitElement {
  @state()
  private selected = false;

  private index = 0;
  private tabsId = 0;
  private controlledBy?: string;

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }
  `;

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.slot) {
      this.slot = 'panel';
    }
    this.toggleAttribute('hidden', !this.selected);
  }

  override render() {
    const id = this.panelId(this.tabsId, this.index);
    const labelledBy = this.controlledBy;

    return html`
      <section id=${id} role="tabpanel" aria-labelledby=${ifDefined(labelledBy)} ?hidden=${!this.selected}>
        <slot></slot>
      </section>
    `;
  }

  setContext({ index, selected, tabsId, tabId }: PanelContext) {
    this.index = index;
    this.tabsId = tabsId;
    this.selected = selected;
    this.controlledBy = tabId;
    this.toggleAttribute('hidden', !selected);
    this.requestUpdate();
  }

  panelId(tabsId: number, index: number) {
    return `ui-tabpanel-${tabsId}-${index}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-tabs': UITabs;
    'ui-tab': UITab;
    'ui-tab-panel': UITabPanel;
  }
}
