const path = require('path')

const base_path = process.cwd()
const output_path = path.resolve(base_path, 'dist')
const content_path = path.resolve(base_path, 'content')
const templates_path = path.resolve(content_path, 'templates')

module.exports = {base: base_path, output: output_path, content: content_path, templates: templates_path}