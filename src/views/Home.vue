<template>
  <div class="flex justify-center items-center py-2 sm:py-5 -mb-4 sm:mb-0 flex-col pb-5">
    <div class="container mx-auto flex justify-center pb-5 sm:pb-1 sm:pt-12 pt-16">
      <h1 class=" text-4xl font-medium text-dark-green dark:text-blue-400">About Me</h1>
    </div>
    <AboutCard />
    <Timeline />
  </div>
</template>

<script>
import AboutCard from '../components/AboutCard'
import Timeline from '../components/Timeline'

export default {
  name: 'Home',
  components: {
    AboutCard,
    Timeline
  }
}
</script>
