import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    portfolios: [
      {
        id: 7,
        name: 'Poké Team',
        description: 'Simple Pokémon Website, built with frontend framework React and TailwindCSS. The features are find detailed Pokémon data using PokéAPI, add Pokémon to the team, search Pokémon, and dark mode.',
        demo: 'https://jarooda-poke-team.herokuapp.com/',
        repo: 'https://github.com/jarooda/',
        image: 'https://i.ibb.co/GJcc3NY/poke-team.png',
        backend: ['-'],
        frontend: ['React', 'Tailwind']
      },
      {
        id: 6,
        name: 'Fancy Todo List (React)',
        description: 'Simple Todo List, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using React and Tailwind. The features are, create, show, edit and delete todo list, can register and login using Google Login, have an automatic weather condition by coordinate location using 3rd Party API Openweathermap, double click to change the Todo Status, search Todo, and Dark Mode.',
        demo: 'https://jarooda-todo-react.herokuapp.com/',
        repo: 'https://github.com/jarooda/fancy-todo-react',
        image: 'https://i.ibb.co/PTFYnyh/todo-react.png',
        backend: ['Node.js', 'Express.js', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['React', 'Tailwind']
      },
      {
        id: 5,
        name: 'Word Counter',
        description: 'Simple Word Count, built with frontend framework React and TailwindCSS. The features are, characters count, word count, sentences count, paragraphs count, estimated reading time, and show how many keywords appear.',
        demo: 'https://jarooda-word-count.herokuapp.com/',
        repo: 'https://github.com/jarooda/word-count',
        image: 'https://i.ibb.co/HrGRy60/word-counter.png',
        backend: ['-'],
        frontend: ['React', 'Tailwind']
      },
      {
        id: 4,
        name: 'Ecommerce IT Product',
        description: 'Simple Ecommerce, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap. The features are, login using google login, logged in as customer role, filter by category, cart, simple checkout, wishlist, transaction history, and slide banners.',
        demo: 'https://jarooda-ecommerce-customer.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_customer',
        image: 'https://i.ibb.co/XyWgDMc/ecommerce.png',
        backend: ['Node.js', 'Express.js', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 3,
        name: 'CMS Ecommerce IT Product',
        description: 'Simple Ecommerce Admin Panel CMS, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, Jest for Test Driven Development, and frontend using Vue.js and Bootstrap. The features are, create, show, edit, and delete products, categories and banners, there is also dashboard to show current database such as total products, only admin role can log in, you can login using email: "admin@mail.com" and password: "admin123".',
        demo: 'https://jarooda-ecommerce-cms.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_cms',
        image: 'https://i.ibb.co/S30nbmH/cms.png',
        backend: ['Node.js', 'Express.js', 'Postgres', 'Sequelize', 'Jest', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 2,
        name: 'Kanban Board',
        description: 'Simple Kanban Board, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap, and bundled using Parcel. The features are, create, edit, delete logged-in user task and show all tasks that use kanban board, can register and login using Google Login.',
        demo: 'https://jarooda-kanban-app.web.app/',
        repo: 'https://github.com/jarooda/kanban-app',
        image: 'https://i.ibb.co/HVt2Dt1/kanban.png',
        backend: ['Node.js', 'Express.js', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Parcel', 'Bootstrap']
      },
      {
        id: 1,
        name: 'Fancy Todo List (jQuery)',
        description: 'Simple Todo List, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using jQuery and Bootstrap. The features are, create, show, edit and delete todo list, can register and login using Google Login, have an automatic weather condition by coordinate location using 3rd Party API Openweathermap, double click to change the Todo Status.',
        demo: 'https://jarooda-fancy-todo.web.app/',
        repo: 'https://github.com/jarooda/fancy-todo',
        image: 'https://i.ibb.co/R7xgPTj/fancy-todo.png',
        backend: ['Node.js', 'Express.js', 'Postgres', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['jQuery', 'Bootstrap']
      }
    ],
    icons: [
      {
        name: 'email',
        link: 'mailto:jaluwibowoaji@gmail.com',
        title: 'jaluwibowoaji@gmail.com',
        style: 'fas fa-envelope'
      },
      {
        name: 'linkedin',
        link: 'https://www.linkedin.com/in/jalu-wibowo-aji-25a09b180/',
        title: 'Jalu Wibowo Aji',
        style: 'fab fa-linkedin'
      },
      {
        name: 'github',
        link: 'https://github.com/jarooda',
        title: 'jarooda',
        style: 'fab fa-github'
      },
      {
        name: 'twitter',
        link: 'https://twitter.com/jaIu_',
        title: '@jaIu_',
        style: 'fab fa-twitter'
      }
    ],
    timelines: [
      {
        type: 'school',
        time: 'Sep 2020 - Jan 2021',
        title: 'Hacktiv8',
        description: 'Fullstack Javascript Bootcamp'
      },
      {
        type: 'job',
        time: 'May 2018 - Feb 2020',
        title: 'CV. Multi Casa Semarang',
        position: 'Marketing Staff',
        description: 'Marketing Staff that handle e-commerce content, sales and media social'
      },
      {
        type: 'job',
        time: 'Mar 2014 - May 2018',
        title: 'CV. Multi Casa Semarang',
        position: 'Sales Promoter',
        description: 'Sales Promoter at modern market such as Gramedia'
      },
      {
        type: 'school',
        time: '2010 - 2013',
        title: 'SMK Negeri 10 Semarang',
        description: 'Rekayasa Perangkat Lunak (Computer Software Engineering)'
      },
      {
        type: 'job',
        time: 'Dec 2011 - Mar 2012',
        title: 'PT. PLN (Persero) Distribusi Jawa Tengah dan DIY',
        position: 'Student Intern',
        description: 'Student Intern as admin at library'
      },
      {
        type: 'school',
        time: '2007 - 2010',
        title: 'SMP Negeri 1 Ungaran'
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
