import cytoscape from './cytoscape.esm.min.mjs';
import dagre from './cytoscape-dagre.js';

class CytoscapeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.lastUpdate = Date.now();
  }

  _init() {
    cytoscape.use(dagre);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        svg {
          width: 100%;
          height: 100%;
          background: transparent;
        }
      </style>
      <div id="graph"></div>
    `;
    this.content = this.shadowRoot.querySelector('#graph');
    this.cy = cytoscape.cy({
      container: this.content,
      elements: [],
      layout: {
        name: 'dagre',
        animate: true,
      },
    });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
    if (config.style) {
      cy.style(config.style);
    }
  }

  set hass(hass) {
    if (!this.content) return;

    const entityId = this.config?.entity;
    if (!entityId) return;

    const state = hass.states[entityId];
    if (!state?.attributes?.elements) return;

    const now = Date.now();
    if (now - this.lastUpdate < 5000) return;
    this.lastUpdate = now;

    this._deltaUpdate(state.attributes.elements);
  }

  getCardSize() {
    return 8;
  }

  _deltaUpdate(newElements) {
    this.cy.data(newElements);
    this.cy.layout();
  }

  disconnectedCallback() {
    if (this.simulation) {
      this.simulation.stop();
    }
  }
}

customElements.define('cytoscape-card', CytoscapeCard);
