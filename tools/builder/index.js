const fs = require('fs')
const path = require("path");
const MarkdownIt = require('markdown-it')
const Eta = require('eta')
const fsPromise = fs.promises
const md = MarkdownIt()

const Posts = require('./posts')
const paths = require('./paths')

class Builder {
  static async build() {
    const builder = new Builder()
    return builder.build_index()
  }

  constructor() {
    this.posts = new Posts()
  }

  async build_index() {
    const output_file = path.resolve(paths.output, 'index.html')
    const html = await this.render_index()
    await fsPromise.mkdir(paths.output, {recursive: true})
    await fsPromise.writeFile(output_file, html)

    return paths.output
  }

  async render_index() {
    const output = await this.render_template('index')
    return output
  }

  async render_template(name) {
    const template = await this.get_template(name)
    const content = await this.get_content()
    const render = Eta.render(template, {content})
    return render
  }

  async get_template(name) {
    const template_path = await this.get_template_path(name)
    const data = await fsPromise.readFile(template_path)
    const text = data.toString()
    return text
  }

  async get_template_path(name) {
    const template_path = path.resolve(paths.templates, `${name}.eta.html`)
    return template_path
  }

  async get_content() {
    const posts = await this.posts.list()
    const rendered_posts = await Promise.all(posts.map(p => this.render_post(p)))
    const content = rendered_posts.join("\n\n")
    return content
  }

  async render_post(name) {
    const content = await this.posts.post_load(name)
    const html = md.render(content)
    const section = `<section>\n${html}\n</section>`
    return section
  }
}

module.exports = Builder