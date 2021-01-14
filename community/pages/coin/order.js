var app = getApp()
var locat = require('../../utils/Location.js');
var util = require('../../utils/util.js');
var status = require('../../utils/index.js');
var wcache = require('../../utils/wcache.js');

Page({
  mixins: [require('../../mixin/globalMixin.js')],
  data: {
    remake:'',
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
    tabList: [
      //20201111屏蔽，只保留快递配送方式，与商城其他地方保持一致
      // { id: 0, name: '到店自提', dispatching: 'pickup', enabled: true },
      // { id: 1, name: '免费配送', dispatching: 'tuanz_send', enabled: true },
      { id: 2, name: '快递配送', dispatching: 'express', enabled: true }
    ],
    originTabList: [
      //20201111屏蔽，只保留快递配送方式，与商城其他地方保持一致
      // { id: 0, name: '到店自提', dispatching: 'pickup' },
      // { id: 1, name: '免费配送', dispatching: 'tuanz_send'},
      { id: 2, name: '快递配送', dispatching: 'express'}
    ],
    
    tabIdx: 2,
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
     this.setData({'order_id':id});
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
        controller: 'index.load_package_coindetail',
        token: token,
        id: id
      },
      dataType: 'json',
      method: 'POST',
      success: function (res) {
        console.log(res);
          // 提货方式
          let tabIdx = 2;
          let tabLength = 0;
          let sortTabList = [];
        // wx.hideLoading();
        setTimeout(function () {
          wx.hideLoading();
        }, 1000);
        if (res.data.code == 0) {
          var address = res.data.address;
          var tabAddress = [
          { 
            name: address.ziti_name || '', 
            mobile: address.ziti_mobile || ''
          },
          { 
            name: address.ziti_name || '', 
            mobile: address.ziti_mobile || '', 
            receiverAddress: address.address.address, 
            lou_meng_hao: address.lou_meng_hao || '',
            region: [address.address.province_name || "", address.address.city_name || "", address.address.country_name || ""]
          },
          {
            name: address.ziti_name || '', 
            mobile: address.ziti_mobile || '', 
            receiverAddress: address.address.address || '', 
            region: [address.address.province_name || "", address.address.city_name || "", address.address.country_name || ""] 
          }]
          that.setData({
            coin: res.data.coin,tabIdx:tabIdx,tabLength:tabLength,tabAddress
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
      let { tabAddress, tabIdx } = this.data;     
      var address_type = this.data.tabList[0].name;     
      var t_ziti_name = tabAddress[tabIdx].name;
      var t_ziti_mobile = tabAddress[tabIdx].mobile;
      var receiverAddress = tabAddress[tabIdx].receiverAddress;
      var region = tabAddress[tabIdx].region;
      var tuan_send_address = tabAddress[tabIdx].receiverAddress;
      var lou_meng_hao = tabAddress[tabIdx].lou_meng_hao;
     
     // this.canPay = false;
      var token = wx.getStorageSync('token');

      var order_id = this.data.order_id;
      var remake = this.data.remake;
      
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
  
      if (tabIdx == 2 && receiverAddress == ''){
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
  
        if (lou_meng_hao == ''){
          wx.showToast({
            title: '输入楼号门牌',
            icon: 'none'
          })
          return false;
        }
        
      }

      let tuan_send_address = '';
      let tuan_region = '';
      let address_name = '';
      let province_name = '';
      let city_name = '';
      let country_name = '';
      let lou_men_hao  = '';
      if (tabIdx==1){
        tuan_send_address = receiverAddress;
        tuan_region = region;
        province_name = tuan_region[0];
        city_name = tuan_region[1];
        country_name = tuan_region[2];
        lou_men_hao = lou_meng_hao;
      } else if (tabIdx == 2) {
        address_name = receiverAddress;
        province_name = region[0];
        city_name = region[1];
        country_name = region[2];
      }

      var community = wx.getStorageSync('community');
      var community_id = community.communityId;

      let latitude = wx.getStorageSync('latitude2');
      let longitude = wx.getStorageSync('longitude2');
      var disUserName =this.data.disUserName;
      var pickUpAddress =  this.data.pickUpAddress;
      

      wx.showLoading();
      app.util.request({
        url: 'entry/wxapp/user',
        data: {
          controller: 'car.coin_order',
          token: token,
          order_id:order_id,
          remake:remake,
          disUserName,
          pickUpAddress,
          community_id,
          ziti_name: t_ziti_name,
          ziti_mobile: t_ziti_mobile,
          latitude,
          longitude,
          address_type,
          tuan_send_address,
          lou_men_hao,
          address_name,
          province_name,
          city_name,
          country_name,
        },
        dataType: 'json',
        method: 'POST',
        success: function (res) {
          wx.hideLoading();
          if(res.data.code == 0){
            
            wx.showModal({
              title: '提示',
              content: '兑换成功,商家备货中',
              showCancel: false,
              confirmColor: '#13bb4e',
              success(ret) {
                wx.switchTab({
                  url: '/community/pages/user/me',
                })
              }
            })

          }else{
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: function () {
          wx.showModal({
            title: '提示',
            content: '兑换失败,请稍后再试',
            showCancel: false,
            confirmColor: '#13bb4e',
            success(ret) {
              wx.switchTab({
                url: '/community/pages/user/me',
              })
            }
          })
        }
      })
    }
  },

  /**
   * 监听收货人
   */
  changeReceiverName: function(e) {
    let { tabAddress, tabIdx } = this.data;
    let receiverName = e.detail.value.trim();
    Object.keys(tabAddress).length && (tabAddress[tabIdx].name = receiverName);
    if (!receiverName) {
      let tip = '请填写收货人';
      if (tabIdx == 0) tip = '请填写提货人';
      wx.showToast({
        title: tip,
        icon: "none"
      });
    }
    this.setData({ tabAddress })
    return {
      value: receiverName
    }
  },

  /**
   * 监听手机号
   */
  bindReceiverMobile: function(e) {
    let { tabAddress, tabIdx } = this.data;
    let mobile = e.detail.value.trim();
    tabAddress[tabIdx].mobile = mobile;
    this.setData({ tabAddress });
    return {
      value: mobile
    }
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
    //20201106启动屏蔽
    // (idx != 0) && wx.showToast({
    //   title: '配送变更',
    //   icon: "none"
    // });
    this.setData({
      tabIdx: idx
    }, function () {
    })
  },
  /**
   * 订单留言 20190219
   */
  bindInputMessage: function (event) {
    var val = event.detail.value;
    this.setData({
      remake:val
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