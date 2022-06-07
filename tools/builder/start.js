#!/usr/bin/node
const Builder = require('./index')

Builder.build()
  .then((path) => console.log(`Successfully builded to ${path}`))
  .catch((err) => console.error(err))