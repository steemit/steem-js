# `steem-js` webpack configuration example
This is a demo of `steem-js` and webpack usage targetting both the Web and
Node.js platforms.

## Minimal configuration
`steem-js` requires JSON files internally, so you need JSON loader configured:
```json
{
  ...
  module: {
    loaders: [
        { test: /\.json$/, loader: 'json-loader'},
    ]
  }
  ...
}
```

Make sure `resolve.extensions` and `json-loader`'s `module.loaders[...].exclude`
do not exclude `.json` files or `node_modules` from resolving.

## Compiling the example
Compiling for the web (`bundle.js`, which you can test with `open index.html`):
```
webpack
```

Compiling for node.js (`node-bundle.js`, which you can test with `node node-bundle.js`):
```
USE_NODE=1 webpack
```
