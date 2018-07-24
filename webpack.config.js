// Code courtesy https://github.com/merlox/casino-ethereum/blob/master/webpack.config.js

const path = require('path')

module.exports = {
   entry: [
     'babel-polyfill',
     path.join(__dirname, 'src', 'index.js')
   ], // Our frontend will be inside the src folder
   output: {
      path: path.join(__dirname, 'public'),
      filename: 'bundle.js' // The final file will be created in dist/build.js
   },
   devServer: {
     inline: true, // autorefresh
     port: 8080, // development port server
     contentBase: "./public",
     hot: true
   },
   module: {
      loaders: [{
         test: /\.css$/, // To load the css in react
         use: ['style-loader', 'css-loader'],
         include: /src/
      }, {
         test: /\.jsx?$/, // To load the js and jsx files
         loader: 'babel-loader',
         exclude: /node_modules/,
         query: {
            presets: ['es2015', 'react', 'stage-2']
         }
      }, {
         test: /\.json$/, // To load the json files
         loader: 'json-loader'
      }]
   }
}
