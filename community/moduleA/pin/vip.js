var app = getApp();
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');

Page({
  mixins: [require('../../mixin/cartMixin.js')],
  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    info: {},
    cartNum: 0,
    needAuth: false
  },
  specialId: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let id = options.id || 0;
    this.specialId = id;
    if (options.share_id != 'undefined' && options.share_id > 0) wx.setStorageSync('share_id', options.share_id);
    this.getData();
  },

  /**
   * 授权成功回调
   */
  authSuccess: function () {
    this.getData();
    this.setData({
      needAuth: false
    })
  },
 /**
   * 幻灯片跳转
   */
  goBannerUrl: function (t) {
    let idx = t.currentTarget.dataset.idx;
    let { slider_list, needAuth } = this.data;
    if (slider_list.length > 0) {
      let url = slider_list[idx].link;
      let type = slider_list[idx].linktype;
      if (util.checkRedirectTo(url, needAuth)) {
        this.authModal();
        return;
      }
      if (type == 0) {
        // 跳转webview
        url && wx.navigateTo({ url: '/community/pages/web-view?url=' + encodeURIComponent(url) })
      } else if (type == 1) {
        if (url.indexOf('community/pages/index/index') != -1 || url.indexOf('community/pages/order/shopCart') != -1 || url.indexOf('community/pages/user/me') != -1 || url.indexOf('community/pages/type/index') != -1) {
          url && wx.switchTab({ url: url })
        } else {
          url && wx.navigateTo({ url: url })
        }

      } else if (type == 2) {
        // 跳转小程序
        let appid = slider_list[idx].appid;
        appid && wx.navigateToMiniProgram({
          appId: slider_list[idx].appid,
          path: url,
          extraData: {},
          envVersion: 'release',
          success(res) {
            // 打开成功
          },
          fail(error) {
            console.log(error)
          }
        })
      }
    }
  },
  gourl:function(e){
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  getData: function () {
    wx.showLoading();
    var token = wx.getStorageSync('token');
    var that = this;
    var cur_community = wx.getStorageSync('community');
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.vip_info',
        token,
        head_id: cur_community.communityId,
      },
      dataType: 'json',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 0) {
          let list = res.data.list;
          let info = res.data.data;
          let ishowShareBtn = res.data.ishow_special_share_btn || 0;
          let slider_list = res.data.slider_list;
          let nav_list = res.data.nav;
          let business_list = res.data.business;
          wx.setNavigationBarTitle({
            title: info.special_title || 'VIP专区'
          })

          let { full_money, full_reducemoney, is_open_fullreduction, is_open_vipcard_buy, is_vip_card_member, is_member_level_buy } = res.data;
          let reduction = { full_money, full_reducemoney, is_open_fullreduction }

          let noData = (list.length==0)? true : false;
          that.setData({ list, info, ishowShareBtn, noData, reduction ,slider_list,nav_list,business_list})
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
          // 未登录
          that.setData({ needAuth: true });
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this;
    (0, status.cartNum)('', true).then((res) => {
      res.code == 0 && that.setData({
        cartNum: res.data
      })
    });

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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
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