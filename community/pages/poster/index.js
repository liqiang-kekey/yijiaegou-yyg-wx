var app = getApp();
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var category_id = options.id
    this.getData(category_id);
  },
  getData: function (category_id) {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'marketing.get_poster_index',
        token: token,
        category_id:category_id
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        console.log(res);
        if (res.data.code == 0) {
          let specialList = res.data.list;
          that.setData({lists:specialList})
        } 
      }
    })
  },
  golink:function(e){
    var id = e.currentTarget.dataset.id;
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url+'?coupon_id='+id,
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