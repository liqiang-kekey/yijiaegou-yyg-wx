var app = getApp();
var util = require('../../utils/util.js');

Page({
  mixins: [require('../../mixin/commonMixin.js')],
  /**
   * 页面的初始数据
   */
  data: {
    info: [],
    member_info: {
      username: '',
      member_id: 1,
      avatar: "../../images/head-bitmap.png"
    },
    info: {
      total_money: 0,
      share_name: '无'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    util.check_login_new().then((res) => {
      if (res) {
        that.setData({
          needAuth: false
        })
        that.getUser();
        that.getData();
      } else {
        that.setData({
          needAuth: true
        })
      }
    })
  },

  /**
   * 授权成功回调
   */
  authSuccess: function () {
    let that = this;
    this.setData({
      needAuth: false
    }, () => {
      that.getUser();
      that.getData();
    })
  },

  getData: function () {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'distribution.get_commission_info',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          that.setData({ info: res.data.data })
        } else {
          console.log(res.data);
          wx.showModal({
            title: '提示',
            content: res.data.msg,
            showCancel: false,
            success(res) {
              if (res.confirm) {
                console.log('用户点击确定')
                wx.reLaunch({
                  url: '/community/pages/user/me',
                })
              }
            }
          })
        }
      }
    })
  },

  getUser: function(){
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.get_user_info',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          if(res.data.needAuth){
            util.clearUserSession();
          }
          let commiss_diy_name = res.data.commiss_diy_name || '分销';
          wx.setNavigationBarTitle({
            title: `${commiss_diy_name}中心`,
          })
          that.setData({ member_info: res.data.data })
        } else {
          //is_login
          that.setData({ needAuth: true })
          wx.setStorage({
            key: "member_id",
            data: null
          })
        }
      }
    })
  },

  goLink: function (event) {
    if (!this.authModal()) return;
    let link = event.currentTarget.dataset.link;
    var pages_all = getCurrentPages();
    if (pages_all.length > 3) {
      wx.redirectTo({
        url: link
      })
    } else {
      wx.navigateTo({
        url: link
      })
    }
  },
})