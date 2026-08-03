const path = require('path');
const pkg = require('./package.json');

module.exports = {
  devServer: {
    compress: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true',
    },
    port: 1268,
    static: { directory: path.join(__dirname, './dist') },
  },
  entry: `./src/${pkg.entry}.tsx`,
  externals: {
    '@builder.io/app-context': '@builder.io/app-context',
    '@builder.io/react': '@builder.io/react',
    '@builder.io/sdk': '@builder.io/sdk',
    '@emotion/core': '@emotion/core',
    '@emotion/styled': '@emotion/styled',
    '@material-ui/core': '@material-ui/core',
    '@material-ui/icons': '@material-ui/icons',
    mobx: 'mobx',
    'mobx-react': 'mobx-react',
    react: 'react',
    'react-dom': 'react-dom',
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
      { exclude: /node_modules/, test: /\.(ts|tsx)$/, use: [{ loader: 'ts-loader' }] },
    ],
  },
  output: {
    filename: pkg.output,
    library: { type: 'system' },
    path: path.resolve(__dirname, 'dist'),
  },
  performance: { hints: false },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
