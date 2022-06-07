const fs = require('fs')
const path = require("path");
const MarkdownIt = require('markdown-it')
const fsPromise = fs.promises
const md = MarkdownIt()

const Posts = require('./posts')

class Builder {
  static async build() {
    const builder = new Builder()
    return builder.build()
  }

  constructor() {
    this.posts = new Posts()
  }

  async build() {
    const output_dir = path.resolve(__dirname, '../../dist')
    const output_path = path.resolve(output_dir, 'blog.html')
    const data = await this.get_blog()
    await fsPromise.mkdir(output_dir, {recursive: true})
    await fsPromise.writeFile(output_path, data)

    return output_path
  }

  async get_blog() {
    const template = await this.get_template()
    const content = await this.get_content()
    const rendered = template.replace(/\<\!--\s*content\s*--\>/, content)

    return rendered
  }

  async get_template() {
    const template_path = path.resolve(__dirname, '../../content/template.html')
    const data = await fsPromise.readFile(template_path)
    const text = data.toString()
    return text
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