<template>
  <div>
    <Navbar />
    <AboutMe />
    <Portfolio />
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import Navbar from '@/components/Navbar.vue'
import AboutMe from '@/components/AboutMe.vue'
import Portfolio from '@/components/Portfolio.vue'

export default {
  name: 'Home',
  components: {
    Navbar,
    AboutMe,
    Portfolio
  }
}
</script>
