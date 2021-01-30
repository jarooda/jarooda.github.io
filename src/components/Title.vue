<template>
  <div class="container mx-auto flex justify-center pb-5 sm:pb-1 sm:pt-12 pt-16">
    <h1 class=" text-4xl font-medium text-dark-green dark:text-blue-400 text-center">{{ title }}</h1>
  </div>
</template>

<script>
export default {
  name: 'Title',
  props: ['title']
}
</script>

<style>

</style>
