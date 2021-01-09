<template>
  <div class="relative max-w-screen-md m-8">
    <div class="border-r-2 border-dark-green dark:border-blue-400 border absolute h-full top-0 left-2"></div>
    <ul class="list-none m-0 p-0" v-for="(timeline, idx) in timelines" :key="idx">
      <li class="mb-2">
        <div class="flex items-center mb-1">
          <div class="bg-dark-green dark:bg-blue-400 rounded-full h-5 w-5 flex justify-center items-center">
          </div>
          <div class="flex-1 ml-4 font-semibold">{{timeline.time}}</div>
        </div>
        <div class="ml-12">
          <div class="flex items-center">
            <i v-if="timeline.type === 'job'" class="fas fa-briefcase text-black dark:text-white"></i>
            <i v-else class="fas fa-graduation-cap text-black dark:text-white"></i>
            <p class="font-medium pl-2">{{timeline.title}}<span class="font-normal" v-if="timeline.type === 'job'"> as {{timeline.position}}</span></p>
          </div>
          <p v-if="timeline.description">- {{timeline.description}}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Timeline',
  computed: {
    timelines () {
      return this.$store.state.timelines
    }
  }
}
</script>

<style>

</style>
