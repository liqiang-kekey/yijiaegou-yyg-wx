var hongbao = 0
var util = require('../../utils/util.js');
var app = getApp();
Page({
  data: {
    lottery_score:0,
    lottery_num:0,
    is_login: true,
    tab_index: 1,
    isHideLoadMore: true,
    no_order: 0,
    quan: [],
    loadText: '加载中',
    awardsList: {},
    money: 0,
    count: 0,
    animationData: {},
    disabled: "disabled",
    able: "able",
    turning: false,
    scale: 1,
    contentHeight: null,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isShare: false,
    isHongbao: false,
    isMini: false,
    lottery_charge_publish:''
  },

  /**
   * 抽奖处理函数：
   */
  getLottery: function () {
    if(!this.authModal()) return;
    var that = this;
    if (that.data.count < that.data.lottery_score) { //判断用户钻石数量是否大于等于5
      wx.showModal({
        title: '提示',
        content:  '积分不足',
        showCancel: false
      })
      return;
    }
    if (that.data.lottery_num<1) { //判断用户钻石数量是否大于等于5
      wx.showModal({
        title: '提示',
        content:  '今日次数已用完',
        showCancel: false
      })
      return;
    }
    var cot = that.data.count
    // var awardIndex = Math.random() * 6 >>> 0;
    // 获取奖品配置
    var awardsConfig = app.awardsConfig,
      runNum = 4,
      awardIndex = 0,
      panNum = app.awardsConfig.awards.length;
    wx.showLoading();
    this.data.no_order = 1
    var token = wx.getStorageSync('token');
    var category_id = this.data.category_id;
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.lucky',
        token: token,
        category_id:category_id
      },
      dataType: 'json',
      method: 'POST',
      success: function (data) {
        wx.hideLoading();
        if (data.data.code == 0) {
          that.setData({
            'count':that.data.count-that.data.lottery_score,
            'lottery_num':that.data.lottery_num-1
          })
          awardIndex = data.data.list.awardIndex
          // 旋转抽奖
          app.runDegs = app.runDegs || 0
          app.runDegs = app.runDegs + (360 - app.runDegs % 360) + (360 * runNum - awardIndex * (360 / panNum))

          var animationRun = wx.createAnimation({
            duration: 4000,
            timingFunction: 'ease'
          })
          that.animationRun = animationRun
          animationRun.rotate(app.runDegs).step()
          that.setData({
            animationData: animationRun.export()
          })
          // 中奖提示
          setTimeout(function () {
            wx.showModal({
              title: '提示',
              content: data.data.list.name,
              showCancel: false
            })
          }, 4000);
        } else {
          that.setData({
            isHideLoadMore: true
          })
          wx.showModal({
            title: '提示',
            content: data.data.msg,
            showCancel: false
          })
          return false;
        }
      }
    })
  },
  onShow: function () {
    var that = this
    wx.setNavigationBarTitle({
      title: '来抽奖吧',
    })
  },
  onReady: function (e) {

  },
  getLuck: function (id) {
    if(!this.authModal()) return;
    var that = this;
    var token = wx.getStorageSync('token');
    wx.showLoading();
    app.util.request({
      'url': 'entry/wxapp/user',
      'data': {
        controller: 'user.lotteryList',
        token: token,
        id:id
      },
      dataType: 'json',
      method: 'POST',
      success: function (data) {
        console.log(data);
        var list = data.data.list;
        wx.hideLoading();
        if (data.data.code == 0) {
          wx.getSystemInfo({
            success: function (res) {
              that.setData({
                contentHeight: res.windowHeight
              });
              if (res.windowWidth < 360) {
                that.setData({
                  scale: 0.9
                })
              } else if (res.windowWidth > 500) {
                that.setData({
                  scale: 1.4
                })
              }
            },
          })
          // getAwardsConfig
          app.awardsConfig = {
            count:list.score,
            awards: list.lottery
          }
          console.log(list.config)
          that.setData({
            count: list.score,
            lottery_num:list.lottery_num,
            lottery_score:list.config.lottery_score,
            category_id:data.data.category_id,
            lottery_charge_publish:list.config.lottery_charge_publish
          })

          // 绘制转盘
          var awardsConfig = app.awardsConfig.awards,
            len = awardsConfig.length,
            rotateDeg = 360 / len / 2 + 90,
            html = [],
            turnNum = 1 / len; // 文字旋转 turn 值
          var ctx = wx.createContext();
          for (var i = 0; i < len; i++) {
            // 保存当前状态
            ctx.save();
            // 开始一条新路径
            ctx.beginPath();
            // 位移到圆心，下面需要围绕圆心旋转
            ctx.translate(150, 150);
            // 从(0, 0)坐标开始定义一条新的子路径
            ctx.moveTo(0, 0);
            // 旋转弧度,需将角度转换为弧度,使用 degrees * Math.PI/180 公式进行计算。
            ctx.rotate((360 / len * i - rotateDeg) * Math.PI / 180);
            // 绘制圆弧
            ctx.arc(0, 0, 150, 0, 2 * Math.PI / len, false);

            // 颜色间隔
            if (i % 2 == 0) {
              ctx.setFillStyle('rgba(255,184,32,.1)');
            } else {
              ctx.setFillStyle('rgba(255,203,63,.1)');
            }

            // 填充扇形
            ctx.fill();
            // 绘制边框
            ctx.setLineWidth(0.5);
            ctx.setStrokeStyle('rgba(228,55,14,.1)');
            ctx.stroke();

            // 恢复前一个状态
            ctx.restore();

            // 奖项列表
            html.push({
              turn: i * turnNum + 'turn',
              lineTurn: i * turnNum + turnNum / 2 + 'turn',
              award: awardsConfig[i].name,
              img: awardsConfig[i].img
            });
          };
          that.setData({
            awardsList: html
          });
          app.globalData.moneyData = {
            count: that.data.count,
            money: that.data.money
          }
        } else {
          wx.showModal({
            title: '提示',
            content: data.data.msg,
            success (res) {
              wx.navigateBack({//返回
                delta: 1
              })
            }
          })

          that.setData({
            isHideLoadMore: true
          })
          return false;
        }
      }
    })
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    var id = this.data.category_id;
    let url = '/community/pages/lucky/lucky?id=' + id;
    app.globalData.navBackUrl = url;
    let currentCommunity = wx.getStorageSync('community');
    let needPosition = this.data.needPosition;
    this.setData({ needAuth: false })
    if (currentCommunity) needPosition = false;
    needPosition || wx.redirectTo({ url })
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
  authModal: function(){
    if(this.data.needAuth) {
      this.setData({ showAuthModal: !this.data.showAuthModal });
      return false;
    }
    return true;
  },
  onLoad: function (options) {
    var that = this;
    var id = options.id;
    that.setData({category_id:id})
    util.check_login_new().then((res) => {
      
      if (res) {
        that.setData({
          needAuth: false
        })
      } else {
        that.setData({
          needAuth: true
        })
      }
      console.log('============'+id)
      that.getMemberInfo();
      this.getLuck(id);
      var m = that.data.money.toFixed(4);
      that.setData({
        money: m
      })
    })
    
  },

  onShareAppMessage: function () {
    var that = this
    return {
      title: '抽奖',
      path: '/pages/canvas/canvas',
      complete: function (res) {
        if (res.errMsg == 'shareAppMessage:ok') {
          //判断是否分享到群
          if (res.hasOwnProperty('shareTickets')) {

            wx.showModal({
              title: '提示',
              content: '哼做的不错好东西就是要乐于分享',
              showCancel: false
            })
            that.setData({
              count: that.data.count + 30,
              isShare: false
            })
          } else {
            wx.showModal({
              title: '提示',
              content: '好东西要分享给大家哦',
              showCancel: false
            })
          }
        }
      }
    }
  },

})