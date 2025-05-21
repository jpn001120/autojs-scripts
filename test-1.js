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
            // 如果首页有"Profile"按钮，切换到 PROFILE
            if (desc('Profile').exists()) {
                currentState = STATES.PROFILE;
            } else {
                showToast('未在首页检测到 Profile，尝试回退');
                back(); sleep(1000);
            }
            break;

        case STATES.PROFILE:
            // 点击 Profile
            desc('Profile').click(); sleep(2000);
            // 根据是否已登录决定下一步
            if (desc('Add another account').exists()) {
                showToast('未登录，进入登录流程');
                currentState = STATES.LOGIN_FLOW;
            } else {
                showToast('已登录，进入退出流程');
                currentState = STATES.LOGOUT_FLOW;
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
        sleep(1000);
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
    // 点击设置
    text('Settings and privacy').scrollIntoView(); sleep(500);
    click('Log out'); sleep(1000);
    click('Log out'); sleep(500);
    showToast('登出完成');
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
