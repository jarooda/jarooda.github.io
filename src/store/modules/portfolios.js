const portfolios = {
  state: () => ({
    stacks: ['Bootstrap', 'Express.js', 'Jest', 'jQuery', 'MongoDB', 'Node.js', 'PostgreSQL', 'React', 'React Native', 'Sequelize', 'TailwindCSS', 'Vue.js'],
    filter: [],
    portfolios: [
      {
        id: 9,
        name: 'LPG - Learning Pronunciation Game',
        description: 'This game give you a unique experience in learning pronunciation in foreign languages. Here you can race against time to get best scores. The game offer various difficulty for you to tackle it and be better in pronunciation. Built with backend framework Express.js, Jest for TDD and database MongoDB, frontend library React, CSS framework TailwindCSS, animation using P5.js and Web Speech API. The features are using speech recognition to beat the game, and using speech synthesis to give a clue, and leaderboard to give a sense of achievement.',
        demo: 'https://florence-fox-lpg.herokuapp.com/',
        repo: 'https://github.com/Learn-Pronounciation-Game-Team',
        image: 'https://i.ibb.co/PwFtHBH/lpg-game.png',
        backend: ['Node.js', 'Express.js', 'Jest', 'MongoDB'],
        frontend: ['React', 'TailwindCSS', 'P5.js', 'Web Speech API']
      },
      {
        id: 8,
        name: 'Sudokuuu',
        description: 'Simple Sudoku Mobile Game, built with frontend library React Native and Expo. The features are play Sudoku with 3 level provided by sugoku API, each level have different timer, solve button with current sudoku board, and leaderboard sorted by fastest time clear.',
        demo: 'https://expo.io/@jarooda/projects/jaroodasugoku',
        repo: 'https://github.com/jarooda/sudokuuu-react-native',
        image: 'https://i.ibb.co/DVnLmFz/sudokuuu.png',
        backend: ['-'],
        frontend: ['React Native', 'Expo']
      },
      {
        id: 7,
        name: 'Poké Team',
        description: 'Simple Pokémon Website, built with frontend library React and TailwindCSS. The features are find detailed Pokémon data using PokéAPI, add Pokémon to the team, search Pokémon, and dark mode.',
        demo: 'https://jarooda-poke-team.herokuapp.com/',
        repo: 'https://github.com/jarooda/poke-team',
        image: 'https://i.ibb.co/GJcc3NY/poke-team.png',
        backend: ['-'],
        frontend: ['React', 'TailwindCSS']
      },
      {
        id: 6,
        name: 'Fancy Todo List (React)',
        description: 'Simple Todo List, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using React and Tailwind. The features are, create, show, edit and delete todo list, can register and login using Google Login, have an automatic weather condition by coordinate location using 3rd Party API Openweathermap, double click to change the Todo Status, search Todo, and Dark Mode.',
        demo: 'https://jarooda-todo-react.herokuapp.com/',
        repo: 'https://github.com/jarooda/fancy-todo-react',
        image: 'https://i.ibb.co/PTFYnyh/todo-react.png',
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['React', 'TailwindCSS']
      },
      {
        id: 5,
        name: 'Word Counter',
        description: 'Simple Word Count, built with frontend framework React and TailwindCSS. The features are, characters count, word count, sentences count, paragraphs count, estimated reading time, and show how many keywords appear.',
        demo: 'https://jarooda-word-count.herokuapp.com/',
        repo: 'https://github.com/jarooda/word-count',
        image: 'https://i.ibb.co/HrGRy60/word-counter.png',
        backend: ['-'],
        frontend: ['React', 'TailwindCSS']
      },
      {
        id: 4,
        name: 'Ecommerce IT Product',
        description: 'Simple Ecommerce, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap. The features are, login using google login, logged in as customer role, filter by category, cart, simple checkout, wishlist, transaction history, and slide banners.',
        demo: 'https://jarooda-ecommerce-customer.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_customer',
        image: 'https://i.ibb.co/XyWgDMc/ecommerce.png',
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 3,
        name: 'CMS Ecommerce IT Product',
        description: 'Simple Ecommerce Admin Panel CMS, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, Jest for Test Driven Development, and frontend using Vue.js and Bootstrap. The features are, create, show, edit, and delete products, categories and banners, there is also dashboard to show current database such as total products, only admin role can log in, you can login using email: "admin@mail.com" and password: "admin123".',
        demo: 'https://jarooda-ecommerce-cms.web.app/',
        repo: 'https://github.com/jarooda/ecommerce_client_cms',
        image: 'https://i.ibb.co/S30nbmH/cms.png',
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'Jest', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Bootstrap']
      },
      {
        id: 2,
        name: 'Kanban Board',
        description: 'Simple Kanban Board, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using Vue.js and Bootstrap, and bundled using Parcel. The features are, create, edit, delete logged-in user task and show all tasks that use kanban board, can register and login using Google Login.',
        demo: 'https://jarooda-kanban-app.web.app/',
        repo: 'https://github.com/jarooda/kanban-app',
        image: 'https://i.ibb.co/HVt2Dt1/kanban.png',
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['Vue.js', 'Parcel', 'Bootstrap']
      },
      {
        id: 1,
        name: 'Fancy Todo List (jQuery)',
        description: 'Simple Todo List, built with backend framework Express.js, Sequelize as ORM, Postgresql as database, and frontend using jQuery and Bootstrap. The features are, create, show, edit and delete todo list, can register and login using Google Login, have an automatic weather condition by coordinate location using 3rd Party API Openweathermap, double click to change the Todo Status.',
        demo: 'https://jarooda-fancy-todo.web.app/',
        repo: 'https://github.com/jarooda/fancy-todo',
        image: 'https://i.ibb.co/R7xgPTj/fancy-todo.png',
        backend: ['Node.js', 'Express.js', 'PostgreSQL', 'Sequelize', 'JSON Web Token', 'BCryptjs'],
        frontend: ['jQuery', 'Bootstrap']
      }
    ]
  }),
  mutations: {
    FILTERCHANGE (state, payload) {
      state.filter = payload
    }
  },
  getters: {
    filtered (state) {
      if (!state.filter.length) {
        return state.portfolios
      } else {
        return state.portfolios.filter(e => {
          let backend = false
          let frontend = false

          for (let i = 0; i < state.filter.length; i++) {
            const element = state.filter[i]
            if (e.backend.includes(element)) backend = true
            if (e.frontend.includes(element)) frontend = true
          }

          if (backend || frontend) {
            return e
          }
        })
      }
    }
  }
}

export default portfolios
