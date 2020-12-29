<template>
  <div class=" bg-wave-pattern bg-bottom bg-no-repeat">
    <div class="container mx-auto flex justify-center pt-3 pb-2 sm:pb-3">
      <h1 class=" text-4xl font-medium">My Portfolios</h1>
    </div>
    <div class="container mx-auto grid sm:grid-cols-1 grid-cols-1 xl:gap-x-16">
      <div class=" xl:w-3/5 w-10/12 my-3 mx-auto"
      v-for="(portfolio, idx) in portfolios"
      :key="idx">
        <Card :portfolio="portfolio"/>
      </div>
    </div>
  </div>
</template>

<script>

import Card from './Card'
export default {
  name: 'Portfolio',
  computed: {
    portfolios () {
      return this.$store.state.portfolios
    }
  },
  components: {
    Card
  }
}
</script>
