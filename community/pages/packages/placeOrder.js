var app = getApp()
var locat = require('../../utils/Location.js');
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var wcache = require('../../utils/wcache.js');

Page({
  mixins: [require('../../mixin/globalMixin.js')],
  data: {
    agent:0,
    name:'',
    mobile:'',
    payBtnLoading: false,
    showConfirmModal: false,
    receiverAddress: "", //快递送货地址
    tuan_send_address: "", //团长送货地址
    showGetPhone: false,
    lou_meng_hao: '',
    pickUpAddress: "",
    disUserName: "",
    pickUpCommunityName: "",
    is_limit_distance_buy: 0,
    tabList: [{
      id: 0,
      name: '到点自提',
      dispatching: 'pickup',
      enabled: false
    }],
    originTabList: [{
      id: 0,
      name: '到点自提',
      dispatching: 'pickup'
    }],
    tabIdx: 0,
    region: ['选择地址', '', ''],
    tot_price: 0,
    needAuth: false,
    reduce_money: 0,
    hide_quan: true,
    tuan_region: ['选择地址', '', ''],
    groupInfo: {
      group_name: '社区',
      owner_name: '团长',
      placeorder_tuan_name: '配送费',
      placeorder_trans_name: '快递费'
    },
    comment: '',
    is_yue_open: 0,
    can_yupay: 0,
    ck_yupay: 0,
    use_score: 0,
    commentArr: {}
  },
  canPay: true,
  canPreSub: true,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id;
    var that = this;
    status.setGroupInfo().then((groupInfo) => {
      that.setData({
        groupInfo
      })
    });
    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');
    var community_id = community.communityId;
    util.check_login() ? this.setData({
      needAuth: false
    }) : (this.setData({
      needAuth: true
    }));
    // let is_limit = options.is_limit || 0;
    this.setData({
      buy_type: options.type || '',
      soli_id: options.soli_id || '',
      pickUpAddress: community.fullAddress || '',
      pickUpCommunityName: community.communityName || '',
      disUserName: community.disUserName || ''
    })
    wx.showLoading()
    app.util.request({
      'url': 'entry/wxapp/index',
      'data': {
        controller: 'index.load_package_goodsdetail',
        token: token,
        id: id
      },
      dataType: 'json',
      method: 'POST',
      success: function (res) {
        console.log(res);
        // wx.hideLoading();
        wx.hideLoading();

        if (res.data.code == 0) {
          that.setData({
            goods: res.data.list,
            coin: res.data.coin
          })
        }

      }
    })
  },

  changeDistance: function (current_distance) {
    if (current_distance) {
      current_distance = parseFloat(current_distance);
      if (current_distance > 1000) {
        let current_distance_int = current_distance / 1000;
        return current_distance_int.toFixed(2) + 'km';
      }
      return current_distance + 'm';
    }
    return current_distance;
  },

  /**
   * 授权成功回调
   */
  authSuccess: function () {
    this.onLoad();
  },

  /**
   * 设置手机号
   */
  getReceiveMobile: function (e) {
    var num = e.detail;
    this.setData({
      t_ziti_mobile: num,
      showGetPhone: false
    });
  },

  ck_wxpays: function () {
    this.setData({
      ck_yupay: 0
    })
  },

  ck_yupays: function () {
    this.setData({
      ck_yupay: 1
    })
  },

  scoreChange: function (e) {
    console.log('是否使用', e.detail.value)
    let tdata = this.data;
    let score_for_money = tdata.score_for_money * 1;
    let tot_price = tdata.tot_price * 1;
    let disAmount = tdata.disAmount * 1;
    if (e.detail.value) {
      tot_price = tot_price - score_for_money;
      disAmount += score_for_money;
    } else {
      tot_price = tot_price + score_for_money;
      disAmount -= score_for_money;
    }
    this.setData({
      use_score: e.detail.value ? 1 : 0,
      tot_price: tot_price.toFixed(2),
      disAmount: disAmount.toFixed(2)
    })
  },

  /**
   * 未登录
   */
  needAuth: function () {
    this.setData({
      needAuth: true
    });
  },

  /**
   * 关闭手机授权
   */
  close: function () {
    this.setData({
      showGetPhone: false
    });
  },

  goOrderfrom: function () {
    let {
      tabAddress,
      tabIdx
    } = this.data;

    var t_ziti_name = tabAddress[tabIdx].name;
    var t_ziti_mobile = tabAddress[tabIdx].mobile;
    var receiverAddress = tabAddress[tabIdx].receiverAddress;
    var region = tabAddress[tabIdx].region;
    var tuan_send_address = tabAddress[tabIdx].receiverAddress;
    var lou_meng_hao = tabAddress[tabIdx].lou_meng_hao;

    if (t_ziti_name == '') {
      this.setData({
        focus_name: true
      })
      let tip = '请填写收货人';
      if (tabIdx == 0) tip = '请填写提货人';
      wx.showToast({
        title: tip,
        icon: 'none'
      })
      return false;
    }
    if (t_ziti_mobile == '' || !(/^1(3|4|5|6|7|8|9)\d{9}$/.test(t_ziti_mobile))) {
      this.setData({
        focus_mobile: true
      })
      wx.showToast({
        title: '手机号码有误',
        icon: 'none'
      })
      return false;
    }

    if (tabIdx == 2 && region[0] == '选择地址') {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      })
      return false;
    }

    if (tabIdx == 2 && receiverAddress == '') {
      this.setData({
        focus_addr: true
      })
      wx.showToast({
        title: '请填写详细地址',
        icon: 'none'
      })
      return false;
    }

    if (tabIdx == 1) {
      if (tuan_send_address == '选择位置' || tuan_send_address == '') {
        wx.showToast({
          title: '请选择位置',
          icon: 'none'
        })
        return false;
      }

      if (lou_meng_hao == '') {
        wx.showToast({
          title: '输入楼号门牌',
          icon: 'none'
        })
        return false;
      }

    }

    if (tabIdx == 2) {
      this.preSubscript();
    } else {
      this.conformOrder();
    }
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

  prepay: function (e) {
    this.canPreSub = true;
    console.log('=============')

    if (this.canPay) {
      
     // this.canPay = false;
      var that = this;
      let tdata = this.data;
      var token = wx.getStorageSync('token');

      var goods_id = this.data.goods.id;
      var mobile = this.data.mobile;
      var name = this.data.name;

      const check = this.checkPhone(mobile);
      if (name == '') {
        wx.showToast({
          title: '请填写姓名',
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
      
      wx.showLoading();
      app.util.request({
        url: 'entry/wxapp/user',
        data: {
          controller: 'car.package_order',
          token: token,
          goods_id:goods_id,
          name: name,
          mobile: mobile,
          agent:that.data.agent
        },
        dataType: 'json',
        method: 'POST',
        success: function (res) {
          wx.hideLoading();
          var order_id = res.data.order_id;
          let h = {};
          console.log('支付日志：', res);
          if (res.data.code == 0) {
            wx.requestPayment({
              "appId": res.data.appId,
              "timeStamp": res.data.timeStamp,
              "nonceStr": res.data.nonceStr,
              "package": res.data.package,
              "signType": res.data.signType,
              "paySign": res.data.paySign,
              'success': function (wxres) {
                that.canPay = true;
                wx.redirectTo({
                  url: '/community/pages/packages/my'
                })
              },
              'fail': function (error) {
                wx.redirectTo({
                  url: '/community/pages/packages/index'
                })
              }
            })
          } else if (res.data.code == 1) {
            that.canPay = true;
            wx.showModal({
              title: '提示',
              content: res.data.msg || '支付失败',
              showCancel: false,
              confirmColor: '#13bb4e',
              success(ret) {
                if (ret.confirm) {
                  if (res.data.is_go_orderlist <= 1) {
                    wx.redirectTo({
                      url: '/community/pages/packages/index'
                    })
                  } else {
                    wx.redirectTo({
                      url: '/community/pages/packages/index'
                    })
                  }
                }
              }
            })
          } else if (res.data.code == 2) {
            that.canPay = true;
            if (res.data.is_forb == 1) {
              h.btnDisable = true;
              h.btnText = "已抢光";
            }
            wx.showToast({
              title: res.data.msg,
              icon: "none"
            });
          } else {
            console.log(res);
          }
          that.setData({
            btnLoading: false,
            payBtnLoading: false,
            ...h
          })
        },
        fail: function () {
          wx.redirectTo({
            url: '/community/pages/order/index?is_show=1&?isfail=1'
          })
        }
      })
    }
  },

  /**
   * 监听收货人
   */
  changeReceiverName: function (e) {
    let receiverName = e.detail.value.trim();
    this.setData({
      'name': receiverName
    });
  },
  bindAgentId:function(e){
    let agent = e.detail.value.trim();
    this.setData({
      'agent': agent
    });
  },
  /**
   * 监听手机号
   */
  bindReceiverMobile: function (e) {
    let mobile = e.detail.value.trim();
    this.setData({
      'mobile': mobile
    });
  },

  /**
   * 监控快递地址变化
   */
  changeReceiverAddress: function (e) {
    let {
      tabAddress,
      tabIdx
    } = this.data;
    tabAddress[tabIdx].receiverAddress = e.detail.value.trim();
    this.setData({
      tabAddress
    });
    return {
      value: e.detail.value.trim()
    }
  },

  /**
   * 监控团长送货地址变化
   */
  changeTuanAddress: function (e) {
    let {
      tabAddress,
      tabIdx
    } = this.data;
    tabAddress[tabIdx].lou_meng_hao = e.detail.value.trim();
    this.setData({
      tabAddress
    });
    return {
      value: e.detail.value.trim()
    }
  },

  /**
   * 结算
   */
  conformOrder: function () {
    this.setData({
      showConfirmModal: true
    });
  },

  /**
   * 关闭结算
   */
  closeConfirmModal: function () {
    this.canPay = true;
    this.setData({
      showConfirmModal: false
    });
  },

  /**
   * 地区选择
   */
  bindRegionChange: function (e) {
    let region = e.detail.value;
    region && this.checkOut(region[1]);
    this.setData({
      region
    })
  },

  checkOut: function (mb_city_name) {
    var that = this;
    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');
    var community_id = community.communityId;
    let latitude = wx.getStorageSync('latitude2');
    let longitude = wx.getStorageSync('longitude2');
    let buy_type = this.data.buy_type;
    let soli_id = this.data.soli_id;

    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'car.checkout',
        token,
        community_id,
        mb_city_name,
        latitude: latitude,
        longitude: longitude,
        buy_type,
        soli_id
      },
      dataType: 'json',
      method: 'POST',
      success: function (res) {
        if (res.data.code == 1) {
          let rdata = res.data;
          let {
            vipcard_save_money,
            shop_buy_distance,
            is_limit_distance_buy,
            current_distance,
            level_save_money,
            score,
            score_for_money,
            bue_use_score
          } = rdata;
          if (that.data.tabIdx == 1 && is_limit_distance_buy == 1 && (current_distance > shop_buy_distance)) {
            wx.showModal({
              title: '提示',
              content: '超出配送范围，请重新选择',
              showCancel: false,
              confirmColor: '#13bb4e'
            })
          }

          current_distance = current_distance || '';
          let current_distance_str = that.changeDistance(current_distance);

          that.setData({
            score: score || 0,
            score_for_money: score_for_money || 0,
            bue_use_score: bue_use_score || 0,
            vipcard_save_money,
            level_save_money,
            is_limit_distance_buy: is_limit_distance_buy || 0,
            current_distance,
            current_distance_str,
            trans_free_toal: rdata.trans_free_toal,
            is_man_delivery_tuanz_fare: rdata.is_man_delivery_tuanz_fare, //是否达到满xx减团长配送费
            fare_man_delivery_tuanz_fare_money: rdata.fare_man_delivery_tuanz_fare_money, //达到满xx减团长配送费， 减了多少钱
            is_man_shipping_fare: rdata.is_man_shipping_fare, //是否达到满xx减运费
            fare_man_shipping_fare_money: rdata.fare_man_shipping_fare_money //达到满xx减运费，司机减了多少运费
          }, () => {
            that.calcPrice()
          })
        }
      }
    })
  },

  /**
   * 定位获取地址
   */
  choseLocation: function () {
    let {
      tabAddress,
      tabIdx
    } = this.data;
    var that = this;
    wx.chooseLocation({
      success: function (e) {
        console.log(e);
        var s_region = that.data.region;
        var filename = e.name;
        let addr = e.address || '';
        var reg = /.+?(省|市|自治区|自治州|县|区|特别行政区)/g;
        // var result = addr.match(reg);
        var result = null;
        console.log('patt', result);
        if (result == null || filename == "") {
          locat.getGpsLocation(e.latitude, e.longitude).then((res) => {
            console.log('反推了', res);
            if (res) {
              s_region[0] = res.province;
              s_region[1] = res.city;
              s_region[2] = res.district;
              filename || (filename = res.street);
            }
            setRes();
          });
        } else {
          s_region[0] = result[0];
          s_region[1] = result[1];
          s_region[2] = result[2] || '';
          var dol_path = addr.replace(s_region.join(''), '');
          filename = dol_path + e.name;
          setRes();
        }

        wcache.put('latitude2', e.latitude);
        wcache.put('longitude2', e.longitude);

        function setRes() {
          console.log('setData');
          s_region && (s_region[1] != "市") && that.checkOut(s_region[1]);
          tabAddress[tabIdx].region = s_region;
          tabAddress[tabIdx].receiverAddress = filename;
          that.setData({
            tabAddress
          })
        }
      },
      fail: function (error) {
        console.log(error)
        if (error.errMsg == 'chooseLocation:fail auth deny') {
          console.log('无权限')
          locat.checkGPS(app, locat.openSetting())
        }
      }
    })
  },

  /**
   * 微信获取地址
   */
  getWxAddress: function () {
    let {
      tabAddress,
      tabIdx
    } = this.data;
    let region = tabAddress[tabIdx].region || [];
    let that = this;
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.address']) {
          wx.chooseAddress({
            success(res) {
              console.log("step1")
              region[0] = res.provinceName || "选择地址";
              region[1] = res.cityName || "";
              region[2] = res.countyName || "";
              let receiverAddress = res.detailInfo;
              tabAddress[tabIdx].name = res.userName;
              tabAddress[tabIdx].mobile = res.telNumber;
              tabAddress[tabIdx].region = region;
              tabAddress[tabIdx].receiverAddress = receiverAddress;
              that.setData({
                tabAddress
              })
              region && (region[1] != "市") && that.checkOut(region[1]);
            },
            fail(res) {
              console.log("step4")
              console.log(res)
            }
          })
        } else {
          if (res.authSetting['scope.address'] == false) {
            wx.openSetting({
              success(res) {
                console.log(res.authSetting)
              }
            })
          } else {
            console.log("step2")
            wx.chooseAddress({
              success(res) {
                console.log("step3")
                region[0] = res.provinceName || "选择地址";
                region[1] = res.cityName || "";
                region[2] = res.countyName || "";
                let receiverAddress = res.detailInfo;
                region && (region[1] != "市") && that.checkOut(region[1]);
                tabAddress[tabIdx].name = res.userName;
                tabAddress[tabIdx].mobile = res.telNumber;
                tabAddress[tabIdx].region = region;
                tabAddress[tabIdx].receiverAddress = receiverAddress;
                that.setData({
                  tabAddress
                })
              }
            })
          }
        }
      }
    })
  },

  /**
   * tab切换
   */
  tabSwitch: function (t) {
    let idx = 1 * t.currentTarget.dataset.idx;
    (idx != 0) && wx.showToast({
      title: '配送变更，费用已变化',
      icon: "none"
    });
    this.setData({
      tabIdx: idx
    }, function () {
      this.calcPrice(1);
    })
  },

  /**
   * 打开优惠券
   */
  show_voucher: function (event) {
    var that = this;
    var serller_id = event.currentTarget.dataset.seller_id;
    var voucher_list = [];
    var seller_chose_id = this.data.seller_chose_id;
    var seller_chose_store_id = this.data.seller_chose_store_id;
    var seller_goods = this.data.seller_goodss;
    for (var i in seller_goods) {
      var s_id = seller_goods[i].store_info.s_id;
      if (s_id == serller_id) {
        voucher_list = seller_goods[i].voucher_list;
        if (seller_chose_id == 0) {
          seller_chose_id = seller_goods[i].chose_vouche.id || 0;
          seller_chose_store_id = seller_goods[i].chose_vouche.store_id || 0;
        }
      }
    }
    that.setData({
      ssvoucher_list: voucher_list,
      voucher_serller_id: serller_id,
      seller_chose_id: seller_chose_id,
      seller_chose_store_id: seller_chose_store_id,
      hide_quan: false
    })
  },

  // 选择优惠券
  chose_voucher_id: function (event) {
    wx.showLoading();
    var voucher_id = event.currentTarget.dataset.voucher_id;
    var seller_id = event.currentTarget.dataset.seller_id;
    var that = this;
    var token = wx.getStorageSync('token');
    var use_quan_str = seller_id + "_" + voucher_id;
    let latitude = wx.getStorageSync('latitude2');
    let longitude = wx.getStorageSync('longitude2');
    var buy_type = that.data.buy_type;
    let soli_id = this.data.soli_id;

    var community_id = wx.getStorageSync('community').communityId || '';

    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'car.checkout',
        token,
        community_id,
        voucher_id,
        use_quan_str,
        buy_type,
        latitude,
        longitude,
        soli_id
      },
      dataType: 'json',
      method: 'POST',
      success: function (res) {
        wx.hideLoading();
        if (res.data.code == 1) {
          let seller_goodss = res.data.seller_goodss;
          let sel_chose_vouche = '';
          for (var i in seller_goodss) {
            seller_goodss[i].goodsnum = Object.keys(seller_goodss[i].goods).length;
            if (Object.prototype.toString.call(seller_goodss[i].chose_vouche) == '[object Object]') {
              sel_chose_vouche = seller_goodss[i].chose_vouche;
            }
          }
          const rdata = res.data;
          let current_distance = rdata.current_distance || '';
          let current_distance_str = that.changeDistance(current_distance);
          let {
            score,
            score_for_money,
            bue_use_score
          } = rdata;
          let h = {};
          if (bue_use_score * 1 <= 0) h.use_score = '';
          that.setData({
            ...h,
            score: score || 0,
            score_for_money: score_for_money || 0,
            bue_use_score: bue_use_score || 0,
            seller_goodss: seller_goodss,
            seller_chose_id: voucher_id,
            seller_chose_store_id: seller_id,
            hide_quan: true,
            goods: rdata.goods,
            buy_type: rdata.buy_type || 'dan',
            yupay: rdata.can_yupay,
            is_yue_open: rdata.is_yue_open,
            total_free: rdata.total_free,
            sel_chose_vouche: sel_chose_vouche,
            current_distance,
            current_distance_str
          }, () => {
            that.calcPrice(1);
          })
        }
      }
    })
  },

  //关闭优惠券
  closeCouponModal: function () {
    this.setData({
      hide_quan: true
    })
  },

  /**
   * 计算总额
   */
  calcPrice: function (isTabSwitch = 0) {
    let tdata = this.data;
    let {
      total_free,
      delivery_tuanz_money,
      fare_man_shipping_fare_money,
      trans_free_toal,
      tabIdx,
      goods,
      is_open_vipcard_buy,
      is_member_level_buy,
      is_vip_card_member,
      canLevelBuy,
      fare_man_delivery_tuanz_fare_money
    } = tdata;
    total_free *= 1; //合计金额（扣除满减、优惠券，不含运费）
    delivery_tuanz_money *= 1; //配送费
    fare_man_shipping_fare_money *= 1; //免多少运费
    trans_free_toal = trans_free_toal * 1;

    let tot_price = 0; //计算后合计+运费
    // 商品总额
    let total_goods_price = 0;
    let levelAmount = 0; //等级优惠

    for (let gidx of Object.keys(goods)) {
      let item = goods[gidx];
      // if(is_open_vipcard_buy==1&&item.is_take_vipcard==1&&is_vip_card_member==1) {
      //   total_goods_price += item.card_price*1;
      // } else if(canLevelBuy&&item.is_mb_level_buy) {
      //   total_goods_price += item.levelprice*1;
      // } else {
      total_goods_price += item.total;
      // }
      if (canLevelBuy && item.is_mb_level_buy) {
        levelAmount += item.total * 1 - item.level_total * 1;
      }
    }

    let total_all = total_goods_price; //总额
    // 商品总额+配送费
    if (tabIdx == 0) {
      tot_price = total_free;
    } else if (tabIdx == 1) {
      // 满免运费
      let is_man_delivery_tuanz_fare = tdata.is_man_delivery_tuanz_fare; //是否达到满xx减团长配送费

      if (is_man_delivery_tuanz_fare == 0) {
        tot_price = delivery_tuanz_money + total_free;
      } else {
        tot_price = total_free + delivery_tuanz_money - fare_man_delivery_tuanz_fare_money * 1;
      }
      total_all += delivery_tuanz_money;
    } else if (tabIdx == 2) {
      // 满免快递费
      let is_man_shipping_fare = tdata.is_man_shipping_fare; //是否达到满xx减运费

      total_all += trans_free_toal;
      if (is_man_shipping_fare == 0) {
        tot_price = trans_free_toal + total_free;
      } else {
        tot_price = trans_free_toal + total_free - fare_man_shipping_fare_money * 1;
      }
    }

    //使用积分
    let use_score = tdata.use_score;
    if (isTabSwitch && use_score) {
      let score_for_money = tdata.score_for_money * 1;
      tot_price = tot_price - score_for_money;
    }

    let disAmount = 0; //优惠金额
    disAmount = (total_all - tot_price * 1).toFixed(2);

    this.setData({
      total_all: total_all.toFixed(2),
      disAmount,
      tot_price: tot_price.toFixed(2),
      total_goods_price: total_goods_price.toFixed(2),
      levelAmount: levelAmount.toFixed(2)
    })

  },

  /**
   * 订单留言 20190219
   */
  bindInputMessage: function (event) {
    let commentArr = this.data.commentArr;
    let idx = event.currentTarget.dataset.idx;
    var val = event.detail.value;
    commentArr[idx] = val;
    this.setData({
      commentArr
    })
  },

  /**
   * 修改首页列表商品购物车数量
   */
  changeIndexList: function () {
    let goods = this.data.goods || [];
    if (goods.length > 0) {
      goods.forEach((item) => {
        item.option.length == 0 && status.indexListCarCount(item.goods_id, 0);
      })
    }
  },

  /**
   * 订阅消息
   */
  subscriptionNotice: function () {
    console.log('subscriptionNotice')
    let that = this;
    return new Promise((resolve, reject) => {
      let obj = that.data.need_subscript_template;
      let tmplIds = Object.keys(obj).map(key => obj[key]); // 订阅消息模版id
      if (wx.requestSubscribeMessage) {
        tmplIds.length && wx.requestSubscribeMessage({
          tmplIds: tmplIds,
          success(res) {
            let is_need_subscript = 1;
            let acceptId = [];
            Object.keys(obj).forEach(item => {
              if (res[obj[item]] == 'accept') {
                //用户同意了订阅，添加进数据库
                acceptId.push(item);
              } else {
                //用户拒绝了订阅或当前游戏被禁用订阅消息
                is_need_subscript = 0;
              }
            })

            if (acceptId.length) {
              that.addAccept(acceptId);
            }
            that.setData({
              is_need_subscript
            })
            resolve();
          },
          fail() {
            reject();
          }
        })
      } else {
        // 兼容处理
        reject();
      }
    })
  },

  // 用户点击订阅添加到数据库
  addAccept: function (acceptId) {
    let token = wx.getStorageSync('token');
    let type = acceptId.join(',');
    app.util.request({
      url: 'entry/wxapp/user',
      data: {
        controller: 'user.collect_subscriptmsg',
        token,
        type
      },
      dataType: 'json',
      method: 'POST',
      success: function () {}
    })
  }
})