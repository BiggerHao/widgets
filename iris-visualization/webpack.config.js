const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
require("@babel/polyfill"); // necesarry
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin')
const meta = require('./package.json');
const { data } = require('autoprefixer');


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
            options: {
              outputPath: 'datasets'
            }
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
  console.log("argv", argv);
  let app = argv.app || "";
  let dataset = argv.dataset || "";
  let envPath = path.join(__dirname, 'conf/'+app+'_'+dataset+'.env');
  let outputPath = config.output.path;
  if(!fs.existsSync(envPath)){
    // if no valid variables are passed, use dev mode
    console.log("no valid file. using dev mode.")
    envPath = path.join(__dirname, 'conf/dev.env');
  }
  else{
    // file env exists, update output
    config.output.path = path.resolve(__dirname, 'dist/'+dataset+'/'+app);
    outputPath = config.output.path;
  }
  const dotenv = require('dotenv').config({
    path: envPath
  });
  console.log("received variables %o from parameters:\n-app: %s \n-dataset: %s", dotenv.parsed, app, dataset);
  
  config.plugins.push(new webpack.DefinePlugin({
    "process.env": JSON.stringify(dotenv.parsed)
  }));
  if (argv.mode === 'development') {
    config.output.path = path.resolve(__dirname, 'dev')
    config.devtool = 'inline-source-map'
    config.watch = true
    config.devServer = {
      contentBase: path.resolve(__dirname, 'dev'),
      historyApiFallback: true,
      watchContentBase: true
    }
    config.plugins.push(new HtmlWebpackHarddiskPlugin({
      outputPath: path.resolve(__dirname, 'dev')
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
