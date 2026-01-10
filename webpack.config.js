const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    index: './src-react/pages/Index.jsx',
    admin: './src-react/pages/Admin.jsx',
    'event-details': './src-react/pages/EventDetails.jsx',
    users: './src-react/pages/Users.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'public/js/react-build'),
    filename: '[name].bundle.js'
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
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
