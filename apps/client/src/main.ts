import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { BeakBreakerWebApp } from './web/BeakBreakerWebApp.js';

export function mountBeakBreakerWeb(selector = '#app') {
  const app = createApp(BeakBreakerWebApp);
  const pinia = createPinia();
  app.use(pinia);
  app.mount(selector);
  return app;
}

if (typeof document !== 'undefined' && document.querySelector('#app')) {
  mountBeakBreakerWeb('#app');
}
