<template>
  <div id="portfolios">
    <div class="portfolios-wrapper">
      <div class="portfolios-header">
        <p class="font-bold-46">My Portfolios</p>
      </div>
      <div class="portfolios-body">
        <portfolio-card v-for="porto in portfolios" :key="porto.id" :data="porto"/>
      </div>
      <div class="portfolios-footer">
        <box-button :text="buttonText" color="white" :to="buttonTo" />
      </div>
    </div>
  </div>
</template>

<script>
import portfolios from '@/constants/portfolios.js'
import PortfolioCard from '@/components/portfolios/PortfolioCard.vue'

export default {
  name: 'Portfolios',
  props: {
    limit: {
      type: Number,
      default: 0
    }
  },
  components: {
    PortfolioCard
  },
  computed: {
    portfolios () {
      if (this.limit !== 0) {
        return portfolios.slice(0, this.limit)
      } else {
        return portfolios
      }
    },
    buttonText () {
      if (this.limit !== 0) {
        return 'Other Portfolios'
      } else {
        return 'Back to Home'
      }
    },
    buttonTo () {
      if (this.limit !== 0) {
        return '/portfolios'
      } else {
        return '/'
      }
    }
  }
}
</script>

<style scoped>
#portfolios {
  background: var(--primary-color);
  color: var(--secondary-color);
}

.portfolios-wrapper {
  width: 1200px;
  min-height: 100vh;
  margin: 0 auto;
}

.portfolios-header {
  padding-top: 60px;
  margin-left: 100px;
  margin-right: 100px;
  display: flex;
  justify-content: center;
}

.portfolios-body {
  margin-top: 60px;
}

.portfolios-footer {
  padding-top: 60px;
  padding-bottom: 60px;
  margin-left: 100px;
  margin-right: 100px;
  display: flex;
  justify-content: center;
}

@media screen and (max-width: 1200px) {
  .portfolios-wrapper {
    width: 1000px;
  }
}

@media screen and (max-width: 1000px) {
  .portfolios-wrapper {
    width: 800px;
  }
}

@media screen and (max-width: 800px) {
  .portfolios-wrapper {
    width: 100%;
  }

  .portfolios-header {
    padding-top: 60px;
    margin-left: 0px;
    margin-right: 0px;
  }
}
</style>
