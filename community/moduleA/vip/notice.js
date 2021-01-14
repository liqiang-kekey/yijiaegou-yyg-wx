var app = getApp();

Page({

  data: {

  },

  onLoad: function (options) {
    this.getData();
  },

  onShow: function () {

  },

  getData: function () {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'vipcard.get_vipcard_baseinfo',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          let { vipcard_buy_pagenotice } = res.data.data;
          that.setData({ vipcard_buy_pagenotice })
        }
      }
    })
  }
})