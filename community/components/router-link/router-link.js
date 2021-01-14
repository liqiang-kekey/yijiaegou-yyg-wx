// community/components/router-link/router-link.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    url: String,
    type: String,
    disabled: {
      type: Boolean,
      value: false
    },
    delta: {
      type: Number,
      value: 1
    }
  },
  externalClasses: ["router-class"],
  /**
   * 组件的初始数据
   */
  data: {
    canClick: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    routerLink: function () {
      var that = this;
      if (!this.data.disabled && this.data.canClick)
        if (this.data.url) {
          this.setData({
            canClick: false
          });
          var data = {
            url: this.data.url,
            success: function (e) {
              that.triggerEvent("on-success", e);
            },
            fail: function (e) {
              console.warn("routerLink Error:", e), that.triggerEvent("on-error", e);
            },
            complete: function () {
              setTimeout(function () {
                that.setData({
                  canClick: true
                });
              }, 400);
            }
          };

          let surl = this.data.url;
          if (surl.indexOf('community/pages/index/index') != -1 || surl.indexOf('community/pages/order/shopCart') != -1 || surl.indexOf('community/pages/user/me') != -1 || surl.indexOf('community/pages/type/index') != -1 ) { this.setData({ type: 'switch' })}

          switch (this.data.type) {
            case "redirect":
              wx.redirectTo(data);
              break;

            case "switch":
              wx.switchTab(data);
              break;

            case "navigateback":
              wx.navigateBack({
                delta: this.data.delta,
                success: function (e) {
                  that.triggerEvent("on-success", e);
                },
                fail: function (t) {
                  console.warn("routerLink Error:", t);
                },
                complete: function () {
                  that.setData({
                    canClick: false
                  });
                }
              });
              break;

            case "relaunch":
              wx.reLaunch(data);
              break;

            default:
              wx.navigateTo(data);
          }
        } else console.warn("url 不能为空");
    }
  }
})