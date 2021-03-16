<template>
  <header class="bg-white dark:bg-gray-900 shadow border-b-4 fixed w-full top-0 border-dark-green dark:border-blue-400 z-50 sm:flex sm:justify-between font-fira-code">
    <div class="flex justify-between items-center px-5 py-3">
      <div class="flex">
        <router-link to="/" class="text-2xl  icon cursor-pointer font-righteous underline" @click.native="isOpen = false">Jalu Wibowo Aji</router-link>
      </div>
      <div class="sm:hidden">
        <button @click="isOpen = !isOpen">
          <i v-if="isOpen" class="fas fa-times text-xl"></i>
          <i v-else class="fas fa-bars text-xl"></i>
        </button>
      </div>
    </div>

    <nav :class="isOpen ? 'flex' : 'hidden'" class="sm:flex items-end sm:items-center flex-col sm:flex-row px-5 mb-3 sm:mb-0">
      <router-link to="/portfolio" class="icon font-semibold mx-2 py-2" @click.native="isOpen = false">Portfolio</router-link>

      <div class="flex py-2">
        <div v-for="(icon, id) in icons" :key=id>
          <Icon :icon=icon />
        </div>
      </div>

      <div class="flex py-2 px-2">
        <div class="px-3 py-1 rounded-full border border-black dark:border-gray-50 outline-none">
          <div @click="darkmode">
            <transition name="fade">
              <i :class="dark ? 'fas fa-moon ml-5 text-white' : 'fas fa-sun mr-5 text-black'" class="cursor-pointer icon"></i>
            </transition>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
import { Icon } from '../components'

export default {
  name: 'Navbar',
  computed: {
    icons () {
      return this.$store.state.icons.icons
    }
  },
  components: {
    Icon
  },
  data () {
    return {
      dark: false,
      isOpen: false
    }
  },
  methods: {
    darkmode () {
      if (this.dark) {
        this.dark = false
        document.querySelector('html').classList.remove('dark')
        localStorage.setItem('theme', 'light')
      } else {
        this.dark = true
        document.querySelector('html').classList.add('dark')
        localStorage.setItem('theme', 'dark')
      }
    },
    toggleNav () {
    }
  },
  mounted () {
    if (localStorage.getItem('theme') === 'dark') {
      this.dark = true
      document.querySelector('html').classList.add('dark')
    } else {
      this.dark = false
    }
  }
}
</script>
