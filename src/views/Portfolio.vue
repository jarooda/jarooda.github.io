<template>
  <div class="flex justify-center items-center py-2 sm:py-5 -mb-4 sm:mb-0 flex-col font-fira-code">
    <Title title="My Portfolios" />
    <FilterCheckbox />
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
import { Title, PortoCard, FilterCheckbox } from '../components'

export default {
  name: 'Portfolio',
  computed: {
    portfolios () {
      return this.$store.getters.filtered
    }
  },
  components: {
    PortoCard,
    Title,
    FilterCheckbox
  }
}
</script>
