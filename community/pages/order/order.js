var util = require('../../utils/util.js');
var app = getApp();
var status = require('../../utils/index.js');

function count_down(that, total_micro_second) {
  var second = Math.floor(total_micro_second / 1000);
  var days = second / 3600 / 24;
  var daysRound = Math.floor(days);
  var hours = second / 3600 - (24 * daysRound);
  var hoursRound = Math.floor(hours);
  var minutes = second / 60 - (24 * 60 * daysRound) - (60 * hoursRound);
  var minutesRound = Math.floor(minutes);
  var seconds = second - (24 * 3600 * daysRound) - (3600 * hoursRound) - (60 * minutesRound);

  that.setData({
    endtime: {
      days: daysRound,
      hours: fill_zero_prefix(hoursRound),
      minutes: fill_zero_prefix(minutesRound),
      seconds: fill_zero_prefix(seconds),
      show_detail: 1
    }
  });

  if (total_micro_second <= 0) {
    that.setData({
      changeState: 1,
      endtime: {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      }
    });
    return;
  }

  setTimeout(function() {
    total_micro_second -= 1000;
    count_down(that, total_micro_second);
  }, 1000)

}
// 位数不足补零
function fill_zero_prefix(num) {
  return num < 10 ? "0" + num : num
}

Page({
  mixins: [require('../../mixin/compoentCartMixin.js'), require('../../mixin/globalMixin.js')],
  data: {
    endtime: {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    },
    cancelOrderVisible: false,
    orderSkuResps: [],
    tablebar: 4,
    navState: 0,
    theme_type: '',
    loadover: false,
    pingtai_deal: 0,
    is_show: false,
    order: {},
    common_header_backgroundimage: '',
    isShowModal: false,
    userInfo: {},
    groupInfo: {
      group_name: '社区',
      owner_name: '团长',
      delivery_ziti_name: '到点自提',
      delivery_tuanzshipping_name: '团长配送',
      delivery_express_name: '快递配送'
    },
    is_show_guess_like: 1,
    showRefundModal: false
  },
  is_show_tip: '',
  timeOut: function() {
    console.log('计时完成')
  },
  options: '',
  canCancel: true,
  isFirst: 1,

  onLoad: function(options) {
    var that = this;
    that.options = options;
    
    var userInfo = wx.getStorageSync('userInfo');
    userInfo && (userInfo.shareNickName = userInfo.nickName.length > 3 ? userInfo.nickName.substr(0, 3) + "..." : userInfo.nickName);
    status.setGroupInfo().then((groupInfo) => {
      that.setData({
        groupInfo
      })
    });
    util.check_login() ? this.setData({
      needAuth: false
    }) : this.setData({
      needAuth: true
    });

    that.setData({
      userInfo
    });
    var token = wx.getStorageSync('token');
    wx.hideShareMenu();

    wx.showLoading();
    var is_show_tip = options && options.is_show || 0;
    let isfail = options && options.isfail || '';
    this.is_show_tip = is_show_tip;
    if (is_show_tip != undefined && is_show_tip == 1) {
      //todo 弹出分享 
    } else {
      wx.showLoading();
    }

    if (isfail != undefined && isfail == 1) {
      wx.showToast({
        title: '支付失败',
        icon: 'none'
      })
    }

    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'order.order_info',
        token,
        id: options.id
      },
      dataType: 'json',
      method: 'POST',
      success: function(res) {
        setTimeout(() => {
          wx.hideLoading();
        }, 1000);
        if(res.data.code==0){
          let order_info = res.data.data.order_info;
          if (is_show_tip != undefined && is_show_tip == 1 && order_info.type == 'integral') {
            wx.showToast({
              title: '兑换成功'
            })
          } else if (is_show_tip != undefined && is_show_tip == 1) {
            if (res.data.order_pay_after_share == 1) {
              let share_img = res.data.data.share_img;
              that.setData({
                share_img,
                isShowModal: true
              })
            } else {
              wx.showToast({
                title: '支付成功'
              })
            }
          }

          if (order_info.order_status_id == 3) {
            var seconds = (order_info.over_buy_time - order_info.cur_time) * 1000;
            if (seconds > 0) {
              count_down(that, seconds);
            } else {
              order_info.open_auto_delete == 1 && that.setData({
                changeState: 1
              })
            }
          }
          let { 
            pingtai_deal,
            order_refund,
            order_can_del_cancle,
            is_hidden_orderlist_phone,
            is_show_guess_like,
            user_service_switch,
            common_header_backgroundimage,
            order_can_shen_refund
          } = res.data;
          that.setData({
            order: res.data.data,
            pingtai_deal: pingtai_deal,
            order_refund: order_refund,
            order_can_del_cancle: order_can_del_cancle,
            loadover: true,
            is_show: 1,
            hide_lding: true,
            is_hidden_orderlist_phone: is_hidden_orderlist_phone || 0,
            is_show_guess_like: is_show_guess_like || 0,
            user_service_switch: user_service_switch || 1,
            common_header_backgroundimage,
            order_can_shen_refund
          })
          that.caclGoodsTot(res.data.data);
          that.hide_lding();
        } else if(res.data.code==2){
          that.setData({ needAuth: true })
        }
      }
    })

  },

  onShow: function(){
    console.log(this.isFirst, 'onShow', this.options.id);
    if (this.isFirst>1) this.reload_data();
    this.isFirst++;
  },

  onHide: function(){
    console.log('order Hide');
  },

  caclGoodsTot: function(order){
    if(order && order.order_goods_list) {
      let order_goods_list = order.order_goods_list;
      let goodsTot = 0;
      Object.keys(order_goods_list).forEach(k=>{
        if(order_goods_list[k].is_vipcard_buy==1 || order_goods_list[k].is_level_buy) {
          goodsTot += order_goods_list[k].total;
        } else {
          goodsTot += order_goods_list[k].real_total;
        }
      })
      this.setData({ goodsTot: goodsTot.toFixed(2) })
    }
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    this.onLoad(this.options);
  },

  reload_data: function() {
    console.log('reload_data--', this.options.id);
    var that = this;
    var token = wx.getStorageSync('token');
    let id = this.options.id || '';

    id && app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'order.order_info',
        token,
        id
      },
      dataType: 'json',
      method: 'POST',
      success: function(res) {
        let order_info = res.data.data.order_info;
        if (order_info.order_status_id == 3) {
          var seconds = (order_info.over_buy_time - order_info.cur_time) * 1000;
          if (seconds > 0) {
            count_down(that, seconds);
          } else {
            that.setData({
              changeState: 1
            })
          }
        }
        that.setData({
          order: res.data.data,
          pingtai_deal: res.data.pingtai_deal,
          order_refund: res.data.order_refund,
          loadover: true,
          is_show: 1,
          hide_lding: true
        })
      }
    })
  },
  
  receivOrder: function(event) {
    let id = event.currentTarget.dataset.type || '';
    var token = wx.getStorageSync('token');
    var that = this;
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认收到',
      confirmColor: '#F75451',
      success(res) {
        if (res.confirm) {
          app.util.request({
            'url': 'entry/wxapp/index',
            'data': {
              controller: 'order.receive_order',
              token: token,
              order_id: id
            },
            dataType: 'json',
            success: function(res) {
              if (res.data.code == 0) {
                wx.showToast({
                  title: '收货成功',
                  icon: 'success',
                  duration: 1000
                })
                that.reload_data();
              }
            }
          })
        }
      }
    })
  },

  cancelSubmit: function(e) {
    var that = this;
    var from_id = e.detail.formId;
    var token = wx.getStorageSync('token');
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.get_member_form_id',
        token,
        from_id
      },
      dataType: 'json',
      success: function(res) {}
    })
  },

  payNowSubmit: function(e) {
    var that = this;
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

  callDialog: function(e) {
    var order_id = e.currentTarget.dataset.type || '';
    var token = wx.getStorageSync('token');
    wx.showModal({
      title: '取消支付',
      content: '好不容易挑出来，确定要取消吗？',
      confirmColor: '#F75451',
      success(res) {
        if (res.confirm) {
          app.util.request({
            'url': 'entry/wxapp/index',
            'data': {
              controller: 'order.cancel_order',
              token: token,
              order_id: order_id
            },
            dataType: 'json',
            success: function(res) {
              wx.showToast({
                title: '取消成功',
                icon: 'success',
                complete: function() {
                  wx.redirectTo({
                    url: '/community/pages/order/index'
                  })
                }
              })
            }
          })
        }
      }
    })
  },

  applyForService: function(e) {
    var order_id = e.currentTarget.dataset.type || '';
    var order_goods_id = e.currentTarget.dataset.order_goods_id;

    order_id && wx.redirectTo({
      url: '/community/pages/order/refund?id=' + order_id + '&order_goods_id=' + order_goods_id
    })

  },

  payNow: function(e) {
    var order_id = e.currentTarget.dataset.type || '';
    var that = this;
    var token = wx.getStorageSync('token');

    order_id && app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'car.wxpay',
        token,
        order_id
      },
      dataType: 'json',
      method: 'POST',
      success: function(res) {
        if (res.data.code == 0) {
          wx.requestPayment({
            "appId": res.data.appId,
            "timeStamp": res.data.timeStamp,
            "nonceStr": res.data.nonceStr,
            "package": res.data.package,
            "signType": res.data.signType,
            "paySign": res.data.paySign,
            'success': function(wxres) {
              wx.redirectTo({
                url: '/community/pages/order/order?id=' + order_id + '&is_show=1'
              })
            },
            'fail': function(res) {
              console.log(res);
            }
          })
        } else if (res.data.code == 2) {
          wx.showToast({
            title: res.data.msg,
            icon: 'none'
          })
        }
      }
    })
  },

  hide_lding: function() {
    wx.hideLoading();
    this.setData({
      is_show: true
    })
  },

  call_mobile: function(event) {
    let mobile = event.currentTarget.dataset.mobile;
    wx.makePhoneCall({
      phoneNumber: mobile
    })
  },

  goComment: function(event) {
    let id = event.currentTarget.dataset.type;
    let order_goods_id = event.currentTarget.dataset.order_goods_id;
    var goods_id = event.currentTarget.dataset.goods_id;

    var pages_all = getCurrentPages();
    if (pages_all.length > 3) {
      wx.redirectTo({
        url: '/community/pages/order/evaluate?id=' + id + '&goods_id=' + goods_id + '&order_goods_id=' + order_goods_id
      })
    } else {
      wx.navigateTo({
        url: '/community/pages/order/evaluate?id=' + id + '&goods_id=' + goods_id + '&order_goods_id=' + order_goods_id
      })
    }

  },

  gokefu: function(event) {
    let id = event.currentTarget.dataset.s_id;
    var pages_all = getCurrentPages();
    if (pages_all.length > 3) {
      wx.redirectTo({
        url: '/pages/im/index?id=' + id
      })
    } else {
      wx.navigateTo({
        url: '/pages/im/index?id=' + id
      })
    }


  },

  goRefund: function(event) {
    let id = event.currentTarget.dataset.id || 0;
    if(id) {
      var pages_all = getCurrentPages();
      if (pages_all.length > 3) {
        wx.redirectTo({
          url: `/community/pages/order/refunddetail?id=${id}`
        })
      } else {
        wx.navigateTo({
          url: `/community/pages/order/refunddetail?id=${id}`
        })
      }
    }
  },

  closeModal: function(event) {
    let h = {};
    let type = event.currentTarget.dataset.type || 0;
    if(type==1) {
      h.showRefundModal = false;
    } else {
      h.isShowModal = false;
    }
    this.setData(h)
  },

  //取消订单
  cancelOrder: function(e){
    let that = this;
    this.canCancel && wx.showModal({
      title: '取消订单并退款',
      content: '取消订单后，款项将原路退回到您的支付账户；详情请查看退款进度。',
      confirmText: '取消订单',
      confirmColor: '#ff5344',
      cancelText: '再等等',
      cancelColor: '#666666',
      success(res) {
        if (res.confirm) {
          that.canCancel = false;
          let order_id = e.currentTarget.dataset.type;
          let token = wx.getStorageSync('token');
          app.util.request({
            'url': 'entry/wxapp/index',
            'data': {
              controller: 'order.del_cancle_order',
              token,
              order_id
            },
            dataType: 'json',
            method: 'POST',
            success: function (res) {
              if(res.data.code==0){
                //提交成功
                wx.showModal({
                  title: '提示',
                  content: '取消订单成功',
                  showCancel: false,
                  confirmColor: '#ff5344',
                  success(ret) {
                    if(ret.confirm) {
                      wx.redirectTo({
                        url: '/community/pages/order/index'
                      })
                    }
                  }
                })
              } else {
                that.canCancel = true;
                wx.showToast({
                  title: res.data.msg || '取消订单失败',
                  icon: 'none'
                })
              }
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

  /**
   * 弹窗显示退款信息
   * @param {*} res 
   */
  showRefundInfo: function(e) {
    let idx = e.currentTarget.dataset.idx;
    let hasrefund = e.currentTarget.dataset.hasrefund;
    if(hasrefund>0) {
      let order = this.data.order;
      let refundGoodsInfo = order.order_goods_list[idx];
      this.setData({
        showRefundModal: true,
        refundGoodsInfo
      })
    }
  },

  onShareAppMessage: function(res) {
    var order_id = this.data.order.order_info.order_id || '';
    let goods_share_image = this.data.order.order_goods_list[0].goods_share_image;
    let share_img = this.data.share_img;
    if (order_id && this.is_show_tip == 1) {
      return {
        title: `@${this.data.order.order_info.ziti_name}${this.data.groupInfo.owner_name}，我是${this.data.userInfo.shareNickName}，刚在你这里下单啦！！！`,
        path: "community/pages/order/shareOrderInfo?order_id=" + order_id,
        imageUrl: share_img ? share_img : goods_share_image
      };
    }
  }
})