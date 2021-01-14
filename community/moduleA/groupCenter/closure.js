var app = getApp();
var util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(!util.check_login()){
      wx.redirectTo({
        url: '/community/pages/user/me',
      })
    }
    this.getList();
  },

  getList: function(){
    wx.showLoading();
    var that = this;
    var token = wx.getStorageSync('token');

    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'community.get_community_hexiao_memberlist',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        console.log(res)
        if(res.data.code==0){
          that.setData({ list: res.data.member_list })
        } else {
          console.log(res.data.log)
        }
        wx.hideLoading();
      }
    })
  },

  goQrcode: function(){
    wx.navigateTo({
      url: '/community/moduleA/groupCenter/addHexiao'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  }
})