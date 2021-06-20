<template>
  <div>
    <Header ref="header"/>
    <div @click="clickOutsideHeader">
      <Portfolios :limit="4"/>
      <Footer top="header"/>
    </div>
  </div>
</template>

<script>
import Header from '@/components/header/Header.vue'
import Portfolios from '@/components/portfolios/Portfolios.vue'
import Footer from '@/components/footer/Footer.vue'

export default {
  name: 'Home',
  components: {
    Header,
    Portfolios,
    Footer
  },
  methods: {
    clickOutsideHeader () {
      this.$refs.header.closeNav(0)
    }
  }
}
</script>
