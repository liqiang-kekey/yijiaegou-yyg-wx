/**
 * 封装日期函数
 * const date = require('../../module/date.js')
 * date.info('hello test hahaha')
 */
module.exports = {
  // 初始化
  init(date) {
    return date ? new Date(date) : new Date()
  },
  // 年,月,日,时,分,秒
  year(date) {
    return this.init(date).getFullYear()
  },
  month(date) {
    return this.init(date).getMonth() + 1
  },
  day(date) {
    return this.init(date).getDate()
  },
  hour(date) {
    return this.init(date).getHours()
  },
  minute(date) {
    return this.init(date).getMinutes()
  },
  second(date) {
    return this.init(date).getSeconds()
  },

  // 时间戳
  timestamp(date) {
    return parseInt(this.init(date).getTime() / 1000)
  },

  // 日期时间
  dateTime(date) {
    date = this.init(date)
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let second = date.getSeconds()
    return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':')
  },
  // 日期时间
  dateTime2(date) {
    date = this.init(date)
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let second = date.getSeconds()
    return [year, month, day].map(this.formatNumber).join('-')
  },
  // 月日补0
  formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  }

}