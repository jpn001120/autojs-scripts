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

// 封装安全点击
function safeClick(selector, desc, timeout = 3000) {
    showToast(`尝试点击: ${desc}`);
    let el = selector.findOne(timeout);
    if (el && el.enabled()) {
        el.click();
        showToast(`点击成功: ${desc}`);
        return true;
    } else {
        showToast(`点击失败: ${desc}`);
        return false;
    }
}

// 封装安全输入
function safeSetText(field, text, desc) {
    showToast(`尝试输入: ${desc}`);
    field.click(); sleep(500);
    field.setText(text);
    sleep(500);
    if (field.text && field.text() === text) {
        showToast(`输入成功: ${desc}`);
        return true;
    } else {
        showToast(`setText未生效: ${desc}`);
        shell(`input text ${text}`, true);
        sleep(500);
        if (field.text && field.text() === text) {
            showToast(`shell输入成功: ${desc}`);
            return true;
        } else {
            showToast(`输入失败: ${desc}`);
            return false;
        }
    }
}

// 状态机核心
let currentState = STATES.CHECK_LAUNCH;

function step() {
    switch (currentState) {
        case STATES.CHECK_LAUNCH:
            showToast('状态: CHECK_LAUNCH');
            if (currentPackage() !== config.packageName) {
                showToast('未检测到 TikTok，启动应用');
                app.launchPackage(config.packageName);
                sleep(3000);
            }
            currentState = STATES.HOME;
            break;

        case STATES.HOME:
            showToast('状态: HOME');
            if (desc('Profile').exists()) {
                currentState = STATES.PROFILE;
            } else {
                showToast('HOME: 未检测到 Profile 按钮，回退');
                back(); sleep(1000);
            }
            break;

        case STATES.PROFILE:
            showToast('状态: PROFILE');
            safeClick(desc('Profile'), 'Profile 按钮'); sleep(2000);
            if (text('Log in to TikTok').exists() && desc('Use phone / email / username').exists()) {
                showToast('检测到登录界面');
                currentState = STATES.LOGIN_FLOW;
            } else if (desc('Add another account').exists()) {
                showToast('检测到已登录状态');
                currentState = STATES.LOGOUT_FLOW;
            } else {
                showToast('PROFILE: 未识别界面，打印文字');
                printAllTexts(); sleep(2000);
            }
            break;

        case STATES.LOGIN_FLOW:
            showToast('状态: LOGIN_FLOW');
            login();
            currentState = STATES.DONE;
            break;

        case STATES.LOGOUT_FLOW:
            showToast('状态: LOGOUT_FLOW');
            logout();
            currentState = STATES.DONE;
            break;

        case STATES.DONE:
            showToast('状态: DONE，脚本结束');
            exit();
            break;

        default:
            showToast('未知状态，退出');
            exit();
    }
}

// 登录实现
function login() {
    showToast('开始登录流程');
    for (let attempt = 1; attempt <= 5; attempt++) {
        showToast(`登录尝试 ${attempt}`);
        // 入口
        if (!safeClick(desc('Use phone / email / username'), 'Use phone/email 按钮')) continue;
        sleep(1000);
        if (!safeClick(desc('Email / Username'), 'Email/Username 按钮')) continue;
        sleep(1000);
        let emailField = id('com.zhiliaoapp.musically:id/eje').findOne(3000);
        if (!emailField) { showToast('未找到邮箱输入框'); back(); sleep(1000); continue; }
        if (!safeSetText(emailField, config.email, '邮箱输入框')) continue;
        let emailAddr = setShortid(config.email);
        showToast('短ID 设置: ' + emailAddr);
        safeClick(text('Continue'), 'Continue 按钮'); sleep(1000);
        if (emailAddr) {
            config.verifyCode = getCode(emailAddr);
            showToast('拉取到验证码: ' + config.verifyCode);
        }
        let codeField = className('android.widget.EditText').findOne(3000);
        if (config.verifyCode && codeField && safeSetText(codeField, config.verifyCode, '验证码输入框')) {
            sleep(3000);
            showToast('登录完成');
            return;
        }
        showToast('本次尝试失败，回退'); back(); sleep(1000);
    }
    handleError('登录多次失败');
}

// 退出实现
function logout() {
    showToast('开始登出流程');
    let settingBtn = text('Settings and privacy').scrollIntoView(3000);
    if (!settingBtn) { showToast('未找到 Settings and privacy'); return; }
    settingBtn.click(); sleep(1000);
    if (safeClick(text('Log out'), 'Log out 按钮')) {
        sleep(500);
        safeClick(text('Log out'), '确认 Log out 按钮');
        showToast('登出完成');
    }
}

// 打印所有文字
function printAllTexts() {
    let nodes = className('android.widget.TextView').find();
    let texts = nodes.map(n => n.text() && n.text().trim()).filter(t => t);
    showToast('界面文字: ' + texts.join(' | '));
    console.log('界面文字列表:\n' + texts.join('\n'));
}

// 主循环
console.show();
showToast('脚本启动 - 状态机模式');
while (true) {
    try { step(); } catch (e) { console.error(e); showToast('脚本异常，重试'); }
    sleep(500);
}

// 省略邮箱验证码相关函数（同上）