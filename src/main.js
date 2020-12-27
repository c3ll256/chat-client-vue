import Vue from 'vue'
import App from './App.vue'
import VueSocketIO from 'vue-socket.io'
import axios from 'axios'
import VueAxios from 'vue-axios'

Vue.config.productionTip = false

Vue.use(new VueSocketIO({
  debug: true,
  connection: "http://106.52.127.85:7001",
}))
Vue.use(VueAxios, axios)

new Vue({
  render: h => h(App),
}).$mount('#app')