<template>
  <div>
    <Portfolios />
    <Footer top="portfolios" />
  </div>
</template>

<script>
import Portfolios from '@/components/portfolios/Portfolios.vue'
import Footer from '@/components/footer/Footer.vue'

export default {
  name: 'PortfoliosPage',
  components: {
    Portfolios,
    Footer
  }
}
</script>
