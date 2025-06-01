const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.js', // React entry point for popup
    options: './options.js',       // Entry for options page vanilla JS
    background: './background.js'  // Entry for background service worker
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './popup.html',
      filename: 'popup.html',
      chunks: ['popup'] // Only include popup.js script in popup.html
    }),
    new HtmlWebpackPlugin({
        template: './options.html',
        filename: 'options.html',
        chunks: ['options'] // Only include options.js script in options.html
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'images', to: 'images' },
        { from: 'popup.css', to: 'popup.css'},
        { from: 'options.css', to: 'options.css'}
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devtool: 'cheap-module-source-map' // Recommended for extensions
}; 