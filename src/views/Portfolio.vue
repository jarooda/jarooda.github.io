<template>
  <div class="flex justify-center items-center py-2 sm:py-5 -mb-4 sm:mb-0 flex-col">
    <div class="container mx-auto flex justify-center pb-2 sm:pb-3 sm:pt-12 pt-16">
      <h1 class="text-4xl font-medium text-dark-green dark:text-blue-400">My Portfolios</h1>
    </div>
    <div class="container mx-auto grid grid-cols-1 xl:gap-x-16">
      <div class="md:w-3/5 w-10/12 my-3 mx-auto"
      v-for="(portfolio, idx) in portfolios"
      :key="idx">
        <PortoCard :portfolio="portfolio" />
      </div>
    </div>
  </div>
</template>

<script>

import PortoCard from '../components/PortoCard'
export default {
  name: 'Portfolio',
  computed: {
    portfolios () {
      return this.$store.state.portfolios
    }
  },
  components: {
    PortoCard
  }
}
</script>
