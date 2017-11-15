const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

const r = _ => path.resolve(__dirname, _);

module.exports = {
  entry: { app: './src/app.js' },
  output: {
    filename: '[name].bundle.[chunkhash].js',
    path: r('dist/js')
  },
  resolve: { alias: { vue$: 'vue/dist/vue.js' } },
  module: {
    rules: [
      { test: /\.js$/, exclude: r('node_modules'), loader: 'babel-loader' }
    ]
  },
  plugins: [
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    }),
    new CopyWebpackPlugin([
      { from: r('src/style/site.css'), to: r('dist/style') }
    ]),
    new HtmlWebpackPlugin({
      filename: r('dist/index.html'),
      template: 'index.html',
      inject: true
    })
  ]
};
