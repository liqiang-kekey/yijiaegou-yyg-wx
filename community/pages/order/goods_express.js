// pages/order/goods_express.js
var app = getApp()
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
    var that = this;
    var token = wx.getStorageSync('token');
    var order_id = options.id;
    wx.showLoading();
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'user.goods_express',
        token: token,
        order_id: order_id
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 2) {
          wx.redirectTo({
            url: '/community/pages/index/index',
          })
        } else if (res.data.code == 0) {
          //code goods_image
          that.setData({
            seller_express: res.data.seller_express,
            goods_info: res.data.goods_info,
            order_info: res.data.order_info
          })

        }
      }
    })

  }
})