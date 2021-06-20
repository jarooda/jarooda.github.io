<template>
  <div id="box-button" :class="`box-button-${ color }`">
    <a
      v-if="isAnchor"
      :href="to"
      :title="anchorTitle"
      :target="anchorTarget"
      :class="`${ color === 'white' ? 'link-inverse' : 'link' } font-semi-24`"
    >
      {{ text }}
    </a>
    <p
      v-else
      :class="`${ color === 'white' ? 'link-inverse' : 'link' } font-semi-24`"
      @click="changePage"
    >
      {{ text }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'BoxButton',
  props: {
    text: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'white'
    },
    isExternal: {
      type: Boolean,
      default: false
    },
    to: {
      type: String,
      default: '/'
    },
    isAnchor: {
      type: Boolean,
      default: false
    },
    anchorTitle: {
      type: String,
      default: ''
    },
    anchorTarget: {
      type: String,
      default: '_blank'
    }
  },
  methods: {
    changePage () {
      if (this.isExternal) {
      } else {
        this.$router.push(this.to)
      }
    }
  }
}
</script>

<style scoped>
#box-button {
  text-align: center;
  width: fit-content;
  padding: 10px 20px;
}

.box-button-white {
  border: var(--secondary-color) solid 2px;
}

.box-button-white:hover {
  border: var(--secondary-color-hover) solid 2px;
}

.box-button-black {
  border: var(--primary-color) solid 2px;
}

.box-button-black:hover {
  border: var(--primary-color-hover) solid 2px;
}
</style>
