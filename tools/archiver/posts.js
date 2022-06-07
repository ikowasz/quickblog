const fs = require("fs")
const path = require("path");
const fsPromise = fs.promises

const POSTS_FILTER_REGEX = /.*\.md$/

class Posts {
  static async list() {
    const posts = new Posts()
    return posts.list()
  }

  async list() {
    const dir = await this.get_dir()
    const files = await fsPromise.readdir(dir)
    const posts = files.filter((f) => POSTS_FILTER_REGEX.test(f))
    return posts
  }

  async get_dir() {
    if (!this.posts_path) {
      this.posts_path = path.resolve(__dirname, '../../content/posts')
    }

    return this.posts_path
  }

  async get_path(filename) {
    const dir = await this.get_dir()
    return path.resolve(dir, filename)
  }

  async post_exists(filename) {
    try {
      const path = await this.get_path(filename)
      await fsPromise.stat(path)
      return true
    } catch (e) {
      if (e.code === 'ENOENT') {
        return false
      }
      throw e
    }
  }
}

Posts.FILTER_REGEX = POSTS_FILTER_REGEX

module.exports = Posts
