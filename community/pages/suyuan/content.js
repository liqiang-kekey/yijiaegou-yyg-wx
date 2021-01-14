// community/pages/suyuan/content.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
  devlist:{},
  },

  goLink: function(event) {
    let url = event.currentTarget.dataset.url;
    console.log(url)
    wx.navigateTo({ url })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_suyuan_info',
      },
      dataType: 'json',
      success: function (res) {
        console.log(res);
        let devlist = res.data;
        //
        that.setData({ 
          devlist: devlist,
        });
        //console.log("onload:"+that.data.sn);
        wx.setStorageSync('devlist', devlist);
      }
    });
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