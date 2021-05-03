const path = require('path')
require("@babel/polyfill"); // necesarry
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const meta = require('./package.json')

const config = {
  entry: ['@babel/polyfill', './src/index.js'],
  target: 'web',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.xml$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(jpe?g|png|gif|svg|ico)$/i,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/',
            esModule: false
          }
        }]
      },
      {
        test: /\.(csv)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              "@babel/plugin-proposal-class-properties"
            ]
          }
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html',
      title: meta.name,
      hash: true,
      alwaysWriteToDisk: true
    })
  ]
}

module.exports = (_, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'inline-source-map'
    config.watch = true
    config.devServer = {
      contentBase: path.resolve(__dirname, 'dist'),
      historyApiFallback: true,
      watchContentBase: true
    }
    config.plugins.push(new HtmlWebpackHarddiskPlugin({
      outputPath: path.resolve(__dirname, 'dist')
    }))
  }
  else if (argv.mode === 'none') {
    config.stats = {
      colors: false,
      hash: true,
      timings: true,
      assets: true,
      chunks: true,
      chunkModules: true,
      modules: true,
      children: true
    }
  }
  return config
}
