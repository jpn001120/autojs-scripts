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
            // 如果首页有“Profile”按钮，切换到 PROFILE
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
    }
}

// 登录实现
function login() {
    showToast('执行登录');
    // 最多重试5次，每次等待1秒
    for (let attempt = 1; attempt <= 5; attempt++) {
        showToast(`登录尝试 ${attempt}`);
        // 入口检测
        if (desc('Use phone / email / username').exists()) {
            desc('Use phone / email / username').click();
            sleep(1000);
        } else {
            showToast('未找到登录入口，返回主页面');
            back(); sleep(1000);
            continue;
        }
        // 选择Email登录
        if (text('Log in').exists() && desc('Email / Username').exists()) {
            desc('Email / Username').click();
            sleep(1000);
        } else {
            showToast('未检测到Email/Username选项');
            back(); sleep(1000);
            continue;
        }
        // 输入邮箱/用户名
        let emailField = id('com.zhiliaoapp.musically:id/eje').findOne(3000);
        if (emailField) {
            emailField.click(); sleep(500);
            emailField.setText(config.email);
            sleep(500);
            // 备用输入
            if (emailField.text() !== config.email) {
                console.log('setText 未生效，使用 shell 输入邮箱');
                shell('input text ' + config.email, true);
                sleep(500);
            }
        } else {
            showToast('未找到邮箱输入框');
            back(); sleep(1000);
            continue;
        }
        // 获取验证码
        let emailAddr = setShortid(config.email);
        toast('验证码请求已发送');
        // 点击 Continue
        if (text('Continue').exists()) {
            text('Continue').click(); sleep(1000);
        }
        // 拉取并输入验证码
        if (emailAddr) {
            config.verifyCode = getCode(emailAddr);
            console.log('验证码：', config.verifyCode);
        }
        if (config.verifyCode) {
            setText(config.verifyCode);
            sleep(3000);
            showToast('验证码输入完成');
            return;
        } else {
            showToast('验证码获取失败');
            back(); sleep(1000);
            continue;
        }
    }
    handleError('登录多次失败，退出流程');
}
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
