var app = getApp();

Component({
  properties: {
    currentIdx: {
      type: Number,
      value: 0,
      observer: function (t) {
        if (t) {
          let tabbar = this.data.tabbar;
          for (let i in tabbar.list) {
            tabbar.list[i].selected = false;
            (i == t) && (tabbar.list[i].selected = true);
          }
          this.setData({ tabbar })
        }
      }
    },
    cartNum: {
      type: Number,
      value: 0
    },
    tabbarRefresh: {
      type: Boolean,
      value: false,
      observer: function (t) {
        if (t) this.getTabbar();
      }
    },
    needAuth: {
      type: Boolean,
      value: false
    }
  },

  attached() {
    let model = wx.getSystemInfoSync().model;
    let isIpx = model.indexOf("iPhone X") > -1 || model.indexOf("unknown<iPhone") > -1 || model.indexOf("iPhone 11") > -1;
    isIpx && this.setData({ isIpx: true });
    this.getTabbar();
  },

  /**
   * 组件的初始数据
   */
  data: {
    isIpx: false,
    tabbar: {
      "backgroundColor": "#fff",
      "color": "#707070",
      "selectedColor": "#ff5344",
      "list": [
        {
          "pagePath": "/community/pages/index/index",
          "text": "",
          "iconPath": "",
          "selectedIconPath": "",
          "selected": true
        },
        {
          "pagePath": "/community/pages/type/index",
          "text": "",
          "iconPath": "",
          "selectedIconPath": "",
          "selected": false
        },
        {
          "pagePath": "",
          "text": "",
          "iconPath": "",
          "selectedIconPath": "",
          "selected": false
        },
        {
          "pagePath": "/community/pages/order/shopCart",
          "text": "",
          "iconPath": "",
          "selectedIconPath": "",
          "selected": false
        },
        {
          "pagePath": "/community/pages/user/me",
          "text": "",
          "iconPath": "",
          "selectedIconPath": "",
          "selected": false
        }
      ]
    },
    open_tabbar_type: 0,
    open_tabbar_out_weapp: 0,
    cartNum: 0,
    tabbar_out_appid: '',
    tabbar_out_link: '',
    tabbar_out_type: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getTabbar: function () {
      let that = this;
      app.util.request({
        'url': 'entry/wxapp/index',
        'data': {
          controller: 'index.get_tabbar'
        },
        dataType: 'json',
        success: function (res) {
          if (res.data.code == 0) {
            let list = res.data.data;
            let tabbar = that.data.tabbar;
            tabbar.list[0].text = list['t1'] || '首页';
            tabbar.list[0].iconPath = list['i1'] || '/community/images/icon-tab-index.png';
            tabbar.list[0].selectedIconPath = list['s1'] || '/community/images/icon-tab-index-active.png';
            tabbar.list[1].text = list['t4'] || '分类';
            tabbar.list[1].iconPath = list['i4'] || '/community/images/icon-tab-type.png';
            tabbar.list[1].selectedIconPath = list['s4'] || '/community/images/icon-tab-type-active.png';
            tabbar.list[2].text = list['t5'];
            tabbar.list[2].iconPath = list['i5'];
            tabbar.list[2].selectedIconPath = list['s5'];
            tabbar.list[3].text = list['t2'] || '购物车';
            tabbar.list[3].iconPath = list['i2'] || '/community/images/icon-tab-shop.png';
            tabbar.list[3].selectedIconPath = list['s2'] || '/community/images/icon-tab-shop-active.png';
            tabbar.list[4].text = list['t3'] || '我的';
            tabbar.list[4].iconPath = list['i3'] || '/community/images/icon-tab-me.png';
            tabbar.list[4].selectedIconPath = list['s3'] || '/community/images/icon-tab-me-active.png';

            let open_tabbar_type = res.data.open_tabbar_type || 0;
            let open_tabbar_out_weapp = res.data.open_tabbar_out_weapp || 0;
            let tabbar_out_appid = res.data.tabbar_out_appid;
            let tabbar_out_link = res.data.tabbar_out_link;
            let tabbar_out_type = res.data.tabbar_out_type;
            tabbar.selectedColor = res.data.wepro_tabbar_selectedColor || '#F75451';
            tabbar.backgroundColor = res.data.wepro_tabbar_bgColor || '#ffffff';
            // wcache.put('open_tabbar_type', open_tabbar_type, 600);

            // wcache.put('tabList', tabbar, 600);
            that.setData({ tabbar, open_tabbar_type, open_tabbar_out_weapp, tabbar_out_appid, tabbar_out_link, tabbar_out_type });
          } else {
            that.setData({ hideTabbar: true })
          }
        }
      })
    },
    goWeapp: function(){
      // 跳转小程序
      let appid = this.data.tabbar_out_appid;
      let url = this.data.tabbar_out_link;
      let type = this.data.tabbar_out_type;
      if (type == 0) {
        // 跳转webview
        wx.navigateTo({
          url: '/community/pages/web-view?url=' + encodeURIComponent(url),
        })
      } else if (type == 1) {
        let tabUrls = ['/community/pages/index/index', '/community/pages/order/shopCart', '/community/pages/user/me', '/community/pages/type/index'];
        let redUrls = ['/community/moduleA/solitaire/index', '/community/moduleA/video/index', '/community/moduleA/menu/index', '/community/moduleA/pin/index'];
        if (tabUrls.indexOf(url) != -1) {
          wx.switchTab({ url })
        } else if (redUrls.indexOf(url) != -1) {
          if(url == '/community/moduleA/solitaire/index'&&this.data.needAut) {
            this.triggerEvent('authModal', true);
          } else {
            wx.redirectTo({ url });
          }
        } else {
          wx.navigateTo({ url })
        }
      } else if (type == 2) {
        appid && wx.navigateToMiniProgram({
          appId: appid,
          path: url,
          extraData: {},
          envVersion: 'release',
          success(res) {
            // 打开成功
            console.log(res)
          }
        })
      } else if (type == 3) {
        let url = '/community/moduleA/pin/index';
        wx.redirectTo({ url })
      } else if (type == 4) {
        let url = '/community/moduleA/menu/index';
        wx.redirectTo({ url })
      } else if (type == 5) {
        let url = '/community/moduleA/video/index';
        wx.redirectTo({ url })
      } else if (type == 6) {
        if(this.data.needAuth) {
          this.triggerEvent('authModal', true)
        } else {
          let url = '/community/moduleA/solitaire/index';
          wx.redirectTo({ url })
        }
      } else if (type == 7) {
        let url = '/community/moduleB/live/index';
        wx.redirectTo({ url })
      } else if(type == 8) {
        let url = '/community/moduleB/generalmall/index';
        wx.redirectTo({ url })
      }
    }
  }
})
