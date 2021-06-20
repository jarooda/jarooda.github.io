<template>
  <div>
    <router-view/>
  </div>
</template>

<script>
import meta from '@/constants/meta.js'

export default {
  metaInfo () {
    return meta
  }
}
</script>
