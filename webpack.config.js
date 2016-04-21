var nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        browser: './src/index.js'
    },
    output: {
        path: __dirname,
        filename: 'app.js'
    },
    module: {
        preLoaders: [
            {
                test: /\.js?$/,
                loader: 'eslint-loader',
                exclude: /node_modules/
            }
        ],
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    target: 'node',
    externals: [nodeExternals()]
};
