<template>
  <div class="bg-white dark:bg-gray-900 shadow border-b-4 sticky top-0 border-dark-green z-50">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center">
            <button @mousedown="darkmode" class="px-3 py-1 rounded-full border border-black dark:border-gray-50 outline-none">
              <i :class="dark ? 'fas fa-moon mr-5 text-white' : 'fas fa-sun ml-5 text-black'"></i>
            </button>
          </div>
        </div>
        <div class="flex items-center -mx-2">
          <a class="flex items-center mx-2" href="mailto:jaluwibowoaji@gmail.com" title="jaluwibowoaji@gmail.com">
            <i class="fas fill-current icon text-xl sm:text-2xl fa-envelope"></i>
          </a>
          <a class="flex items-center mx-2" href="https://www.linkedin.com/in/jalu-wibowo-aji-25a09b180/" title="Jalu Wibowo Aji" target="_blank">
            <i class="fab fill-current icon text-xl sm:text-2xl fa-linkedin"></i>
          </a>
          <a class="flex items-center mx-2" title="jarooda" href="https://github.com/jarooda" target="_blank">
            <i class="fab fill-current icon text-xl sm:text-2xl fa-github"></i>
          </a>
          <a class="flex items-center mx-2" href="https://twitter.com/jaIu_" title="@jaIu_" target="_blank">
            <i class="fab fill-current icon text-xl sm:text-2xl fa-twitter"></i>
          </a>
      </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'Navbar',
  data () {
    return {
      dark: false
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
