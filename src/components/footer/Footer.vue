<template>
  <div id="footer">
    <div class="footer-wrapper">
      <div class="footer-left">
        <p class="font-bold-46">Have any questions?</p>
        <p class="font-normal-18">Don't be shy, just send me an email, and I will reply.</p>
        <box-button text="Write an Email" color="black" :isAnchor="true" to="mailto:jaluwibowoaji@gmail.com" anchorTitle="jaluwibowoaji@gmail.com" />
      </div>
      <div class="footer-right">
        <div class="social-media">
          <a
            v-for="social in socialMedias"
            :key="social.text"
            :href="social.link"
            :title="social.title"
            target="_blank"
            class="link font-semi-18"
          >
            {{ social.text }}
          </a>
        </div>
        <p class="font-normal-14">Miss something? <span class="font-semi-14 link" v-scroll-to="{ el: `#${top}` }">Back to top.</span></p>
      </div>
    </div>
  </div>
</template>

<script>
import socialMedias from '@/constants/socmed.js'

export default {
  name: 'Footer',
  props: {
    top: {
      type: String,
      default: 'header'
    }
  },
  data () {
    return {
      socialMedias
    }
  }
}
</script>

<style scoped>
#footer {
  padding-top: 60px;
  background: var(--secondary-color);
  color: var(--primary-color);
  padding-bottom: 60px;
}

.footer-wrapper {
  width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 50% 50%;
}

.footer-left {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  border-right: var(--grey-color) solid 1px;
}

.footer-right {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border-left: var(--grey-color) solid 1px;
}

.social-media {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

@media screen and (max-width: 1200px) {
  .footer-wrapper {
    width: 1000px;
  }
}

@media screen and (max-width: 1000px) {
  .footer-wrapper {
    width: 800px;
  }
}

@media screen and (max-width: 800px) {
  .footer-wrapper {
    width: 100%;
    grid-template-columns: 100%;
  }

  .footer-right, .footer-left {
    border: none;
  }
}
</style>
