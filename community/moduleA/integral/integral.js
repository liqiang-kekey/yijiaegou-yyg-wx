// community/moduleA/score/signin.js
var util = require('../../utils/util.js');
var app = getApp();
Page({
  mixins: [require('../../mixin/scoreCartMixin.js')],
  data: {
    info: {},
    dayScore: [],
    showSignModal: false,
    list: [],
    loadText: "加载中...",
    noData: 0,
    loadMore: true
  },
  page: 1,
  isLock: false,
  gourl:function(e){
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  onLoad: function () {
    wx.showLoading();
    this.getMemberInfo();
    this.getList();

  },
  getMemberInfo: function () {
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.get_user_info',
        token: token
      },
      dataType: 'json',
      success: function (res) {
        if (res.data.code == 0) {
          if(res.data.needAuth){
            util.clearUserSession();
          }
          let member_info = res.data.data;
          that.setData({member_info:member_info})
            console.log(member_info);
        } else {
          //is_login
          that.setData({
            is_login: false
          })
          wx.setStorage({
            key: "member_id",
            data: null
          })
        }
      }
    })
  },
  onShow: function () {
    let that = this;
    util.check_login_new().then((res) => {
      if (!res) {
        that.setData({
          needAuth: true
        })
      }
    })
  },
  vipModal: function(t) {
    this.setData(t.detail)
  },

  /**
   * 授权成功回调
   */
  authSuccess: function () {
    let that = this;
    that.page = 1;
    this.setData({
      needAuth: false,
      showAuthModal: false,
      list: [],
      loadText: "加载中...",
      noData: 0,
      loadMore: true
    }, () => {
      that.getList();
    })
  },
  authModal: function () {
    if (this.data.needAuth) {
      this.setData({ showAuthModal: !this.data.showAuthModal });
      return false;
    }
    return true;
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
  handleTipModal: function(){
    this.setData({
      showSignModal: !this.data.showSignModal
    })
  },

  getList: function () {
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'signinreward.load_sign_goodslist',
        token,
        pageNum: this.page,
        is_random: 1,
        head_id: cur_community.communityId
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading({});
        if (res.data.code == 0) {
          let h = {};
          let list = res.data.list;
          if (list.length < 10) h.noMore = true;
          let oldList = that.data.list;
          list = oldList.concat(list);
          that.page++;
          that.setData({
            list,
            ...h
          })
        } else {
          let h = {};
          if (that.page == 1) h.noData = 1;
          that.setData({
            loadMore: false,
            noMore: false,
            loadText: "没有更多记录了~",
            ...h
          });
          wx.showToast({
            title: '没有更多记录了',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },

  onReachBottom: function() {
    if (!this.data.loadMore) return false;
    this.getList();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    let info = this.data.info;
    let { signinreward_share_title, signinreward_share_image } = info;
    var share_id = wx.getStorageSync('member_id');
    var share_path = 'community/moduleA/score/signin?share_id=' + share_id;
    return {
      title: signinreward_share_title,
      path: share_path,
      imageUrl: signinreward_share_image,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})