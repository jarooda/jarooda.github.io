import Vue from 'vue'
import Vuex from 'vuex'
import timelines from './modules/timelines'
import portfolios from './modules/portfolios'
import icons from './modules/icons'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    timelines,
    portfolios,
    icons
  }
})
