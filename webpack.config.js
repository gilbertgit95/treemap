var path = require('path');

module.exports = {
    entry: './test/main.ts',
    devtool: 'inline-source-map',
    mode: "development",
    devServer: {
        contentBase: './test'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        path: path.resolve(__dirname, 'test/testBuild'),
        filename: 'main.js'
    }
}