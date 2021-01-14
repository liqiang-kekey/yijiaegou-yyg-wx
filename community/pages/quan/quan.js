var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var a = require("../../utils/public");
var countDownInit = require("../../utils/countDown");
var wcache = require('../../utils/wcache.js');
var app = getApp();
var timerOut = '';

Page({
  mixins: [countDownInit.default, require('../../mixin/globalMixin.js')],
  data: {
    needAuth: false,
    stopClick: false,
    community: {},
    rushList: [],
    commingList: [],
    countDownMap: [],
    actEndMap: [],
    skuList: [],
    pageNum: 1,
    notice_list: [],
    slider_list: [],
    shop_info: {},
    showEmpty: false,
    indexBottomImage: '',
    classification: {
      tabs: [],
      activeIndex: -1
    },
    commingClassification: {
      tabs: [],
      activeIndex: -1
    },
    isShowCommingClassification: true,
    isShowClassification: true,
    showChangeCommunity: false,
    isTipShow: false,
    isShowGuide: false,
    index_lead_image: '',
    theme: 0,
    cartNum: 0,
    navigat: [],
    tabIdx: 0,
    scrollDirect: "",
    isSticky: false,
    showCommingEmpty: false,
    stopNotify: true,
    reduction: {},
    is_share_html: true,
    commingNum: 0,
    couponRefresh: false,
    index_change_cate_btn: 0,
    newComerRefresh: false,
    showCouponModal: false,
    copy_text_arr: [],
    showCopyText: false,
    totalAlertMoney: 0,
    groupInfo: {
      group_name: '社区',
      owner_name: '团长'
    },
    needPosition: true,
    typeTopicList: [],
    pinList: {},
    cube: [],
    secRushList: [],
    secKillGoodsIndex: 1,
    isblack: 0,
    imageSize: {
      imageWidth: "100%",
      imageHeight: 600
    },
    fmShow: true,
  },
  isFirst: 0,
  $data: {
    stickyFlag: false,
    scrollTop: 0,
    overPageNum: 1,
    loadOver: false,
    hasOverGoods: false,
    countDownMap: {},
    actEndMap: {},
    timer: {},
    scrollHeight: 1300,
    stickyTop: 0,
    hasCommingGoods: true
  },
  tpage: 1,
  hasRefeshin: false,
  postion: {},
  options: '',
  focusFlag: false,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({'coupon_id':options.coupon_id})
    wx.getLogManager();
    console.log('options', options);
    
    var that = this;
    var token = wx.getStorageSync('token');
    status.setNavBgColor();
    status.setGroupInfo().then((groupInfo) => { that.setData({ groupInfo }) });
    console.log('step1');
    let community = wx.getStorageSync('community');
    let community_id = community.communityId || '';

    if (options && Object.keys(options).length != 0) {
      console.log('step2');
      var scene = decodeURIComponent(options.scene);
      if (scene != 'undefined') {
        var opt_arr = scene.split("_");
        options.community_id = opt_arr[0];
        wcache.put('share_id', opt_arr[1]);
      }
      that.options = options;

      if (options.share_id != 'undefined' && options.share_id > 0) wcache.put('share_id', options.share_id);
      if (options.community_id != 'undefined' && options.community_id > 0) {
        console.log('step3');
        util.getCommunityById(options.community_id).then((res)=>{
          if (res.code == 0) {
            console.log('step4');
            var shareCommunity = res.data;
            console.log('分享community_id', options.community_id);
            console.log('历史community_id', community_id);
            let sdata = {};
            if (res.open_danhead_model == 1) {
              console.log('开启单社区', res.default_head_info);
              sdata.community = res.default_head_info;
              sdata.open_danhead_model = res.open_danhead_model;
              token && that.addhistory(res.default_head_info.communityId || '');
              wx.setStorageSync('community', res.default_head_info);
            } else if (shareCommunity){
              if (options.community_id != community_id) {
                if (community_id) {
                  sdata.showChangeCommunity = true;
                  sdata.changeCommunity = shareCommunity;
                  sdata.community = community;
                } else {
                  sdata.community = shareCommunity;
                  sdata.shareCommunity = shareCommunity;
                  wcache.put('community', shareCommunity);
                }
              } else {
                sdata.community = community;
              }
            }
            sdata.hidetip = false;
            sdata.token = token;
            sdata.showEmpty = false;
            sdata.needPosition = false;
            that.setData(sdata, ()=>{
              that.getCoupon();
            });
          } else {
            console.log('step5');
            that.getCoupon();
            that.setData({
              hidetip: false,
              token: token,
              showEmpty: false,
              needPosition: false
            })
          }
          token && that.addhistory();
        })
      } else {
        util.getCommunityById(options.community_id).then((res) => {
          if (res.code == 0) {
            if (res.open_danhead_model == 1) {
              console.log('开启单社区step6');
              that.setData({ community: res.default_head_info, open_danhead_model: res.open_danhead_model })
              token && that.addhistory(res.default_head_info.communityId || '');
              wx.setStorageSync('community', res.default_head_info);
            }
            console.log('step6');
            that.getCoupon();
          }
        }).catch(() => {
          that.getCoupon();
        })
      }
    } else {
      util.getCommunityById(options.community_id).then((res) => {
        if (res.code == 0) {
          if (res.open_danhead_model == 1) {
            console.log('开启单社区step7');
            that.setData({ community: res.default_head_info, open_danhead_model: res.open_danhead_model })
            token && that.addhistory(res.default_head_info.communityId || '');
            wx.setStorageSync('community', res.default_head_info);
          }
          that.getCoupon();
        }
      }).catch(()=>{
        that.getCoupon();
      })
      console.log('step7');
      that.setData({
        hidetip: false,
        token: token,
        showEmpty: false,
        community
      })
    }
  },

 

 /**
   * 优惠券获取
   */
  getCoupon: function () {
    let that = this;
    let token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/index',
      data: { controller: 'goods.get_seller_quan', token,coupon_id:that.data.coupon_id },
      dataType: 'json',
      success: function (res) {
        console.log(res);
        let list = res.data.quan_list;
        let hasCoupon = false;
        let hasAlertCoupon = false;
        if (Object.prototype.toString.call(list) == '[object Object]' && Object.keys(list).length > 0) hasCoupon = true;
        if (Object.prototype.toString.call(list) == '[object Array]' && list.length > 0) hasCoupon = true;

        let alert_quan_list = res.data.alert_quan_list || [];
        if (Object.prototype.toString.call(alert_quan_list) == '[object Object]' && Object.keys(alert_quan_list).length > 0) hasAlertCoupon = true;
        if (Object.prototype.toString.call(alert_quan_list) == '[object Array]' && alert_quan_list.length > 0) hasAlertCoupon = true;

        let totalAlertMoney = 0;
        if (Object.prototype.toString.call(alert_quan_list) == '[object Object]' && Object.keys(alert_quan_list).length > 0) {
          Object.keys(alert_quan_list).forEach(function(item){
            totalAlertMoney += alert_quan_list[item].credit*1;
          })
        } else if (Object.prototype.toString.call(alert_quan_list) == '[object Array]' && alert_quan_list.length > 0) {
          alert_quan_list.forEach(function (item) {
            totalAlertMoney += item.credit * 1;
          })
        }

        that.setData({
          quan: res.data.quan_list || [],
          alert_quan_list,
          hasCoupon,
          hasAlertCoupon,
          showCouponModal: hasAlertCoupon,
          totalAlertMoney: totalAlertMoney.toFixed(2)
        })
      }
    });
  },
  
  /**
   * 授权成功回调
   */
  authSuccess: function() {
    console.log('authSuccess');
    var id = this.data.category_id;
    let url = '/community/pages/quan/quan';
    app.globalData.navBackUrl = url;
    let currentCommunity = wx.getStorageSync('community');
    let needPosition = this.data.needPosition;
    this.setData({ needAuth: false })
    if (currentCommunity) needPosition = false;
    needPosition || wx.redirectTo({ url })
    this.getCoupon();
  },
  authModal: function (e = {}) {
    if(this.data.needAuth) {
      this.setData({ showAuthModal: !this.data.showAuthModal });
      return false;
    }
    return true;
  },
   /**
   * 关闭授权
   */
  close: function () {
    this.triggerEvent("cancel");
  },
  receiveCoupon: function (event) {
    if (!this.authModal()) return;
    let quan_id = event.currentTarget.dataset.quan_id;
    let type = event.currentTarget.dataset.type || 0;
    var token = wx.getStorageSync('token');
    var quan_list = [];
    if(type==1) {
      quan_list = this.data.alert_quan_list;
    } else {
      quan_list = this.data.quan;
    }
    var that = this;

    app.util.request({
      url: 'entry/wxapp/index',
      data: { controller: 'goods.getQuan', token, quan_id },
      dataType: 'json',
      success: function (msg) {
        //1 被抢光了 2 已领过  3  领取成功
        if (msg.data.code == 0) {
          wx.showToast({
            title: msg.data.msg || '被抢光了',
            icon: 'none'
          })
        } else if (msg.data.code == 1) {
          wx.showToast({
            title: '被抢光了',
            icon: 'none'
          })
        } else if (msg.data.code == 2) {
          wx.showToast({
            title: '已领取',
            icon: 'none'
          })
          var new_quan = [];
          for (var i in quan_list) {
            if (quan_list[i].id == quan_id) quan_list[i].is_get = 1;
            new_quan.push(quan_list[i]);
          }
          that.setData({ quan: new_quan })
        }
        else if (msg.data.code == 4) {
          wx.showToast({
            title: '新人专享',
            icon: 'none'
          })
        } 
        else if (msg.data.code == 3) {
          var new_quan = [];
          for (var i in quan_list) {
            if (quan_list[i].id == quan_id) quan_list[i].is_get = 1;
            new_quan.push(quan_list[i]);
          }
          if(type==1) {
            that.setData({ alert_quan_list: new_quan })
          } else {
            that.setData({ quan: new_quan })
          }
          wx.showToast({
            title: '领取成功',
          })
        } else if (msg.data.code == 4) {
          // 未登录
        }
      }
    })
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
    // 页面显示
    let that = this;
    console.log('isblack', app.globalData.isblack)
    this.setData({ stopNotify: false, tabbarRefresh: true, isblack: app.globalData.isblack || 0 })

    util.check_login_new().then((res) => {
      if(res) {
        that.setData({ needAuth: false })
      } else {
        this.setData({ needAuth: true, couponRefresh: false });
        return;
      }
    })

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