<template>
  <div id="app" class="dock">
    <Navbar />
    <router-view/>
  </div>
</template>

<script>

import Navbar from '@/components/Navbar.vue'

export default {
  components: {
    Navbar
  }
}
</script>
