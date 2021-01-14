// community/pages/user/articleProtocol.js
var app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: ''
  },
  token: '',
  articleId: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let id = options.id || 0;
    this.articleId = id;
    let about = options.about || 0;
    var token = wx.getStorageSync('token');
    this.token = token;
    wx.showLoading({ title: '加载中' });
    if (about){
      this.get_about_us();
    }else{
      this.get_article();
    }
  },

  /**
   * 获取列表
   */
  get_article: function () {
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'article.get_article',
        'token': that.token,
        'id': that.articleId
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          var list = res.data.data;
          that.setData({ article: list.content, title: list.title })
          wx.setNavigationBarTitle({
            title: list.title,
          })
        }
      }
    })
  },

  /**
   * 获取列表
   */
  get_about_us: function () {
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'user.get_about_us'
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          var list = res.data.data;
          that.setData({ article: list })
          wx.setNavigationBarTitle({
            title: '关于我们'
          })
        }
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: this.data.title,
      path: "",
      imageUrl: "",
      success: function() {},
      fail: function() {}
    };
  }
})