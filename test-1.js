// TikTok 自动化脚本 - 基于状态机的流程管理
// 1. 定义各个状态
const STATES = {
    CHECK_LAUNCH: 'CHECK_LAUNCH',
    HOME: 'HOME',
    PROFILE: 'PROFILE',
    LOGIN_FLOW: 'LOGIN_FLOW',
    LOGOUT_FLOW: 'LOGOUT_FLOW',
    DONE: 'DONE'
};

// 配置
const config = {
    packageName: 'com.zhiliaoapp.musically',
    email: 'immemlwnh@tsbytlj.com',
    verifyCode: '993603',
    enableToast: false
};

// 吐司与日志
function showToast(msg) {
    if (config.enableToast) toast(msg);
    console.log(msg);
}

// 状态机核心
let currentState = STATES.CHECK_LAUNCH;

function step() {
    switch (currentState) {
        case STATES.CHECK_LAUNCH:
            if (currentPackage() !== config.packageName) {
                showToast('未检测到 TikTok，启动应用');
                app.launchPackage(config.packageName);
                sleep(3000);
            }
            currentState = STATES.HOME;
            break;

        case STATES.HOME:
            if (desc('Profile').exists()) {
                currentState = STATES.PROFILE;
            } else {
                showToast('未在首页检测到 Profile，尝试回退');
                printAllTexts();
                back(); sleep(1000);
            }
            break;

        case STATES.PROFILE:
            desc('Profile').click(); sleep(2000);

            if (text('Log in to TikTok').exists() && text('Use phone / email / username').exists()) {
                showToast('检测到登录界面，进入登录流程');
                currentState = STATES.LOGIN_FLOW;
            } else if (desc('Add another account').exists()) {
                showToast('已登录，进入退出流程');
                currentState = STATES.LOGOUT_FLOW;
            } else if (text('Use phone / email / username').exists()) {
                showToast('检测到注册界面或未知界面，打印界面文字');
                printAllTexts();
                sleep(2000);
            } else {
                showToast('无法判断当前状态，打印界面文字');
                printAllTexts();
                sleep(2000);
            }
            break;

        case STATES.LOGIN_FLOW:
            login();
            currentState = STATES.DONE;
            break;

        case STATES.LOGOUT_FLOW:
            logout();
            currentState = STATES.DONE;
            break;

        case STATES.DONE:
            showToast('所有流程完成');
            exit();
            break;
        default:
            showToast('无法判断当前状态，打印界面文字');
            printAllTexts();
            sleep(2000); // 等待你人工分析
            break;
    }
}

// 登录实现
function login() {
    showToast('执行登录');
    // 最多重试5次，每次等待1秒
    let retry = 5;
    while (retry-- > 0) {
        if (descContains('phone').exists() || textContains('phone').exists()) {
            // 兼容不同控件类型
            let btn = descContains('phone').findOne(2000) || textContains('phone').findOne(2000);
            if (btn) {
                btn.click(); sleep(1000);
                break;
            }
        }
        sleep(1000);
    }
    if (retry <= 0) {
        showToast('登录入口未找到，返回主页面');
        back(); sleep(1000);
        return;
    }
    // 下面继续填写邮箱、验证码等
    // ...
}

// 退出实现
function logout() {
    showToast('执行登出');
    // 尝试滚动查找"Settings and privacy"
    let setting = text("Settings and privacy").findOne(5000);
    if (setting) {
        setting.click(); sleep(500);
        // 继续后续操作
        if (text("Log out").exists()) {
            click("Log out"); sleep(1000);
            if (text("Log out").exists()) {
                click("Log out"); sleep(500);
            }
            showToast('登出完成');
        } else {
            showToast('未找到 Log out 按钮');
        }
    } else {
        showToast('未找到 Settings and privacy');
    }
}

function printAllTexts() {
    let allTexts = [];
    let nodes = className("android.widget.TextView").find();
    for (let i = 0; i < nodes.length; i++) {
        let t = nodes[i].text();
        if (t && t.trim()) allTexts.push(t.trim());
    }
    showToast("当前界面文字: " + allTexts.join(" | "));
    console.log("当前界面所有文字元素：\n" + allTexts.join("\n"));
}

// 主循环
console.show();
showToast('脚本启动 - 状态机模式');
while (true) {
    try {
        step();
    } catch (e) {
        console.error('出错:', e);
        showToast('发生异常，重试');
    }
    sleep(500);
}
