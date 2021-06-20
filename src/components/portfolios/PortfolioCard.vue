<template>
  <div class="card-wrapper">
    <img
      v-if="isEven"
      v-lazy="data.image"
      :alt="data.name"
      class="card-image"
    >
    <img
      v-lazy="data.image"
      :alt="data.name"
      class="card-image-mobile"
    >
    <div class="desc-wrapper">
      <div>
        <p class="card-title font-semi-18">
          {{ data.name }}
        </p>
        <p class="card-desc font-normal-14">
          {{ data.description }}
        </p>
      </div>
      <div class="demo-wrapper">
        <a class="font-semi-18 link-inverse" :href="data.repo" :title="data.name" target="_blank">Repo</a>
        <a class="font-semi-18 link-inverse" :href="data.demo" :title="data.name" target="_blank">Demo</a>
      </div>
    </div>
    <img
      v-if="!isEven"
      v-lazy="data.image"
      :alt="data.name"
      class="card-image"
    >
  </div>
</template>

<script>
export default {
  name: 'PortfolioCard',
  props: {
    data: {
      type: Object
    }
  },
  computed: {
    isEven () {
      return this.data.id % 2 === 0
    }
  }
}
</script>

<style scoped>
.card-wrapper {
  width: 100%;
  display: grid;
  grid-template-columns: 50% 50%;
}

.card-image {
  width: 100%;
  height: auto;
}

.card-image-mobile {
  display: none;
  width: 100%;
  height: auto;
  padding-top: 16px;
  border-top: var(--grey-color) 1px solid;
}

.desc-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-desc {
  text-align: justify;
}

.card-title {
  text-align: center;
}

.demo-wrapper {
  display: flex;
  justify-content: space-around;
}

@media screen and (max-width: 800px) {
  .card-wrapper {
    grid-template-columns: 100%;
    width: 90%;
    margin: 0 auto;
  }

  .card-image {
    display: none;
  }

  .card-image-mobile {
    display: block;
  }
}
</style>
