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
    $data: {
      stickyFlag: false,
      id: '',
      scene: '',
      community_id: 0
    },
    imageSize: {
      imageWidth: "100%",
      imageHeight: 600
    },
  },
  submit: function(e) {
    var from_id = e.detail.formId;
    var token = wx.getStorageSync('token');
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.get_member_form_id',
        'token': token,
        "from_id": from_id
      },
      dataType: 'json',
      success: function(res) {}
    })
  },
  gogoodsdetai:function(e){
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/community/pages/goods/goodsDetail?id='+id,
    })
  },
/**
   * 授权成功回调
   */
  authSuccess: function() {
    var id = this.data.goodsid;
    let url = '/community/pages/packages/detail?id=' + id;
    app.globalData.navBackUrl = url;
    let currentCommunity = wx.getStorageSync('community');
    let needPosition = this.data.needPosition;
    this.setData({ needAuth: false })
    if (currentCommunity) needPosition = false;
    needPosition || wx.redirectTo({ url })
  },

  authModal: function(){
    if(this.data.needAuth) {
      this.setData({ showAuthModal: !this.data.showAuthModal });
      return false;
    }
    return true;
  },
  gobuy:function(e){
    if(!this.authModal()) return;
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/community/pages/packages/placeOrder?id=' + id
    })
  },
 /** 
   * 图片信息
   */
  imageLoad: function(e) {
    var imageSize = util.imageUtil(e)
    this.setData({
      imageSize
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
    
    this.setData({'goodsid':options.id})
    var id = options.id;
    var token = wx.getStorageSync('token');
    var that = this;
    console.log('load_goods_begin ');
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.load_package_goodsdetail',
        token: token,
        id:id
      },
      dataType: 'json',
      success: function(res) {
        console.log(res);
      
        if (res.data.code == 0) {
          that.setData({goods:res.data.list,coin:res.data.coin})
        }
      },
      complete: function() {
        // wx.hideLoading();
        setTimeout(function(){ wx.hideLoading(); },1000);
      }
    })
    that.getMemberInfo();
  },
  getMemberInfo: function() {
    var token = wx.getStorageSync('token');
    let that = this;
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.get_user_info',
        token: token
      },
      dataType: 'json',
      success: function(res) {
        // wx.hideLoading();
        setTimeout(function(){ wx.hideLoading(); },1000);
        if (res.data.code == 0) {
          if(res.data.needAuth){
            util.clearUserSession();
          }
          let showGetPhone = false;
          if (res.data.is_show_auth_mobile == 1 && !res.data.data.telephone) showGetPhone = true;
          let member_info = res.data.data || '';
          let params = {};

          if (member_info){
            member_info.member_level_info && (member_info.member_level_info.discount = (member_info.member_level_info.discount/10).toFixed(1));
            //开启分销
            if (res.data.commiss_level > 0) {
              //还差多少人升级
              let commiss_share_member_update = res.data.commiss_share_member_update * 1;
              let share_member_count = res.data.share_member_count * 1;
              let need_num_update = res.data.commiss_share_member_update * 1 - res.data.share_member_count * 1;

              //判断表单状态状态
              let formStatus = 0; //未填写 1 已填写未审核 2 已审核
              if (member_info.is_writecommiss_form == 1) {
                formStatus = 1;
                //已填写
                if (member_info.comsiss_flag == 1) {
                  member_info.comsiss_state == 0 ? formStatus = 1 : formStatus = 2;
                }
              }

              params = {
                formStatus,
                commiss_level: res.data.commiss_level,
                commiss_sharemember_need: res.data.commiss_sharemember_need,
                commiss_share_member_update,
                commiss_biaodan_need: res.data.commiss_biaodan_need,
                share_member_count,
                today_share_member_count: res.data.today_share_member_count,
                yestoday_share_member_count: res.data.yestoday_share_member_count,
                need_num_update
              };
            }
          } else {
            params.needAuth = true;
          }

          let { is_supply, is_open_vipcard_buy, modify_vipcard_name, is_vip_card_member, modify_vipcard_logo, isopen_signinreward, show_signinreward_icon, is_open_supplymobile,needAuth,show_user_tuan_mobile } = res.data;
          that.setData({
            ...params,
            member_info,
            is_supply: is_supply || 0,
            showGetPhone: showGetPhone,
            is_open_vipcard_buy: is_open_vipcard_buy || 0, 
            modify_vipcard_name: modify_vipcard_name || "会员", 
            is_vip_card_member: is_vip_card_member || 0,
            modify_vipcard_logo,
            show_signinreward_icon,
            isopen_signinreward,
            is_open_supplymobile,
            needAuth,
            show_user_tuan_mobile
          });
        } else {
          //needAuth
          that.setData({
            needAuth: true
          })
          wx.setStorage({
            key: "member_id",
            data: null
          })
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