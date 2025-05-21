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

function safeSetText(field, text, desc) {
    showToast(`尝试输入: ${desc}`);
    if (!field) {
        showToast(`输入失败: ${desc} 元素不存在`);
        return false;
    }

    field.click(); sleep(500);

    try {
        // 尝试清空原内容
        field.setText('');
        sleep(300);
        field.setText(text);
        sleep(500);
    } catch (e) {
        showToast(`setText异常: ${e}`);
    }

    // 检查是否成功
    if (field.text && field.text() === text) {
        showToast(`输入成功: ${desc}`);
        return true;
    }

    // 使用 shell input text 方式
    showToast(`setText失败，尝试shell输入: ${desc}`);
    field.click(); sleep(300);
    shellInputText(text);
    sleep(500);

    // 最后一次验证
    if (field.text && field.text() === text) {
        showToast(`shell输入成功: ${desc}`);
        return true;
    } else {
        showToast(`输入失败: ${desc}`);
        return false;
    }
}

// 替代方案：通过 shell 输入文本（兼容英文符号和空格）
function shellInputText(text) {
    let encoded = encodeURIComponent(text).replace(/%/g, '%25');
    shell(`input text "${encoded}"`, true);
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


// <--------------------- 邮箱验证码获取 开始 --------------------->


// 日志函数
function log(level, message) {
    let timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${level} - ${message}`;
    console.log(logMessage);
    try {
        files.append("/sdcard/tempmail_client.log", logMessage + "\n");
    } catch (e) {
        console.log(`日志写入失败: ${e.message}`);
    }
}

// 设置 shortid
function setShortid(shortid) {
    shortid = extractShortid(config.email);
    if (!shortid) {
        log("ERROR", "shortid 不能为空");
        return null;
    }
    try {
        log("INFO", `设置 shortid: ${shortid}`);
        let response = http.get(`http://1.95.133.57:3388/set_shortid?shortid=${shortid}`);
        if (response.statusCode !== 200) {
            log("ERROR", `设置 shortid 失败: HTTP ${response.statusCode}`);
            return null;
        }
        let data = response.body.json();
        if (data.error) {
            log("ERROR", `设置 shortid 失败: ${data.error}`);
            return null;
        }
        log("INFO", `邮箱设置成功: ${data.email}`);
        return data.email;
    } catch (e) {
        log("ERROR", `设置 shortid 失败: ${e.message}`);
        return null;
    }
}

// 获取验证码
function getCode(shortid, maxAttempts = 30, interval = 5000) {
    shortid = extractShortid(config.email);
    if (!shortid) {
        log("ERROR", "shortid 不能为空");
        return null;
    }
    log("INFO", `开始轮询验证码 for shortid: ${shortid}`);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            let response = http.get(`http://1.95.133.57:3388/get_code?shortid=${shortid}`);
            if (response.statusCode !== 200) {
                log("ERROR", `获取验证码失败: HTTP ${response.statusCode}`);
                sleep(interval);
                continue;
            }
            let data = response.body.json();
            if (data.error) {
                log("ERROR", `获取验证码失败: ${data.error}`);
                return null;
            }
            if (data.code) {
                log("INFO", `收到验证码: ${data.code} for 邮箱: ${data.email}`);
                toast(`验证码: ${data.code}`);
                return data.code;
            }
            log("INFO", `尝试 ${attempt}/${maxAttempts}: 未找到验证码`);
            sleep(interval);
        } catch (e) {
            log("ERROR", `获取验证码失败: ${e.message}`);
            sleep(interval);
        }
    }
    log("ERROR", `达到最大尝试次数 (${maxAttempts})，未找到验证码`);
    toast("未获取到验证码");
    return null;
}

// 提取 shortid
function extractShortid(email) {
    if (!email || typeof email !== 'string') {
        log("ERROR", "邮箱地址无效");
        return null;
    }
    try {
        // 使用 split 提取 shortid
        let parts = email.split('@');
        if (parts.length !== 2 || parts[1] !== 'tsbytlj.com') {
            log("ERROR", `邮箱格式错误: ${email}，预期格式为 <shortid>@tsbytlj.com`);
            return null;
        }
        let shortid = parts[0];
        log("INFO", `从邮箱 ${email} 提取 shortid: ${shortid}`);
        return shortid;
    } catch (e) {
        log("ERROR", `提取 shortid 失败: ${e.message}`);
        return null;
    }
}