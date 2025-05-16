import {
  LitElement,
  html,
  css,
  nothing,
  CSSResultGroup,
  PropertyValues,
} from 'lit';
import { property, state } from 'lit/decorators.js';

import { CytoscapeDagre } from '@scoped-elements/cytoscape';
try {
  customElements.define('cytoscape-dagre', CytoscapeDagre);
} catch {}

interface CytoscapeCardConfig {
  type: 'cytoscape-card';
  entity?: string;
  style?: any;
}

class CytoscapeCardEditor extends LitElement {
  @property({ attribute: false }) public hass?;

  @state() private _config?: CytoscapeCardConfig;

  public setConfig(config: CytoscapeCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const data = {
      style: [],
      ...this._config,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${[
          {
            name: 'entity',
            selector: {
              entity: {
                domain: ['sensor'],
              },
            },
          },
          {
            name: 'style',
            selector: {
              object: {},
            },
          },
        ]}
        @value-changed=${this._valueChanged}></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    const config = ev.detail.value;
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true,
    });
    // @ts-ignore
    event.detail = { config: config };
    this.dispatchEvent(event);
  }
}
try {
  customElements.define('cytoscape-card-editor', CytoscapeCardEditor);
} catch {}

class CytoscapeCard extends LitElement {
  public static async getConfigForm() {
    return document.createElement('cytoscape-card-editor');
  }

  public static getStubConfig(
    hass,
    entities: string[],
    entitiesFallback: string[]
  ): CytoscapeCardConfig {
    return { type: 'cytoscape-card', entity: '' };
  }

  @property({ attribute: false }) public hass?;
  @state() private _config?;

  render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-warning> Entity not found: ${this._config.entity} </hui-warning>
      `;
    }

    let elements = [];
    try {
      elements = JSON.parse(stateObj.attributes.elements);
    } catch {}

    let style = this._config?.style;
    if (style && this.parentElement) {
      const regex = /var\(--(.*?)\)/g;
      const computedStyle = window.getComputedStyle(this.parentElement);
      style = JSON.parse(
        JSON.stringify(style).replace(regex, (match, name) => {
          const value = computedStyle.getPropertyValue(`--${name}`);
          return value ? value : match;
        })
      );
    }

    return html`
      <ha-card>
        <cytoscape-dagre
          .elements=${elements}
          .options=${{ style }}
          .options=${{
            autoungrabify: false,
          }}></cytoscape-dagre>
      </ha-card>
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this._config = config;
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
  }

  // set hass(hass) {
  //   if (!this.content) return;

  //   const entityId = this._config?.entity;
  //   if (!entityId) return;

  //   const state = hass.states[entityId];
  //   if (!state?.attributes?.elements) return;

  //   const now = Date.now();
  //   if (now - this.lastUpdate < 5000) return;
  //   this.lastUpdate = now;

  //   this._deltaUpdate(state.attributes.elements);
  // }

  getCardSize() {
    return 6;
  }
  getGridOptions() {
    return {
      rows: 6,
      columns: 6,
      min_rows: 3,
      min_columns: 3,
    };
  }

  _deltaUpdate(newElements) {
    // this.cy.data(newElements);
    // this.cy.json([
    //   {
    //     id: 'a',
    //     label: 'A',
    //   },
    //   {
    //     id: 'b',
    //     label: 'B',
    //   },
    //   {
    //     id: 'c',
    //     label: 'C',
    //   },
    //   {
    //     id: 'd',
    //     label: 'D',
    //   },
    //   {
    //     id: 'e',
    //     label: 'E',
    //   },
    //   {
    //     id: 'f',
    //     label: 'F',
    //   },
    // ]);
    // this.cy.layout({
    //   name: 'dagre',
    //   animate: true,
    // });
  }

  disconnectedCallback() {}

  static get styles(): CSSResultGroup {
    return css`
      :host,
      ha-card,
      cytoscape-dagre {
        display: block;
        width: 100%;
        height: 100%;
      }
    `;
  }
}

declare global {
  interface Window {
    customCards: any[];
  }
}

try {
  customElements.define('cytoscape-card', CytoscapeCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'cytoscape-card',
    name: 'Cytoscape Card',
    documentationURL: 'https://github.com/JosephAbbey/ha_cytoscape-card', // Adds a help link in the frontend card editor
  });
} catch {}

export { CytoscapeCard };
