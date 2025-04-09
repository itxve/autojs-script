// id  需要 大于2个字符

/**
 * 返回基于当前项目路径
 * @param {*} path
 * @returns
 */
function fs_join(path) {
  return files.join(files.cwd(), path);
}

/**
 * 生成对应的small小文件 【修改自己机型的x,y,w,h】然后生成就行了
 */
const clip_json = {
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
function gen_small_pic() {
  Object.keys(clip_json).forEach((key) => {
    let { name, format, x, y, w, h } = clip_json[key];
    var source = images.read(fs_join("/res/" + name + format));
    var clip = images.clip(source, x, y, w, h);
    let save2path = fs_join("/res/small/" + name + ".png");
    files.ensureDir(save2path);
    images.save(clip, save2path);
  });
}

var window = floaty.window(
  <frame bg="#dfd0d0">
    <vertical>
      <vertical w="260" padding="8">
        <vertical>
          <text id="console" text="准备出击" w="*" />
        </vertical>

        <horizontal padding="4">
          <text text="出击次数:" />
          <input
            id="count"
            hint="出击次数"
            text="2"
            w="80"
            inputType="number"
          />
          <button id="regen" text="重新生成" w="80" />
        </horizontal>
        {/* <vertical>
          <Switch
            id="running"
            text="stop"
            checked="false"
            disabled="true"
            padding="8 8 8 8"
            textSize="15sp"
          />
        </vertical> */}
      </vertical>
      <vertical w="260" h="80" id="configPanel" visibility="gone">
        <horizontal>
          <text textSize="16sp">截取屏幕</text>
          <spinner
            id="select"
            textColor="#4CAF50"
            entryTextColor="#4CAF50"
            entries="好友竞赛|选择机友|出击|死亡|宝箱领取|继续"
          />
          <button id="capture" text="截屏" w="40" h="40" bg="#4CAF50" />
        </horizontal>
      </vertical>
      <vertical w="260" h="80" id="mainPanel">
        <horizontal gravity="center" padding="8">
          <Switch
            id="focus"
            text="聚焦"
            checked="false"
            padding="8 8 8 8"
            textSize="15sp"
          />
          <vertical padding="4">
            <button id="start" text="出击" w="40" h="40" bg="#4CAF50" />
          </vertical>
          <vertical padding="4">
            <button
              id="lookguanggao"
              text="开始看广告"
              w="65"
              h="40"
              bg="#4CAF50"
            />
          </vertical>
          <vertical>
            <button id="config" text="配置" w="40" />
          </vertical>
        </horizontal>
      </vertical>
      <vertical gravity="left" padding="4">
        <button id="exit" text="退出" w="40" h="40" bg="#FF5722" />
      </vertical>
    </vertical>
  </frame>
);

window.exitOnClose();

/**
 * 长按显示调整大小
 */
window.mainPanel.on("long_click", () => {
  window.setAdjustEnabled(true);
  setTimeout(() => {
    window.setAdjustEnabled(false);
  }, 4000);
});

window.config.on("click", () => {
  ui.run(() => {
    // gone：8 ，visible：0
    const isExpanded = window.configPanel.visibility === 8;
    window.configPanel.setVisibility(isExpanded ? 0 : 8);
    if (isExpanded) {
      window.mainPanel.requestLayout();
    } else {
      window.mainPanel.requestLayout();
    }
  });
});

/**
 *
 * @param {*} path
 * @param {*} offset_x
 * @param {*} offset_y
 * @returns
 */
function findImageThenClick(path, offset_x, offset_y) {
  var capture = captureScreen();
  var clip = images.read(fs_join(path));
  var beg = findImage(capture, clip, { threshold: 0.8 });
  if (beg) {
    let { x, y } = beg;
    click(x + offset_x, y + offset_y);
    return true;
  } else {
    return false;
  }
}

function consoleText(text) {
  ui.run(() => {
    window.console.setText(text);
  });
}
// 请求截图权限（同步方式）
if (!requestScreenCapture()) {
  toast("截图权限被拒绝");
  exit();
}
// 确保权限获取成功
auto.waitFor();

window.regen.on("click", () => {
  gen_small_pic();
  toast("生成成功！");
});

var lookguanggao_task;
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
        "/res/small/" + clip_json["guanggao"].name + ".png",
        10,
        10
      );
      if (!looking) {
        return;
      }
      sleep(45000);
      back();
      sleep(3000);
      findImageThenClick(
        "/res/small/" + clip_json["lingqu"].name + ".png",
        20,
        20
      );
      sleep(3000);
    }
    consoleText("广告都已看完了！");
  });
});

/**
 * 出击
 */
var chuji_task;
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
      findImageThenClick(
        "/res/small/" + clip_json["haoyoujingsai"].name + ".png",
        20,
        20
      );
      consoleText(prestr + "setp.1 [好友竞赛]");
      sleep(1500);
      findImageThenClick(
        "/res/small/" + clip_json["jiyouchuji"].name + ".png",
        20,
        20
      );
      consoleText(prestr + "setp.2 [选择战友出击]");
      sleep(1500);
      findImageThenClick(
        "/res/small/" + clip_json["chuji"].name + ".png",
        20,
        20
      );
      consoleText(prestr + "setp.3 [出击]");
      sleep(1500);
      let dead = false;
      while (!dead) {
        consoleText(prestr + "setp.4 [检测是否死亡并结束]");
        dead = findImageThenClick(
          "/res/small/" + clip_json["dead"].name + ".png",
          20,
          20
        );
      }
      consoleText(prestr + "setp.4 [已死亡]");
      sleep(6000);
      //是否有宝箱领取
      findImageThenClick(
        "/res/small/" + clip_json["lingqu"].name + ".png",
        20,
        20
      );
      consoleText(prestr + "setp.5 [宝箱领取]");
      sleep(4000);
      findImageThenClick(
        "/res/small/" + clip_json["jixu"].name + ".png",
        20,
        20
      );
      consoleText(prestr + "setp.6 [继续出击]");
    }
    consoleText("出击完成了");
  });
});

/**
 * 聚焦
 */
window.focus.on("check", function (checked) {
  if (checked) {
    window.requestFocus();
  } else {
    window.disableFocus();
  }
});

let close = false;
window.setPosition(200, 400);
window.exit.click(function () {
  close = true;
  toast("exit");
  if (task) {
    task.interrupt();
  }
});

while (!close) {}
