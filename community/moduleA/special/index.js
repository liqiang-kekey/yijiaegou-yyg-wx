var app = getApp();
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
Page({
  mixins: [require('../../mixin/cartMixin.js')],
  data: {
    list: [],
    info: {},
    cartNum: 0,
    needAuth: false
  },
  specialId: 0,
  onLoad: function (options) {
    let id = options.id || 0;
    this.specialId = id;
    if (options.share_id != 'undefined' && options.share_id > 0) wx.setStorageSync('share_id', options.share_id);
    this.getData(id);
  },
  authSuccess: function () {
    this.getData(this.specialId);
    this.setData({
      needAuth: false
    })
  },
  getData: function (id) {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'marketing.get_special',
        token,
        head_id: cur_community.communityId,
        id
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          let list = res.data.list;
          let info = res.data.data;
          let ishowShareBtn = res.data.ishow_special_share_btn || 0;
          wx.setNavigationBarTitle({
            title: info.special_title || '专题'
          })
          let { full_money, full_reducemoney, is_open_fullreduction, is_open_vipcard_buy, is_vip_card_member, is_member_level_buy } = res.data;
          let reduction = { full_money, full_reducemoney, is_open_fullreduction }

          let noData = (list.length==0)? true : false;
          that.setData({ list, info, ishowShareBtn, noData, reduction })
        } else if (res.data.code == 1) {
          wx.showModal({
            title: '提示',
            content: res.data.msg,
            showCancel: false,
            success(ret){
              if (ret.confirm) {
                wx.switchTab({
                  url: '/community/pages/index/index',
                })
              }
            }
          })
        } else if(res.data.code == 2) {
          that.setData({ needAuth: true });
        }
      }
    })
  },
  onShow: function () {
    let that = this;
    util.check_login_new().then((res) => {
      if (res) {
        this.setData({ needAuth: false });
        (0, status.cartNum)('', true).then((res) => {
          res.code == 0 && that.setData({ cartNum: res.data })
        });
      } else {
        let id = this.specialId;
        this.setData({ needAuth: true, navBackUrl: `/community/pages/supply/index?id=${id}` });
      }
    })
  },
  onPullDownRefresh: function () {
  },
  onShareAppMessage: function (res) {
    var share_title = this.data.info.special_title || '活动专题';
    var share_id = wx.getStorageSync('member_id');
    var id = this.specialId;
    var share_path = `community/moduleA/special/index?id=${id}&share_id=${share_id}`;
    return {
      title: share_title,
      path: share_path,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  }
})