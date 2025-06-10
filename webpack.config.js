const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/frontend/react/index.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/, /setupTests\.ts$/, /\.test\.tsx?$/, /\.spec\.tsx?$/],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/frontend/react'),
      '@components': path.resolve(__dirname, 'src/frontend/react/components'),
      '@hooks': path.resolve(__dirname, 'src/frontend/react/hooks'),
      '@utils': path.resolve(__dirname, 'src/frontend/react/utils'),
      '@types': path.resolve(__dirname, 'src/frontend/react/types'),
    },
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/frontend/react/public/index.html',
      filename: 'index.html',
    }),
  ],
  
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: false, // Don't open browser automatically (Electron will handle this)
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  
  target: 'electron-renderer',
  
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
};