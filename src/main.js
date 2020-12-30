import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-socket.io'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Vuetify from 'vuetify'
import vuetify from '@/plugins/vuetify'

const url = require('./config.json').url;

Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  debug: true,
  connection: url,
}))
Vue.use(VueAxios, axios)
Vue.use(Vuetify)

new Vue({
  vuetify,
  render: h => h(App),
}).$mount('#app')