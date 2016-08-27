import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'

const src  = path.resolve(__dirname, 'src')
const dist = path.resolve(__dirname, 'dist')

export default {
  entry: src + '/app.js',

  output: {
    path: dist,
    filename: 'bundle.js'
  },

  devtool: 'source-map',

  module: {
    loaders: [
      {
          test: /\.js[x]?$/,
          exclude: /node_modules/,
          loader: "babel",
          query:{
            presets: ['react', 'es2015']
          }
      }
    ]
  },

  resolve: {
    extensions: ['', '.js', '.jsx']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: src + '/index.html',
      filename: 'index.html'
    })
  ]
}
