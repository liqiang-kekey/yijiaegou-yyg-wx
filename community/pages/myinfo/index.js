var app = getApp()
var locat = require('../../utils/Location.js');
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var wcache = require('../../utils/wcache.js');

Page({
  data: {
    tempFilePaths: '',
    nickName: '',
    userInfoAvatar: '',
    sex: '',
    province: '',
    city: '',
    realname: '',
    mobile: '',
    birth: '',
    items: [{
        name: 'man',
        value: '男'
      },
      {
        name: 'femail',
        value: '女',
        checked: 'true'
      },
      {
        name: 'bm',
        value: '保密'
      }
    ]
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
        console.log(res);
        wx.hideLoading();
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
  bindrealname: function (e) {
    this.setData({
      realname: e.detail.value
    })
  },
  bindmobile: function (e) {
    this.setData({
      mobile: e.detail.value
    })
  },
  bindbirth: function (e) {
    this.setData({
      birth: e.detail.value
    })
  },
  checkPhone(phone) {
    if (!(/^1[34578]\d{9}$/.test(phone))) {
      wx.showToast({
        title: '手机号有误',
        icon: 'none',
        duration: 2000
      })
      return 0;
    } else {
      return 1;
    }
  },
  saveinfo: function () {
    var realname = this.data.realname;
    var mobile = this.data.mobile;
    var birth = this.data.birth;
    const check = this.checkPhone(mobile);
    if (realname == '') {
      wx.showToast({
        title: '请填写真实姓名',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    if (mobile == '') {
      wx.showToast({
        title: '请填写手机号',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    if (check != 1) {
      wx.showToast({
        title: '手机号有误',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.update_user_infos',
        token: wx.getStorageSync("token"),
        realname,
        mobile,
        birth
      },
      dataType: 'json',
      success: function(res) {

        if(res.data.code==0) {
          wx.showModal({
            title: '提示',
            content: '修改成功',
            showCancel: false,
            success(ret){
              if (ret.confirm) {
                wx.switchTab({
                  url: '/community/pages/user/me',
                })
              }
            }
          })
        }else{
          wx.showToast({
            title: '登录信息失效',
            icon: 'none',
          })
        }
      }
    })

  },
  onLoad: function () {
    var that = this;
    this.getMemberInfo();
    wx.getUserInfo({
      success: function (res) {
        // success
        that.setData({
          nickName: res.userInfo.nickName,
          userInfoAvatar: res.userInfo.avatarUrl,
        })
      },
      fail: function () {
        // fail
        console.log("获取失败！")
      },
      complete: function () {
        // complete
        console.log("获取用户信息完成！")
      }
    })
  }
})