const path = require('path');

module.exports = {
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, './'),
    filename: './bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'ts-loader'
      },
      {
        test: require.resolve('phaser'),
        loader: 'expose-loader',
        options: { exposes: { globalName: 'Phaser', override: true } }
      }
    ]
  },
  devServer: {
    static: path.resolve(__dirname, './'),
    host: '0.0.0.0',
    port: 8000,
    open: false
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
};

// /* eslint-disable @typescript-eslint/no-var-requires */
// const path = require('path');
// const webpack = require('webpack');
// const CopyPlugin = require('copy-webpack-plugin');

// module.exports = {
//     entry: "./src/main.ts",
//     devtool: "source-map",
//     output: {
//         filename: "./bundle.js"
//     },
//     resolve: {
//         extensions: [".ts"]
//     },
//     module: {
//         rules: [
//             {
//                 test: /\.ts$/,
//                 loader: "ts-loader"
//             }
//         ]
//     }
// };

// module.exports = {
//   entry: {
//     app: './src/main.ts',
//     vendors: ['phaser'],
//   },

//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       },
//     ],
//   },

//   resolve: {
//     extensions: ['.ts', '.tsx', '.js'],
//   },

//   output: {
//     filename: 'app.bundle.js',
//     path: path.resolve(__dirname, 'dist'),
//   },

//   mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',

//   // devServer: {
//   //   contentBase: path.resolve(__dirname, 'dist'),
//   //   // writeToDisk: true,
//   //   open: true,
//   // },

//   plugins: [
//     new CopyPlugin({
//       patterns: [
//         {
//           from: 'index.html',
//         },
//         {
//           from: 'assets/**/*',
//         },
//       ],
//     }),
//     new webpack.DefinePlugin({
//       'typeof CANVAS_RENDERER': JSON.stringify(true),
//       'typeof WEBGL_RENDERER': JSON.stringify(true),
//     }),
//   ],

//   optimization: {
//     splitChunks: {
//       cacheGroups: {
//         commons: {
//           test: /[\\/]node_modules[\\/]/,
//           name: 'vendors',
//           chunks: 'all',
//           filename: '[name].app.bundle.js',
//         },
//       },
//     },
//   },
// };
