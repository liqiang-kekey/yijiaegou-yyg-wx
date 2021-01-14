// community/distributionCenter/pages/fanseconomy.js
var page = 1;
var app = getApp();
var util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
  economylist:[],
  containerHeight: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var sysInfo = wx.getSystemInfoSync();
    this.setData({
      containerHeight: sysInfo.windowHeight - Math.round(sysInfo.windowWidth / 375 * 125)
    });
    this.getData();
  },
  //
  getData: function() {
    var token = wx.getStorageSync('token');
    let that = this;
    //Todo
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'distribution.get_profitflow',
        token: token
      },
      dataType: 'json',
      success: function(res) {
        if (res.data.code == 0) {
          //console.log(res.data.data)
          that.setData({
            economylist: res.data.data,
          })
        } 
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})