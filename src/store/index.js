import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    portfolios: [
      {
        id: 4,
        name: 'Simple Ecommerce Customer Side',
        description: 'Simple Ecommerce, built with backend framework Expressjs, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap. The features are, logged in as customer role, filter by category, cart, simple checkout, wishlist, transaction history, and slide banners.',
        demo: 'https://jarooda-ecommerce-customer.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_customer',
        image: 'ecommerce',
        backend: ['Node', 'ExpressJS', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 3,
        name: 'Simple Ecommerce CMS',
        description: 'Simple Ecommerce Admin Panel CMS, built with backend framework Expressjs, Sequelize as ORM, Postgresql as database, Jest for Test Driven Development, and frontend using Vue.js and Bootstrap. The features are, create, show, edit, and delete products, categories and banners, there is also dashboard to show current database such as total products, only admin role can log in, you can login using email: "admin@mail.com" and password: "admin123".',
        demo: 'https://jarooda-ecommerce-cms.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_cms',
        image: 'cms',
        backend: ['Node', 'ExpressJS', 'Postgres', 'Sequelize', 'Jest', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 2,
        name: 'Simple Kanban Board',
        description: 'Simple Kanban Board, built with backend framework Expressjs, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap, and bundled using Parcel. The features are, create, edit, delete logged-in user task and show all tasks that use kanban board, can register and login using Google Login.',
        demo: 'https://jarooda-kanban-app.web.app/',
        repo: 'https://github.com/jarooda/kanban-app',
        image: 'kanban',
        backend: ['Node', 'ExpressJS', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Parcel', 'Bootstrap']
      },
      {
        id: 1,
        name: 'Simple Todo List',
        description: 'Simple Todo List, built with backend framework Expressjs, Sequelize as ORM, Postgresql as database, and frontend using JQuery and Bootstrap. The features are, create, show, edit and delete todo list, can register and login using Google Login, have an automatic weather condition by coordinate location using 3rd Party API Openweathermap, double click to change the Todo Status.',
        demo: 'https://jarooda-fancy-todo.web.app/',
        repo: 'https://github.com/jarooda/fancy-todo',
        image: 'fancy-todo',
        backend: ['Node', 'ExpressJS', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Jquery', 'Bootstrap']
      }
    ]
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
