var app = getApp();
var t = require("../../utils/public");
var status = require('../../utils/index.js');
var util = require('../../utils/util.js');

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    spuItem: {
      type: Object,
      value: {
        spuId: "",
        skuId: "",
        spuImage: "",
        spuName: "",
        endTime: 0,
        beginTime: "",
        actPrice: ["", ""],
        marketPrice: ["", ""],
        spuCanBuyNum: "",
        soldNum: "",
        actId: "",
        limitMemberNum: "",
        limitOrderNum: "",
        serverTime: "",
        isLimit: false,
        skuList: [],
        spuDescribe: "",
        is_take_fullreduction: 0,
        label_info: "",
        car_count: 0
      }
    },
    isPast: {
      type: Boolean,
      value: false
    },
    actEnd: {
      type: Boolean,
      value: false
    },
    reduction: {
      type: Object,
      value: {
        full_money: '',
        full_reducemoney: '',
        is_open_fullreduction: 0
      }
    },
    changeCarCount: {
      type: Boolean,
      value: false,
      observer: function (t) {
        if (t) this.setData({ number: this.data.spuItem.car_count });
      }
    },
    needAuth: {
      type: Boolean,
      value: false
    },
    notNum: {
      type: Boolean,
      value: false
    },
    width250: {
      type: Boolean,
      value: false
    },
    is_open_vipcard_buy: {
      type: Number,
      value: 0
    },
    canLevelBuy: {
      type: Boolean,
      value: false
    }
  },

  attached() {
    this.setData({
      placeholdeImg: app.globalData.placeholdeImg
    })
  },

  /**
   * 组件的初始数据
   */
  data: {
    disabled: false,
    placeholdeImg: '',
    number: 0
  },

  ready: function () {
    this.setData({
      number: this.data.spuItem.car_count || 0
    });
  },

  /**
   * 组件的方法列表
   */
  methods: {
    openSku: function () {
      if (this.data.needAuth) {
        this.triggerEvent("authModal");
        return;
      }
      console.log('step1');
      this.setData({
        stopClick: true,
        disabled: false
      })
      let spuItem = this.data.spuItem;
      if (spuItem.skuList.length === void 0) {
        this.triggerEvent("openSku", {
          actId: spuItem.actId,
          skuList: spuItem.skuList,
          promotionDTO: spuItem.promotionDTO,
          is_take_vipcard: spuItem.is_take_vipcard,
          is_mb_level_buy: spuItem.is_mb_level_buy,
          allData: {
            spuName: spuItem.spuName,
            skuImage: spuItem.skuImage,
            actPrice: spuItem.actPrice,
            canBuyNum: spuItem.spuCanBuyNum,
            stock: spuItem.spuCanBuyNum,
            marketPrice: spuItem.marketPrice
          }
        });
      } else {
        this.addCart({ value: 1, type: "plus" });
      }
    },
    countDownEnd: function () {
      this.setData({
        actEnd: true
      });
    },
    submit2: function (e) {
      (0, t.collectFormIds)(e.detail.formId);
    },
    changeNumber: function (t) {
      var e = t.detail;
      e && this.addCart(e);
    },
    outOfMax: function (t) {
      var e = t.detail, canBuyNum = this.data.spuItem.spuCanBuyNum;
      if (this.data.number >= canBuyNum) {
        wx.showToast({
          title: "不能购买更多啦",
          icon: "none"
        })
      }
    },
    addCart: function (t) {
      var token = wx.getStorageSync('token');
      var community = wx.getStorageSync('community');
      var goods_id = this.data.spuItem.actId;
      var community_id = community.communityId;
      let that = this;
      if (t.type == 'plus') {
        let data = {
          goods_id,
          community_id,
          quantity: 1,
          sku_str: '',
          buy_type: 'dan',
          pin_id: 0,
          is_just_addcar: 1
        }
        util.addCart(data).then(res=>{
          if(res.showVipModal==1) {
            let { pop_vipmember_buyimage } = res.data;
            that.triggerEvent("vipModal", { pop_vipmember_buyimage, showVipModal: true, visible: false });
          } else {
            if (res.data.code == 3) {
              wx.showToast({
                title: res.data.msg,
                icon: 'none',
                duration: 2000
              })
            } else if (res.data.code == 6 || res.data.code == 7) {
              let max_quantity = res.data.max_quantity || '';
              (max_quantity > 0) && that.setData({ number: max_quantity })
              var msg = res.data.msg;
              wx.showToast({
                title: msg,
                icon: 'none',
                duration: 2000
              })
            } else {
              status.indexListCarCount(goods_id, res.data.cur_count);
              that.triggerEvent("changeCartNum", res.data.total);
              that.setData({ number: res.data.cur_count })
              wx.showToast({
                title: "已加入购物车",
                image: "../../images/addShopCart.png"
              })
            }
          }
        })
      } else {
        app.util.request({
          url: 'entry/wxapp/user',
          data: {
            controller: 'car.reduce_car_goods',
            token: token,
            goods_id: goods_id,
            community_id: community_id,
            quantity: 1,
            sku_str: '',
            buy_type: 'dan',
            pin_id: 0,
            is_just_addcar: 1
          },
          dataType: 'json',
          method: 'POST',
          success: function (res) {
            if (res.data.code == 3) {
              wx.showToast({
                title: res.data.msg,
                icon: 'none',
                duration: 2000
              })
            } else {
              status.indexListCarCount(goods_id, res.data.cur_count);
              that.setData({ number: res.data.cur_count })
              that.triggerEvent("changeCartNum", res.data.total);
            }
          }
        })
      }
    }
  }
})