const path = require('path')
const util = require('util')
const fs = require('fs')
const child_process = require('child_process')
const fsPromise = fs.promises
const exec = util.promisify(child_process.exec)

const Posts = require('./posts')

const DATED_POST_REGEX = /^(\d{4}_\d{2}_\d{2}_\d{2}_\d{2}|__top.*)_.*/

class Archiver {
  static run() {
    const archiver = new Archiver()
    return archiver.archive_posts()
  }

  constructor() {
    this.posts = new Posts()
  }

  async list_unarchived_posts() {
    const posts = await this.posts.list()
    const unarchived = posts.filter((f) => !DATED_POST_REGEX.test(f))
    return unarchived
  }

  async get_git_added_date(path) {
    const command = `git log --follow --format=%at --date default "${path}" | tail -1`
    const { stdout } = await exec(command)
    const timestamp = stdout.trim() * 1000
    if (timestamp === 0) {
      return
    }

    const date = new Date(timestamp)
    return date
  }

  async get_file_mtime(path) {
    const stat = await fsPromise.stat(path)
    if (!stat || !stat.mtime) {
      return
    }

    return stat.mtime
  }

  async get_post_archiving_date(filename) {
    const path = await this.posts.get_path(filename)

    try {
      const git_added = await this.get_git_added_date(path)
      if (git_added) {
        return git_added
      }
    } catch (e) {
      console.log(`Error with mtime while accessing ${filename}`)
      console.error(e)
    }

    try {
      const mtime = await this.get_file_mtime(path)
      if (mtime) {
        return mtime
      }
    } catch (e) {
      console.log(`Error with mtime while accessing ${filename}`)
      console.error(e)
    }

    return new Date()
  }

  async get_post_new_name(filename) {
    const date = await this.get_post_archiving_date(filename)
    const year = date.getFullYear()
    const month = this.fillzeros(date.getMonth() + 1)
    const day = this.fillzeros(date.getDate())
    const hour = this.fillzeros(date.getHours())
    const minutes = this.fillzeros(date.getMinutes())
    const datestr = `${year}_${month}_${day}_${hour}_${minutes}`
    return `${datestr}_${filename}`
  }

  fillzeros(num) {
    return ('0' + num).slice(-2)
  }

  async update_post(filename) {
    const new_name = await this.get_post_new_name(filename)
    if (await this.posts.post_exists(new_name)) {
      console.log(`Post ${filename} already exists`)
      return false
    }

    const current_path = await this.posts.get_path(filename)
    const new_path = await this.posts.get_path(new_name)
    await fsPromise.rename(current_path, new_path)
    console.log(`Post ${filename} renaming to ${new_name}`)

    return new_name
  }

  async archive_posts() {
    const posts = await this.list_unarchived_posts()
    const archived_posts = await Promise.all(posts.map((p) => this.update_post(p)))
    return archived_posts
  }

}

module.exports = Archiver