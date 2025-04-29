const ipPortRegex =
  /^((?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(?::(?:[0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?$/;

var window = floaty.window(
  <frame bg="#dfd0d0">
    <vertical>
      <horizontal>
        <input
          visibility="gone"
          id="wslocation"
          hint="ws地址:"
          text="192.168.10.21:8080"
          width="170"
        />
        <button
          background="transparent"
          id="kun"
          text="🐓"
          width="40"
          height="40"
        />
      </horizontal>
      <vertical id="action" visibility="gone">
        <horizontal>
          <Switch
            id="is_horizontal"
            text="是否横屏"
            checked="false"
            padding="8 8 8 8"
            textSize="15sp"
          />
          <button id="jt" text="启动屏幕捕获" />
        </horizontal>
      </vertical>
    </vertical>
  </frame>
);

setTimeout(() => {
  window.setPosition(0, 150);
});
function confirm_exit() {
  // 主线线程
  events.observeKey();
  // 连续按两下减音量键退出
  let timeout = 2000;
  let lastPressTime = 0;
  //监听音量上键按下
  events.onKeyDown("volume_down", function (_event) {
    const now = Date.now();
    if (now - lastPressTime < timeout) {
      // 3 秒内第二次按下
      threads.shutDownAll();
      engines.stopAll();
      setTimeout(() => {
        runtime.exit();
      }, 800);
    } else {
      toast("再按一次退出脚本");
      lastPressTime = now;
    }
  });
}
function start() {
  window.exitOnClose();
  window.setPosition(200, 400);
  confirm_exit();
}

window.findView("wslocation").setOnClickListener(function (jtView) {
  ui.run(() => {
    window.requestFocus();
  });
});

window.findView("kun").setOnClickListener((v) => {
  ui.run(() => {
    // gone：8 ，visible：0
    const isExpanded = window.findView("wslocation").getVisibility() === 8;
    window.findView("wslocation").setVisibility(isExpanded ? 0 : 8);
    window.findView("action").setVisibility(isExpanded ? 0 : 8);
  });
});

window.findView("kun").setOnClickListener((v) => {
  ui.run(() => {
    // gone：8 ，visible：0
    const isExpanded = window.findView("wslocation").getVisibility() === 8;
    window.findView("wslocation").setVisibility(isExpanded ? 0 : 8);
    window.findView("action").setVisibility(isExpanded ? 0 : 8);
  });
});

// window.findView("kun").setOnLongClickListener((view) => {
//   ui.run(() => {
//     window.setAdjustEnabled(true);
//     // setTimeout(() => {
//     //   window.setAdjustEnabled(false);
//     // }, 5000);
//   });
// });

let ws_img_thread;
window.findView("jt").setOnClickListener(function (jtView) {
  let wslocation = window.findView("wslocation").getText();
  if (!ipPortRegex.test(wslocation)) {
    toastLog("ws地址错误");
    return;
  }
  if (ws_img_thread) {
    jtView.setText("开始屏幕捕获");
    ws_img_thread.interrupt();
    ws_img_thread = null;
    return;
  }
  jtView.setText("关闭屏幕捕获");
  ws_img_thread = threads.start(() => {
    // 请求截图权限（同步方式）
    if (!requestScreenCapture(window.findView("is_horizontal").isChecked())) {
      toast("截图权限被拒绝");
      exit();
    }
    auto();
    if (!auto.service) {
      toast("无障碍权限被拒绝");
      exit();
    }
    // 确保权限获取成功
    auto.waitFor();

    let ws_client = newWebSocket(
      "ws://" +
        wslocation +
        "/ws?device=" +
        JSON.stringify({
          clientId: Date.now() + "img",
          product: device.product,
          brand: device.brand,
        })
    );
    setInterval(() => {
      var outputStream = new java.io.ByteArrayOutputStream();
      let scimg = images.scale(images.captureScreen(), 0.25, 0.25);
      let scbit = scimg.getBitmap();
      scbit.compress(Bitmap.CompressFormat.JPEG, 80, outputStream);
      scimg.recycle();
      scbit.recycle();
      outputStream.close();
      var byteArray = outputStream.toByteArray();
      ws_client.send(okio.ByteString(byteArray));
    }, 25);

    //接收代码执行
    ws_client
      .on(WebSocket.EVENT_BYTES, (bytes, _ws) => {
        let message = bytes.utf8();
        let { code } = JSON.parse(message);
        toastLog(code);
        engines.execScript("web安全沙箱", `(function(){ ${code} })();`);
      })
      .on(WebSocket.EVENT_TEXT, (bytes, _ws) => {
        toastLog(bytes);
      });
  });
  window.disableFocus();
});

start();
