var t = require("../../utils/public");
var app = getApp();

Component({
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
        label_info: ""
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
    isShowListCount: {
      type: Number,
      value: 0
    },
    saleUnit: {
      type: String
    }
  },
  attached() {
    this.setData({ placeholdeImg: app.globalData.placeholdeImg})
  },
  data: {
    disabled: false,
    placeholdeImg: ''
  },
  methods: {
    openSku: function() {
      console.log( 'step1');
      console.log(this.data.spuItem.spuCanBuyNum)
      this.setData({
        stopClick:true,
        disabled:false
      })
      this.triggerEvent("openSku", {
        actId:this.data.spuItem.actId,
        skuList: this.data.spuItem.skuList,
        promotionDTO: this.data.spuItem.promotionDTO,
        allData: {
          spuName: this.data.spuItem.spuName,
          skuImage: this.data.spuItem.skuImage,
          actPrice: this.data.spuItem.actPrice,
          canBuyNum: this.data.spuItem.spuCanBuyNum,
          stock: this.data.spuItem.spuCanBuyNum,
          marketPrice: this.data.spuItem.marketPrice
        }
      });
    },
    countDownEnd: function() {
      this.setData({
        actEnd: true
      });
    },
    submit2: function(e) {
      (0, t.collectFormIds)(e.detail.formId);
    }
  }
});