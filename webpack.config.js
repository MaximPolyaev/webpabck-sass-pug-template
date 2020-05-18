const path                           = require('path');
const HtmlWebpackPlugin              = require('html-webpack-plugin');
const {CleanWebpackPlugin}           = require('clean-webpack-plugin');
const CopyWebpackPlugin              = require('copy-webpack-plugin');
const MiniCssExtractPlugin           = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin            = require('terser-webpack-plugin');
const glob                           = require('glob');
const ImageminPlugin                 = require("imagemin-webpack");

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const optimization = () => {
    const cfg = {
        splitChunks: {
            chunks: "all"
        }
    };

    if (isProd) {
        cfg.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }

    return cfg;
};

const jsLoaders = () => {
    const loaders = [];

    if(isProd) {
        loaders.push({
            loader: 'babel-loader',
            options: {
                presets: [
                    '@babel/preset-env'
                ]
            }
        });
    }

    if(isDev) {
        loaders.push('eslint-loader')
    }

    return loaders;
};

const pluginsOptions = () => {
    const options = [
        // new HtmlWebpackPlugin({
        //     template: './index.html',
        //     minify: {
        //         collapseWhitespace: false
        //     }
        // }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/static'),
                    to: path.resolve(__dirname, 'dist')
                }
            ]
        }),
        new MiniCssExtractPlugin({
            filename: 'assets/css/[name].[contenthash].css'
        }),
    ];

    if(isProd) {
        options.push(new ImageminPlugin({
            bail: false, // Ignore errors on corrupted images
            cache: true,
            imageminOptions: {
                // Before using imagemin plugins make sure you have added them in `package.json` (`devDependencies`) and installed them

                // Lossless optimization with custom option
                // Feel free to experiment with options for better result for you
                plugins: [
                    ["gifsicle", { interlaced: true }],
                    ["jpegtran", { progressive: true, quality: 100 }],
                    ["optipng", { optimizationLevel: 5 }],
                    [
                        "svgo",
                        {
                            plugins: [
                                {
                                    removeViewBox: false
                                }
                            ]
                        }
                    ]
                ]
            }
        }));
    }

    let pages = glob.sync(__dirname + '/src/pages/*.pug');

    pages.forEach(function (file) {
        let base = path.basename(file, '.pug');
        options.push(
            new HtmlWebpackPlugin({
                filename: './' + base + '.html',
                template: './pages/' + base + '.pug',
                inject: true
            })
        )
    });


    return options;
};


module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: {
        main: [
            '@babel/polyfill',
            './app.js'
        ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: isProd ? 'assets/js/[name].bundle.[contenthash].js' : 'assets/js/[name].bundle.js'
    },
    devtool: isDev ? "source-map" : "",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: jsLoaders()
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev,
                            reloadAll: true
                        }
                    },
                    {
                        loader: 'css-loader'
                    }
                ]
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: isDev,
                            reloadAll: true
                        }
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            {
                test: /\.(jpeg|jpg|png|svg|gif)/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[contenthash:4].[ext]'
                        }
                    }
                ],
            },
            {
                test: /\.(ttf|woff|woff2|eot)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[contenthash:4].[ext]',
                            outputPath: (url, resourcePath) => {
                                const outputPath = (resourcePath.match(/\\fonts\\(?<outputPath>.+)\\.+\..+$/)).groups.outputPath.replace('\\', '/');
                                return `assets/fonts/${outputPath}/${url}`;
                            },
                            publicPath:  (url, resourcePath) => {
                                const outputPath = (resourcePath.match(/\\fonts\\(?<outputPath>.+)\\.+\..+$/)).groups.outputPath.replace('\\', '/');
                                return `../fonts/${outputPath}/${url}`;
                            },
                        }
                    }
                ]
            },
            {
                test: /\.(pug|jade)$/,
                loader: 'pug-loader',
                options: {
                    pretty: isDev
                }
            }
        ],
    },
    optimization: optimization(),
    devServer: {
        port: 8080,
        hot: isProd
    },
    plugins: pluginsOptions(),
    resolve: {
        alias: {
            '@css': path.resolve(__dirname, 'src/assets/css')
        }
    }
};