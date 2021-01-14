// community/pages/package/index.js
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var a = require("../../utils/public");
var countDownInit = require("../../utils/countDown");
var wcache = require('../../utils/wcache.js');
var app = getApp();
var timerOut = '';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    dataList: [

    ],
  },
  refound: function (e) {
    
    var id = e.currentTarget.dataset.id;
    var token = wx.getStorageSync('token');
    var that = this;
    wx.showModal({
      title: '取消订单并退款',
      content: '取消订单后，款项将原路退回到您的支付账户。',
      confirmText: '取消订单',
      confirmColor: '#ff5344',
      cancelText: '再等等',
      cancelColor: '#666666',
      success(res) {
        if (res.confirm) {
          app.util.request({
            'url': 'entry/wxapp/index',
            'data': {
              controller: 'index.load_package_refound_order',
              token: token,
              id: id
            },
            dataType: 'json',
            success: function (res) {
              console.log(res);

              if (res.data.code == 0) {
                wx.showModal({
                  title: '提示',
                  showCancel:false,
                  content: res.data.msg,
                  success (res) {
                    wx.switchTab({
                      url: '/community/pages/user/me',
                    })
                  }
                })
                
                //that.setData({dataList:res.data.list})
              }else{
                wx.showModal({
                  title: '提示',
                  showCancel:false,
                  content:  res.data.msg,
                  success (res) {
                    
                  }
                })
              }
            },
            complete: function () {
              // wx.hideLoading();
              setTimeout(function () {
                wx.hideLoading();
              }, 1000);
            }
          })
          console.log('用户点击确定')
        } else if (res.cancel) {
          that.canCancel = true;
          console.log('用户点击取消')
        }
      }
    })



  },
  detail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/community/pages/packages/mycoin?id=' + id,
    })
  },
  /**
   * 获取商品列表
   */
  load_goods_data: function () {
    var token = wx.getStorageSync('token');
    var that = this;
    console.log('load_goods_begin ');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.load_package_order',
        token: token,
      },
      dataType: 'json',
      success: function (res) {
        console.log(res);

        if (res.data.code == 0) {
          that.setData({
            dataList: res.data.list
          })
        }
      },
      complete: function () {
        // wx.hideLoading();
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.load_goods_data();
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