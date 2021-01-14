var app = getApp();
var util = require('../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    selected: 0,
    list: [],
    content:[]
  },
   //tab框
   selected: function (e) {
    let that= this
    let index = e.currentTarget.dataset.index;
    this.setData({content:this.data.list[index].list});
    that.setData({
      selected: index
    })
  },
  getData: function () {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'marketing.get_business_list',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          let specialList = res.data.data;
            that.setData({list:specialList})
            that.setData({content:specialList[0].list})
        } 
      }
    })
  },
  godetail:function(e){
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/community/pages/business/detail?id='+id,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getData();
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