import Vue from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import App from './App.vue'
import router from './router'

// Assets
import './assets/css/main.css'

// Plugins
import './plugins/vue-meta.js'
import './plugins/vue-scrollto.js'
import './plugins/font-awesome.js'
import './plugins/vue-lazyload.js'

// Component
import BoxButton from '@/components/molecules/BoxButton.vue'

Vue.component('box-button', BoxButton)
Vue.component('font-awesome', FontAwesomeIcon)
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
