<template>
  <div class="flex justify-center items-center py-2 sm:py-5 -mb-4 sm:mb-0 flex-col pb-5 font-fira-code">
    <Title title="About Me" />
    <AboutCard />
    <Title title="Education & Job" />
    <Timeline />
  </div>
</template>

<script>
import { AboutCard, Title, Timeline } from '../components'

export default {
  name: 'Home',
  components: {
    AboutCard,
    Timeline,
    Title
  }
}
</script>
