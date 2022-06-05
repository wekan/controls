'use strict'

const fs = require('fs')
const files = fs.readdirSync(__dirname)

const controls = {}

for (const file of files) {
  if (['index.js'].includes(file)) continue
  if (file.endsWith('test.js')) continue

  const control = require(`./${file}`)
  controls[control.name] = control
}

module.exports = controls
