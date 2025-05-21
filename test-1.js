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
    // 选择邮箱手机登录
    text('Use phone / email / username').click(); sleep(1000);

    // 选择邮箱登录 如果含有text('Log in') 和 desc('Email / Username') 点击 desc('Email / Username')
    if (text('Log in').exists() && desc('Email / Username').exists()) { 
        desc('Email / Username').click(); sleep(1000);
    }else{
        showToast('登录入口未找到，返回主页面');
        back(); sleep(1000);
    }

    // 在id("hem").findOne()的输入框里输入邮箱 config.email
    id("hem").findOne().setText(config.email); sleep(1000);

    // 异步执行等待验证码的方法 邮箱为config.email
    email = setShortid(config.email);
    // 点击continue按钮
    text('Continue').click();sleep(1000);

    if(email){
        config.verifyCode = getCode(email);
    }

    
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


// <--------------------- 邮箱验证码获取 开始 --------------------->
const SERVER_URL = "http://1.95.133.57:3388";

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
        let response = http.get(`${SERVER_URL}/set_shortid?shortid=${shortid}`);
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
            let response = http.get(`${SERVER_URL}/get_code?shortid=${shortid}`);
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