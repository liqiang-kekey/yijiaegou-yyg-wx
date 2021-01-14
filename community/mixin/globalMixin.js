let app = getApp();
module.exports = {
  data: {
    // skin: app.globalData.skin,
    isIpx: app.globalData.isIpx,
    isblack: app.globalData.isblack,
    goods_sale_unit: '件'
  },

  onReady: function() {
    let that = this;
    app.getConfig().then(res=>{
      let common_header_backgroundimage = res.data.common_header_backgroundimage || '';
      app.globalData.common_header_backgroundimage = common_header_backgroundimage;
      let skin = {};
      let primaryColor = res.data.skin || '#ff5344';
      let goods_sale_unit = res.data.goods_sale_unit;
      skin.color = primaryColor;
      if(primaryColor) {
        skin.light = app.util.getLightColor(skin.color, 0.4);
        skin.lighter = app.util.getLightColor(skin.color, 0.8);
      }
      that.setData({ skin, goods_sale_unit })
      app.globalData.skin = skin;
      app.globalData.goods_sale_unit = goods_sale_unit;
    }).catch(()=>{
      that.setData({
        skin: {
          color: '#ff5344',
          subColor: '#ed7b3a',
          lighter: '#fff9f4'
        }
      })
    })
  }
}