var app = getApp();
var util = require('../../utils/util.js');
var a = require("../../utils/public");
var status = require('../../utils/index.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    cartNum: 0,
    showEmpty: false,
    showLoadMore: true,
    rushList: [],
    needAuth: false
  },
  pageNum: 1,
  keyword: '',
  type: 0,
  good_ids: '',
  gid: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showLoading();
    this.keyword = options.keyword || '';
    this.type = options.type || 0;
    this.good_ids = options.good_ids || '';
    this.gid = options.gid || 0;
    this.getData();
  },

  onShow: function() {
    const that = this;
    util.check_login_new().then((res) => {
      let needAuth = !res;
      that.setData({ needAuth })
      if(res) {
        (0, status.cartNum)('', true).then((res) => {
          res.code == 0 && that.setData({
            cartNum: res.data
          })
        });
      }
    })
  },

  vipModal: function(t) {
    this.setData(t.detail)
  },

  // 获取数据
  getData: function() {
    if (!this.hasRefeshin) {
      this.hasRefeshin = true;
      let that = this;
      that.setData({
        showLoadMore: true,
        loadMore: true,
        loadText: '加载中'
      });
      let token = wx.getStorageSync('token');
      let cur_community = wx.getStorageSync('community');
      let keyword = this.keyword;
      let type = this.type;
      let good_ids = this.good_ids;
      let gid = this.gid;
      app.util.request({
        'url': 'entry/wxapp/index',
        'data': {
          controller: 'index.load_condition_goodslist',
          token: token,
          pageNum: that.pageNum,
          head_id: cur_community.communityId,
          keyword,
          type,
          good_ids,
          gid
        },
        dataType: 'json',
        success: function(res) {
          if (res.data.code == 0) {
            let rushList = that.data.rushList.concat(res.data.list);

            let nowtime = Date.parse(new Date())/1000;
            for (var i in rushList) {
              if (rushList[i]['end_time'] < nowtime) {
                rushList[i].actEnd = true
              }
            }

            let reduction = {
              full_money: res.data.full_money,
              full_reducemoney: res.data.full_reducemoney,
              is_open_fullreduction: res.data.is_open_fullreduction
            }
            that.pageNum += 1;
            that.hasRefeshin = false;
            that.setData({
              showLoadMore: false,
              rushList,
              loadMore: false,
              cur_time: res.data.cur_time,
              reduction
            });
            if (that.data.rushList.length == 0) that.setData({
              showEmpty: true
            })
          } else if (res.data.code == 1) {
            if (that.pageNum == 1 && that.data.rushList.length == 0) that.setData({
              showEmpty: true
            })
            that.setData({
              showLoadMore: true,
              loadMore: false,
              loadText: '没有更多了'
            })
            that.hasRefeshin = true;
          } else if (res.data.code == 2) {
            //no login
            that.setData({
              needAuth: true
            })
          }
        },
        complete: function() {
          wx.hideLoading();
        }
      })
    }
  },

  /**
   * 授权成功回调
   */
  authSuccess: function() {
    const that = this;
    this.pageNum = 1;
    this.setData({
      showEmpty: false,
      showLoadMore: true,
      rushList: [],
      needAuth: false
    }, ()=>{
      that.getData();
    })
  },

  authModal: function (t) {
    t.detail && this.setData({ needAuth: true });
    if (this.data.needAuth) {
      this.setData({
        showAuthModal: !this.data.showAuthModal
      });
    }
  },

  /**
   * 加入购物车
   */
  openSku: function(t) {
    var that = this,
      e = t.detail;
    var goods_id = e.actId;
    var options = e.skuList;
    that.setData({
      addCar_goodsid: goods_id
    })

    let list = options.list || [];
    let arr = [];
    if (list.length > 0) {
      for (let i = 0; i < list.length; i++) {
        let sku = list[i]['option_value'][0];
        let temp = {
          name: sku['name'],
          id: sku['option_value_id'],
          index: i,
          idx: 0
        };
        arr.push(temp);
      }
      //把单价剔除出来begin

      var id = '';
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          id = id + arr[i]['id'];
        } else {
          id = id + arr[i]['id'] + "_";
        }
      }
      var cur_sku_arr = options.sku_mu_list[id];

      that.setData({
        sku: arr,
        sku_val: 1,
        cur_sku_arr: cur_sku_arr,
        skuList: e.skuList,
        visible: true,
        showSku: true
      });
    } else {
      let goodsInfo = e.allData;
      that.setData({
        sku: [],
        sku_val: 1,
        skuList: [],
        cur_sku_arr: goodsInfo
      })
      let formIds = {
        detail: {
          formId: ""
        }
      };
      formIds.detail.formId = "the formId is a mock one";
      that.gocarfrom(formIds);
    }
  },

  /**
   * 确认加入购物车
   */
  gocarfrom: function(e) {
    var that = this;
    var is_just_addcar = 1;
    wx.showLoading();
    a.collectFormIds(e.detail.formId);
    that.goOrder();
  },

  goOrder: function() {
    var that = this;
    if (that.data.can_car) {
      that.data.can_car = false;
    }
    var token = wx.getStorageSync('token');
    var community = wx.getStorageSync('community');

    var goods_id = that.data.addCar_goodsid;
    var community_id = community.communityId;
    var quantity = that.data.sku_val;

    var cur_sku_arr = that.data.cur_sku_arr;

    var sku_str = '';
    var is_just_addcar = 1;

    if (cur_sku_arr && cur_sku_arr.option_item_ids) {
      sku_str = cur_sku_arr.option_item_ids;
    }

    let data = {
      goods_id,
      community_id,
      quantity,
      sku_str,
      buy_type: 'dan',
      pin_id: 0,
      is_just_addcar
    }
    util.addCart(data).then(res=>{
      if(res.showVipModal==1) {
        let { pop_vipmember_buyimage } = res.data;
        wx.hideLoading();
        that.setData({ pop_vipmember_buyimage, showVipModal: true, visible: false })
      } else {
        if (res.data.code == 3 || res.data.code == 7) {
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })
        } else if (res.data.code == 4) {
          wx.showToast({
            title: '您未登录',
            duration: 2000,
            success: () => {
              that.setData({
                needAuth: true
              })
            }
          })
        } else if (res.data.code == 6) {
          var msg = res.data.msg;
          let max_quantity = res.data.max_quantity || '';
          (max_quantity > 0) && that.setData({
            sku_val: max_quantity
          })
          wx.showToast({
            title: msg,
            icon: 'none',
            duration: 2000
          })
        } else {
          if (is_just_addcar == 1) {
            that.closeSku();
            (0, status.cartNum)(res.data.total);
            that.setData({
              cartNum: res.data.total
            })
            wx.showToast({
              title: "已加入购物车",
              image: "../../images/addShopCart.png"
            })
          } else {
            var pages_all = getCurrentPages();
            if (pages_all.length > 3) {
              wx.redirectTo({
                url: '/community/pages/buy/index?type=' + that.data.order.buy_type
              })
            } else {
              wx.navigateTo({
                url: '/community/pages/buy/index?type=' + that.data.order.buy_type
              })
            }
          }
        }
      }
    }).catch(res=>{
      app.util.message(res||'请求失败', '', 'error');
    })

  },

  // 选择规格
  selectSku: function(event) {
    var that = this;
    let str = event.currentTarget.dataset.type;
    let obj = str.split("_");
    let arr = that.data.sku;
    let temp = {
      name: obj[3],
      id: obj[2],
      index: obj[0],
      idx: obj[1]
    };
    arr.splice(obj[0], 1, temp);
    that.setData({
      sku: arr
    })
    var id = '';
    for (let i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        id = id + arr[i]['id'];
      } else {
        id = id + arr[i]['id'] + "_";
      }
    }
    var options = this.data.skuList;
    var cur_sku_arr = options.sku_mu_list[id];

    that.setData({
      cur_sku_arr: cur_sku_arr
    });

    console.log(id);
  },

  /**
   * 数量加减
   */
  setNum: function(event) {
    let types = event.currentTarget.dataset.type;
    var that = this;
    var num = 1;
    let sku_val = this.data.sku_val * 1;
    if (types == 'add') {
      num = sku_val + 1;
    } else if (types == 'decrease') {
      if (sku_val > 1) {
        num = sku_val - 1;
      }
    }

    let arr = that.data.sku;
    var options = this.data.skuList;

    if (arr.length > 0) {
      var id = '';
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          id = id + arr[i]['id'];
        } else {
          id = id + arr[i]['id'] + "_";
        }
      }
    }

    if (options.length > 0) {
      let cur_sku_arr = options.sku_mu_list[id];
      if (num > cur_sku_arr['canBuyNum']) {
        num = num - 1;
      }
    } else {
      let cur_sku_arr = this.data.cur_sku_arr;
      if (num > cur_sku_arr['canBuyNum']) {
        num = num - 1;
      }
    }

    this.setData({
      sku_val: num
    })
  },

  /**
   * 关闭购物车选项卡
   */
  closeSku: function() {
    this.setData({
      visible: 0,
      stopClick: false
    });
  },

  changeCartNum: function (t) {
    let that = this;
    let e = t.detail;
    (0, status.cartNum)(that.setData({
      cartNum: e
    }));
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    console.log('这是我的底线');
    this.getData();
  }
})