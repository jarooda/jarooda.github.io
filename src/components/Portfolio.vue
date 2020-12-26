<template>
  <div class=" bg-white mb-3">
    <div class="container mx-auto flex justify-center pt-3 pb-2 sm:pb-3">
      <h1 class=" text-4xl font-medium">My Portfolios</h1>
    </div>
    <div class="container mx-auto grid sm:grid-cols-2 grid-cols-1 xl:gap-x-16">
      <div class="xl:w-full w-10/12 my-3 mx-auto"
      v-for="(portfolio, idx) in portfolios"
      :key="idx">
        <div class="flex flex-wrap justify-center px-3 py-2 border-2 hover:border-green-600 rounded-xl sm:mx-0 bg-white transition transition-none sm:duration-300 sm:ease-in-out sm:transform hover:-translate-y-3">
          <h1 class=" text-xl font-semibold text-center mb-2">{{ portfolio.name}}</h1>
          <img :src="getImgUrl(portfolio.image)" class="rounded-lg shadow-md mb-2" :alt="portfolio.name">
          <span class="my-3 text-sm text-center sm:text-left break">{{ portfolio.description}}</span>
          <div class="flex flex-row justify-around w-full border-b pb-2 text-center">
            <ul>
              <li class="font-semibold text-md border-b pb-2 mb-2">Backend</li>
              <li class="text-sm" v-for="(backend, id) in portfolio.backend" :key="id">
                {{ backend }}
              </li>
            </ul>
            <ul>
              <li class=" font-semibold text-md border-b pb-2 mb-2">Frontend</li>
              <li class="text-sm" v-for="(frontend, id) in portfolio.frontend" :key="id">
                {{ frontend }}
              </li>
            </ul>
          </div>
          <div class="flex justify-between my-3 text-m w-full pt-3">
            <a :href="portfolio.repo" target="_blank" :title="portfolio.name" class=" text-green-600 hover:text-black">Github</a>
            <a :href="portfolio.demo" target="_blank" :title="portfolio.name" class=" text-green-600 hover:text-black">Demo</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Portfolio',
  computed: {
    portfolios () {
      return this.$store.state.portfolios
    }
  },
  methods: {
    getImgUrl (porto) {
      return require('../assets/img/' + porto + '.png')
    }
  }
}
</script>
