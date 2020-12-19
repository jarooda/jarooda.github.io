// Put this into /vue.config.js
module.exports = {
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
      args[0].title = 'Jalu Wibowo Aji';	// ! Replace your title here
      return args;
    });
  },
  // ! github.io
  publicPath: process.env.NODE_ENV === 'production'
    ? '/jarooda.github.io/'
    : '/'
};