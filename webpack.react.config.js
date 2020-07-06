const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", '.js', '.jsx', '.json'],
    mainFields: ['main', 'module', 'browser'],
  },
  entry: './src/index.tsx',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
            {
                loader: "ts-loader"
            }
        ]
    },
    {
      enforce: "pre",
      test: /\.js$/,
      loader: "source-map-loader"
  },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    compress: true,
    hot: true,
    port: 4000,
    publicPath: '/',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    publicPath: './',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Production',
      template: 'index.html',
      templateParameters: {
        base: process.env.NODE_ENV === 'development' ? '/' : './'
      }
    })
  ],
  externals: {
    src: 'src'
  },
  externals: {
    // "react": "React",
    // "react-dom": "ReactDOM"
}
};

