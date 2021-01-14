// community/pages/index/zhibo.js
var app = getApp();
const date = require('../../utils/date.js')

Page({

  /**
   * 页面的初始数据
   
  data: {
    vediourl:'',
    poster:''
  },
*/
// 私有数据,用于模板渲染
data: {
  //视频是否已就绪
  isReady: false,
  // 设备SN
  sn: '',
  // 设备名称
  name: '监控直播',
  // 视频地址
  hlsurl: '',
  // 视频预览图
  imgsrc: '',
  // 用户账号
  user: '',
  // 用户密码
  password: '',
  vediourl:'',
    poster:''
},

// 当前播放视频信息
video: {
  // 播放器对象
  player: null,
  // 资源地址
  hlsurl: null,
  // 资源是否可用
  available: 0,
  // 播放状态
  state: '',
  // 当前播放位置
  currentTime: 0,
  // 最后播放位置
  lastTime: 0,
  // 持续播放时间
  duration: 0,
  // 持续播放时间限制(秒),0表示不限制
  timeout: 600,
  // 心跳连接服务器间隔时间(秒)
  heartbeatIntervalTime: 300,
  // 最后一次心跳请求时间戳
  heartbeatTimestamp: 0,
  // 心跳请求结果:成功或失败
  heartbeatResult: 0,
  // 重载定时器
  monitorInterval: null,
  // 允许最大重载次数
  reloadLimitTimes: 10,
  // 已重载次数
  reloadTimes: 0,
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    var that = this;
    console.log("page onLoad")
    var username = 'demo';
    var password = '';
    //
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_suyuan_info',
      },
      dataType: 'json',
      success: function (res) {
        //console.log(res);
        let vediourl = res.data.hlsurl;
        let imgurl = res.data.imgsrc;
        //
        //
        that.setData({ 
          isReady: true,
          sn: res.data.sn,
          name: res.data.name,
          hlsurl: res.data.hlsurl,
          imgsrc: res.data.imgsrc,
          user: username,
          password: password
                     });
        //console.log("onload:"+that.data.sn);
      }
    });
    //
    wx.setNavigationBarTitle({
      title: that.data.name
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log("page onReady")
    this.video.player = wx.createVideoContext('myVideo')
    this.video.player.play()
    // 缓存视频资源地址
    this.video.hlsurl = this.data.hlsurl
    // 建立首次心跳
    this.heartbeatRequest()
    // 开始监控进程,初始化等待3秒
    this.video.monitorInterval = setInterval(this.monitor, 3000)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log("page onShow")
    //用于再次显示后,如资源可用,则继续播放
    if (this.video.available) {
      this.play()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("page onHide")
    // this.pause()
    this.stop()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("page onUnload")
    this.stop()
  },
  // 监控下拉刷新
  onPullDownRefresh() {
    console.log("page onPullDownRefresh")
    // wx.startPullDownRefresh()
  },

  // 播放中或手动点击播放按钮后
  onPlay() {
    this.video.state = "onPlay"
    console.log("播放状态: ", this.video.state);
  },

  // 暂停播放
  onPause() {
    this.video.state = "onPause"
    console.log("播放状态: ", this.video.state)
  },

  //结束播放
  onEnded() {
    this.video.state = "onEnded"
    console.log("播放状态: ", this.video.state)
    this.video.available = 0
  },

  //播放进度改变时,250ms触发一次
  onTimeUpdate(event) {
    console.log(event.detail)
    // 播放进度
    this.video.currentTime = event.detail.currentTime
    // 持续时间
    this.video.duration = event.detail.duration
    // 监控播放进度
    this.video.available = 1
  },

  // 全屏状态改变
  onFullScreenChange(event) {
    console.log("onFullScreenChange", event.detail)
  },

  // 等待播放或缓冲时
  onWaiting() {
    //this.video.state = "onWaiting"
    console.log("播放状态: ", this.video.state)
  },

  // 视频播放出错时
  onError() {
    this.video.state = "onError"
    console.log("播放状态: ", this.video.state)
    this.video.available = 0
  },
  
  // 加载进度变化时,不能设置状态,否则会导致暂停后仍然播放的BUG
  onProgress(event) {
    this.video.state = "onProgress"
    // console.log("播放状态: ", this.video.state)
    this.video.available = 1
  },

  // 控制播放
  play() {
    console.log("播放控制: play")
    // 如视频未就绪,则重新渲染
    var that = this
    if (!this.data.isReady) {
      this.setData({
        isReady: true,
        hlsurl: this.video.hlsurl
      },function(){
        // 渲染成功后回调控制播放
        that.video.player.play()
      })
    } else { //同步控制播放
      this.video.player.play()
    }
  },

  // 控制暂停
  pause() {
    console.log("播放控制: pause")
    this.video.player.pause()

  },

  // 控制结束
  stop() {
    console.log("播放控制: stop")
    // stop方法对直播的支持不够,需要清空播放地址以避免持续下载视频文件
    this.video.player.pause()
    this.video.player.stop()
    clearInterval(this.video.monitorInterval)
    this.setData({
      isReady: false,
      hlsurl: ''
    })
    // 重置播放信息
    this.video.available = 0
    this.video.state = ''
    this.video.currentTime = 0
    this.video.lastTime = 0
    this.video.duration = 0
    this.video.reloadTimes = 0
  },

  // 监控进程
  monitor() {
    var timer = 10000
    //重置定时器
    clearInterval(this.video.monitorInterval)

    // 播放超时或请求次数超限时,停止播放并停止监控
    if (this.video.reloadTimes > this.video.reloadLimitTimes || this.video.timeout && this.video.duration >= this.video.timeout) {
      console.log("播放超时或超限,连续重载", this.video.reloadTimes, "次,持续播放", this.video.duration, "秒")
      this.stop()
      return
    }

    // 视频未就绪,重新渲染播放器
    if(!this.data.isReady) {
      this.play()
      timer = 10000
    }
    // 资源不可用时,重置播放器,即设置为未就绪状态,重新渲染
    else if (!this.video.available) {
      this.video.player.pause()
      this.video.player.stop()
      this.setData({
        isReady: false,
        hlsurl: ''
      })
      this.video.reloadTimes++
      console.log("资源第", this.video.reloadTimes, "次重载")
      timer = 10000
    }
    // 暂停播放
    else if (this.video.state === 'onPause') {
      timer = 10000
    }
    // 播放进度停滞,尝试控制播放,并设置资源不可用,如在下次监控时仍未恢复则重置播放器
    else if (this.video.lastTime === this.video.currentTime) {
      this.play()
      this.video.available = 0
      timer = 10000
    }
    // 其它状态:播放中,缓冲中..,重置定时器,并开始计算心跳
    else {
      console.log("播放进度: ", this.video.currentTime)
      this.video.reloadTimes = 0
      this.heartbeatRequest()
      timer = 10000
    }

    // 更新最后一次播放时间
    this.video.lastTime = this.video.currentTime
    // 下一轮监控
    this.video.monitorInterval = setInterval(this.monitor, timer)
  },

  // 心跳连接
  heartbeatRequest() {
    // 心跳状态检测: 已请求成功且时间间隔小于设定时间内不再请求
    if (this.video.heartbeatResult && date.timestamp() - this.video.heartbeatTimestamp < this.video.heartbeatIntervalTime) {
      return
    }
    
    // 重置心跳请求结果
    this.video.heartbeatResult = 0
    console.log("发送心跳连接,上次成功连接时间:", this.video.heartbeatTimestamp)

    var that = this;
    app.util.request({
      url: 'entry/wxapp/index',
      data: {
        controller: 'index.get_camera_info',
        dev:'2100109D841A27BD',
      },
      method: 'POST',
      dataType: 'json',
      success(res) {
        //console.log("心跳结果:"+that.data.sn);
        console.log(res.data);
        if (res.data.result == 0) {
          that.video.heartbeatTimestamp = date.timestamp()
          that.video.heartbeatResult = 1
          console.log("心跳连接成功,连接时间:", that.video.heartbeatTimestamp)
        }
      }
    })
  },

})