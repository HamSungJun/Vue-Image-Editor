import VueImageEditor from './VueImageEditor.vue'
export default {
  install (Vue) {
    if (typeof window !== 'undefined' && window.Vue) {
      Vue = window.Vue
    }
    Vue.component('vue-image-editor', VueImageEditor)
  }
}
