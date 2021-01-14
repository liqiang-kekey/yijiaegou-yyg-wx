var app = getApp();

Page({
  onLoad: function (options) {
    
   
    wx.setNavigationBarTitle({
      title: '兼职团长须知'
    })
    wx.showLoading();
    this.getData();
  },

  getData: function () {
    wx.showLoading();
    
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'distribution.get_rule',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          let article = '';
          let { solitaire_notice } = res.data;
            article = solitaire_notice;
          that.setData({ article })
        }
      }
    })
  }
})