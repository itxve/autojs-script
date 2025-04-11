// id  需要 大于2个字符

/**
 * 返回基于当前项目 main.js路径
 * @param {*} path
 * @returns
 */
function fs_join(path) {
  return files.join(files.cwd(), path);
}

/**
 * 生成对应的small小文件 【修改自己机型的x,y,w,h】然后生成就行了
 */
const config_json = {
  haoyoujingsai: {
    name: "haoyoujingsai",
    format: ".jpg",
    x: 293,
    y: 2378,
    w: 315,
    h: 116,
  },
  jiyouchuji: {
    name: "jiyouchuji",
    format: ".jpg",
    x: 394,
    y: 2381,
    w: 488,
    h: 129,
  },
  chuji: { name: "chuji", format: ".jpg", x: 378, y: 2378, w: 480, h: 125 },
  dead: { name: "dead", format: ".jpg", x: 1031, y: 1216, w: 50, h: 50 },
  lingqu: { name: "lingqu", format: ".jpg", x: 413, y: 2074, w: 430, h: 144 },
  jixu: { name: "jixu", format: ".jpg", x: 410, y: 2230, w: 432, h: 144 },
  guanggao: { name: "guanggao", format: ".jpg", x: 64, y: 1905, w: 52, h: 52 },
};

let capture_map = {
  0: { name: "haoyoujingsai", format: ".jpg", label: "好友竞赛" },
  1: { name: "jiyouchuji", format: ".jpg", label: "选择机友" },
  2: { name: "chuji", format: ".jpg", label: "出击" },
  3: { name: "dead", format: ".jpg", label: "死亡" },
  4: { name: "lingqu", format: ".jpg", label: "宝箱领取" },
  5: { name: "jixu", format: ".jpg", label: "继续" },
  6: { name: "guanggao", format: ".jpg", label: "商城广告" },
};
const pic_list = Object.values(capture_map)
  .map((item) => item.label)
  .join("|");

/**
 * 生成小图
 */
function gen_small_pic() {
  Object.keys(config_json).forEach((key) => {
    let { name, format, x, y, w, h } = config_json[key];
    var source = images.read(fs_join("/res/" + name + format));
    var clip = images.clip(source, x, y, w, h);
    let save2path = fs_join("/res/small/" + name + ".png");
    files.ensureDir(save2path);
    images.save(clip, save2path);
  });
}

var window = floaty.window(
  <frame id="main" bg="#dfd0d0">
    <vertical>
      <vertical>
        <text id="console" text="准备出击" w="*" />
      </vertical>
      <vertical id="mainPanel" visibility="gone">
        <vertical w="260" padding="8">
          <horizontal padding="4">
            <text text="出击次数:" />
            <input
              id="count"
              hint="出击次数"
              text="2"
              w="80"
              inputType="number"
            />
            <button id="regen" text="生成小图" w="80" />
          </horizontal>
        </vertical>
        <vertical w="260" h="80">
          <horizontal padding="16">
            <vertical>
              <button id="capture" text="截屏" w="60" h="40" />
            </vertical>
            <vertical>
              <spinner
                id="select"
                textColor="#0261ac"
                entryTextColor="#0261ac"
                w="180"
                entries="{{pic_list}}"
              />
            </vertical>
          </horizontal>
        </vertical>
      </vertical>
      <vertical w="260" h="60" id="miniPanel">
        <horizontal gravity="center" padding="6">
          <Switch
            id="open"
            text="聚焦"
            checked="false"
            padding="8 8 8 8"
            textSize="15sp"
          />
          <vertical>
            <button id="start" text="出击" w="60" h="40" />
          </vertical>
          <vertical>
            <button id="lookguanggao" text="开始看广告" w="90" h="40" />
          </vertical>
        </horizontal>
      </vertical>
    </vertical>
  </frame>
);

let resize = () => {
  window.setAdjustEnabled(true);
  setTimeout(() => {
    window.setAdjustEnabled(false);
  }, 4000);
};
/**
 * 长按显示调整大小
 */
window.miniPanel.on("long_click", resize);

/**
 * 找图
 * @param {*} path
 * @param {*} offset_x
 * @param {*} offset_y
 * @returns
 */
function findImageThenClick(path, offset_x, offset_y) {
  var capture = images.captureScreen();
  var clip = images.read(fs_join(path));
  if (!clip) {
    toast(fs_join(path) + ":not found");
  }
  var beg = findImage(capture, clip, { threshold: 0.8 });
  if (beg) {
    let { x, y } = beg;
    click(x + offset_x, y + offset_y);
    return true;
  } else {
    return false;
  }
}

/**
 * 找图等待超时
 * @param {*} path
 * @param {*} offset_x
 * @param {*} offset_y
 * @param {*} timeout
 * @param {*} retryInterval
 * @returns
 */
function findImageByTimeOutThenClick(
  path,
  offset_x,
  offset_y,
  timeout,
  retryInterval
) {
  timeout = timeout || 10000;
  retryInterval = retryInterval || 1000;

  const startTime = Date.now();
  let finded = false;
  while (!finded) {
    finded = findImageThenClick(path, offset_x, offset_y);
    sleep(retryInterval);
    if (Date.now() - startTime >= timeout) {
      toast(path + "：超时");
      return;
    }
  }
}

/**
 * task cosole 显示
 * @param {*} text
 */
function consoleText(text) {
  ui.run(() => {
    window.console.setText(text);
  });
}

window.regen.on("click", () => {
  gen_small_pic();
  toast("小图成功！");
});

window.open.on("check", function (checked) {
  if (checked) {
    window.requestFocus();

    ui.run(() => {
      window.main.setBackgroundColor(colors.parseColor("#7e7ec0"));
    });
  } else {
    window.disableFocus();

    ui.run(() => {
      window.main.setBackgroundColor(colors.parseColor("#dfd0d0"));
    });
  }
  ui.run(() => {
    // gone：8 ，visible：0
    const isExpanded = window.mainPanel.visibility === 8;
    ui.run(() => {
      window.mainPanel.setVisibility(isExpanded ? 0 : 8);
    });
  });
});

window.capture.click(function () {
  let selectIndex = window.select.getSelectedItemPosition();
  let { name, format } = capture_map[selectIndex];
  toast(name);
  // captureScreen(fs_join("/res/" + name + "--hh" + format));
  toast(fs_join("/res/" + name + "--hh" + format));
});

function orc(area, text, timeout, retryInterval) {
  threads.start(() => {
    retryInterval = retryInterval || 1000;
    let img = images.captureScreen();
    try {
      const startTime = Date.now();
      let finded = false;
      while (!finded) {
        let results = ocr(img, area);
        if (results) {
          results = String(results);
          consoleText(results);
          finded = results.indexOf(text) != -1;
        }
        sleep(retryInterval);
        if (Date.now() - startTime >= timeout) {
          finded = false;
        }
      }
    } catch (error) {
      consoleText(error);
    }
  });
}

var lookguanggao_task;
/**
 * 观看商城广告
 */
window.lookguanggao.on("click", () => {
  if (lookguanggao_task) {
    lookguanggao_task.interrupt();
    lookguanggao_task = null;
    // 宏任务更新
    setTimeout(() => {
      consoleText("广告脚本暂停，请重新进入商城广告界面");
      window.lookguanggao.setText("开始看广告");
    }, 100);
    return;
  }
  window.lookguanggao.setText("暂停看广告");
  lookguanggao_task = threads.start(() => {
    let looking = true;
    while (looking) {
      consoleText("观看广告中......");
      looking = findImageThenClick(
        "/res/small/" + config_json["guanggao"].name + ".png",
        10,
        10
      );
      if (!looking) {
        return;
      }
      orc([0, 0, device.width, device.height / 5], "已获得奖励", 40000, 3000);
      findImageThenClick(
        "/res/small/" + config_json["lingqu"].name + ".png",
        20,
        20,
        4000,
        2000
      );
      consoleText("领取完毕");
    }
    consoleText("广告都已看完了！");
  });
});

var chuji_task;
/**
 * 无尽出击
 */
window.start.on("click", () => {
  if (chuji_task) {
    chuji_task.interrupt();
    chuji_task = null;
    // 宏任务更新
    setTimeout(() => {
      consoleText("出击脚本暂停，请重新进入好友竞赛界面再出击");
      window.start.setText("出击");
    }, 100);
    return;
  }
  window.start.setText("暂停");
  chuji_task = threads.start(() => {
    consoleText("出击");
    let count = window.count.text();
    count = Number(count) || 1;
    for (let index = 1; index <= count; index++) {
      let prestr = `第${index}次出击 ::`;
      consoleText(prestr + "setp.1 [好友竞赛]");
      findImageByTimeOutThenClick(
        "/res/small/" + config_json["haoyoujingsai"].name + ".png",
        20,
        20,
        10000,
        2000
      );
      consoleText(prestr + "setp.2 [选择战友出击]");
      findImageByTimeOutThenClick(
        "/res/small/" + config_json["jiyouchuji"].name + ".png",
        20,
        20,
        10000,
        2000
      );
      consoleText(prestr + "setp.3 [出击]");
      findImageByTimeOutThenClick(
        "/res/small/" + config_json["chuji"].name + ".png",
        20,
        20,
        10000,
        2000
      );
      consoleText(prestr + "setp.4 [检测是否死亡并结束]");
      findImageByTimeOutThenClick(
        "/res/small/" + config_json["dead"].name + ".png",
        20,
        20,
        300000, //半小时
        4000
      );
      consoleText(prestr + "setp.4 [已死亡]");
      sleep(1000);
      consoleText(prestr + "setp.5 [宝箱领取]");
      //是否有宝箱领取
      findImageByTimeOutThenClick(
        "/res/small/" + config_json["lingqu"].name + ".png",
        20,
        20,
        10000,
        2000
      );

      findImageByTimeOutThenClick(
        "/res/small/" + config_json["jixu"].name + ".png",
        20,
        20,
        10000,
        2000
      );
      consoleText(prestr + "setp.6 [继续出击]");
      sleep(2000);
    }
    consoleText("出击完成了");
    window.start.setText("出击");
  });
});

function checkAccessibility() {
  if (!auto.service) {
    toast("请先开启无障碍服务");
    return false;
  }
  return true;
}

function exitScript() {
  threads.shutDownAll();
  engines.stopAll();
  setTimeout(() => {
    runtime.exit();
  }, 800);
}

function start() {
  // 请求截图权限（同步方式）
  if (!requestScreenCapture()) {
    toast("截图权限被拒绝");
    exit();
  }
  // 确保权限获取成功
  auto.waitFor();
  window.exitOnClose();
  window.setPosition(200, 400);

  if (!checkAccessibility()) return;

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
      exitScript();
    } else {
      toast("再按一次退出脚本");
      lastPressTime = now;
    }
  });
}

start();
