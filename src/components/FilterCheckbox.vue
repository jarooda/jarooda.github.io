<template>
  <div class="pb-5 pt-3 flex flex-col items-center">
    <h1 class="font-righteous text-3xl">Stacks</h1>
    <div class="w-full flex justify-center flex-wrap">
      <div v-for="(data, idx) in stacks" :key="idx" class="inline-flex">
        <label class="font-righteous cursor-pointer mx-2 icon">
          <input type="checkbox" name="" v-model="filter" :value="data" class="cursor-pointer">
          {{ data }}
        </label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterCheckbox',
  computed: {
    stacks () {
      return this.$store.state.portfolios.stacks
    },
    filter: {
      get: function () {
        return this.$store.state.portfolios.filter
      },
      set: function (payload) {
        console.log(payload)
        this.$store.commit('FILTERCHANGE', payload)
      }
    }
  }
}
</script>

<style>

</style>
