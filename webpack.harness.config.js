const path = require('path');

module.exports = {
  devServer: {
    open: true,
    port: 1269,
    static: [
      { directory: path.join(__dirname, 'dev') },
      { directory: path.join(__dirname, 'dev-dist') },
    ],
  },
  entry: './dev/harness.tsx',
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      { exclude: /node_modules/, test: /\.(ts|tsx)$/, use: [{ loader: 'ts-loader' }] },
    ],
  },
  output: {
    filename: 'harness.js',
    path: path.resolve(__dirname, 'dev-dist'),
    publicPath: '/',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
