
<template>
  <a class="flex items-center mx-2" :href="icon.link" :title="icon.title" target="_blank">
    <i class="fill-current icon text-xl sm:text-2xl" :class="icon.style"></i>
  </a>
</template>

<script>
export default {
  name: 'Icon',
  props: ['icon']
}
</script>

<style>

</style>
