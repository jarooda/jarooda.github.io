<template>
  <div id="header">
    <div class="header-wrapper">
      <div class="header-left">
        <div class="about-me-image"></div>
      </div>
      <div class="header-right">
        <div class="navigation font-normal-18">
          <div class="nav-title">
            <font-awesome icon="angle-right"></font-awesome>
            <span>Navigation</span>
          </div>
          <p
            v-for="nav in navigations"
            :key="nav.text"
            v-scroll-to="{ el: `#${nav.id}` }"
            class="link"
          >
            {{ nav.text}}
          </p>
        </div>
        <div class="navigation-mobile font-normal-18">
          <div class="nav-title" @click="isNavShown = !isNavShown">
            <font-awesome icon="angle-right"></font-awesome>
            <span>Navigation</span>
          </div>
          <div class="navigation-mobile" v-if="isNavShown">
            <p
              v-for="nav in navigations"
              :key="nav.text"
              v-scroll-to="{ el: `#${nav.id}` }"
              @click="closeNav(1000)"
              class="link"
            >
              {{ nav.text}}
            </p>
          </div>
        </div>
        <div class="about-me">
          <div class="image-mobile-wrapper">
            <img src="https://i.ibb.co/DYQR28Z/jaluwibowo.jpg" alt="Jalu Wibowo Aji" class="image-mobile">
          </div>
          <p class="font-normal-14">Hello there, my name is</p>
          <p class="font-bold-64">Jalu Wibowo Aji</p>
          <p class="font-normal-18">I'm a Web Developer and currently a Frontend Developer at <a class="link font-semi-18" href="https://sekolah.mu" target="_blank" title="Sekolah.mu">Sekolah.mu</a>, I love to learn new things and do jobs with careful planning. For more detail about me, please kindly go to my <a class="link font-semi-18" href="https://www.linkedin.com/in/jaluwibowoaji/" target="_blank" title="Jalu Wibowo Aji">LinkedIn</a> or reach me via <a class="link font-semi-18" href="mailto:jaluwibowoaji@gmail.com" target="_blank" title="jaluwibowoaji@gmail.com">Email</a> or <a class="link font-semi-18" href="https://twitter.com/jaIu_" target="_blank" title="@jaIu_">Twitter</a>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Header',
  data () {
    return {
      navigations: [
        {
          text: 'Portfolios',
          id: 'portfolios'
        },
        {
          text: 'Contact Me',
          id: 'footer'
        }
      ],
      isNavShown: false
    }
  },
  methods: {
    closeNav (time) {
      setTimeout(() => {
        this.isNavShown = false
      }, time)
    }
  }
}
</script>

<style scoped>
#header {
  background: var(--secondary-color);
  color: var(--primary-color);
}

.header-wrapper {
  height: 100vh;
  width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 50% 50%;
}

.header-right {
  margin-top: 60px;
  margin-left: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.navigation {
  display: flex;
  gap: 16px;
  color: var(--grey-color);
}

.navigation-mobile {
  display: none;
  gap: 16px;
  color: var(--grey-color);
}

.nav-title span {
  margin-left: 8px;
}

.about-me {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 60px;
}

.header-left {
  display: flex;
  align-items: flex-end;
  padding-top: 60px;
}

.about-me-image {
  height: calc(100vh - 60px);
  width: 100%;
  background: url('https://i.ibb.co/DYQR28Z/jaluwibowo.jpg') no-repeat;
  background-position: top;
  background-size: cover;
  border: var(--primary-color) 1px solid;
  border-bottom: none;
}

.image-mobile-wrapper {
  display: none;
}

@media screen and (max-width: 1200px) {
  .header-wrapper {
    width: 1000px;
    grid-template-columns: 40% 60%;
  }

  .header-right {
    margin-left: 60px;
  }
}

@media screen and (max-width: 1000px) {
  .header-wrapper {
    width: 800px;
    grid-template-columns: 30% 70%;
  }

  .header-right {
    margin-left: 20px;
  }
}

@media screen and (max-width: 800px) {
  .header-wrapper {
    width: 100%;
    min-height: 100vh;
    grid-template-columns: 100%;
  }

  .image-mobile-wrapper {
    display: flex;
    justify-content: center;
  }

  .image-mobile {
    border-radius: 50%;
    height: 160px;
    widows: 160px;
    object-fit: cover;
  }

  .header-right {
    margin-right: 20px;
  }

  .header-left {
    display: none;
  }
}

@media screen and (max-width: 425px) {
  .navigation {
    display: none;
  }

  .navigation-mobile {
    display: flex;
    flex-direction: column;
  }

  .header-right {
    text-align: justify;
    margin-top: 20px;
  }
}
</style>
