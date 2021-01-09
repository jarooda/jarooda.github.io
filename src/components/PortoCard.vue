<template>
  <div class="flex flex-wrap justify-center border-t-2 border-gray-500 hover:border-dark-green dark:hover:border-blue-400 rounded-md sm:mx-0 transition duration-300 ease-in-out transform hover:-translate-y-3 hover:translate-x-1 dark:bg-gray-800 bg-gray-100 shadow-md">
    <h1 class=" sm:text-xl text-base font-semibold text-center py-2 px-2 min-w-full cursor-pointer icon" @click="active = !active">{{ portfolio.name}}</h1>
    <transition name="slide-fade">
      <div class="mx-3 my-2" v-if="active">
        <div class="transform mb-5 bg-dark-green dark:bg-blue-400 rounded-3xl transition hover:ease-out" :class="portfolio.id % 2 === 0 ? 'sm:hover:rotate-3 sm:rotate-0 rotate-3' : 'sm:hover:-rotate-3  sm:rotate-0 -rotate-3'">
          <img :src="portfolio.image" class="rounded-3xl shadow-md mb-2 transform" :alt="portfolio.name" :class="portfolio.id % 2 === 0 ? 'sm:hover:-rotate-3 sm:rotate-0 -rotate-3' : 'sm:hover:rotate-3  sm:rotate-0 rotate-3'">
        </div>
        <span class="my-3 text-sm text-center sm:text-left break">{{ portfolio.description}}</span>
        <div class="flex flex-row justify-around w-full border-b py-2 text-center">
          <ul class=" w-6/12">
            <li class="font-semibold text-md border-b pb-2 mb-2">Backend</li>
            <li class="text-sm" v-for="(backend, id) in portfolio.backend" :key="id">
              {{ backend }}
            </li>
          </ul>
          <ul class=" w-6/12">
            <li class=" font-semibold text-md border-b pb-2 mb-2">Frontend</li>
            <li class="text-sm" v-for="(frontend, id) in portfolio.frontend" :key="id">
              {{ frontend }}
            </li>
          </ul>
        </div>
        <div class="flex justify-around my-3 text-m w-full pt-1">
          <a :href="portfolio.repo" target="_blank" :title="portfolio.name" class="link">Github</a>
          <a :href="portfolio.demo" target="_blank" :title="portfolio.name" class="link">Demo</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'PortoCard',
  props: ['portfolio'],
  computed: {
    portfolios () {
      return this.$store.state.portfolios
    }
  },
  data () {
    return {
      active: false
    }
  }
}
</script>

<style>
/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .3s cubic-bezier(1.0, 1.0, 1.0, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(10px);
  opacity: 0;
}
</style>
