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
    email: 'x-uz0uh7w@tsbytlj.com',
    password: '98UWv8Rw4xuDG.',
    verifyCode: '',
    enableToast: true // 控制是否显示 toast
};

// 统一日志函数
function log(message) {
    console.log(message);
    if (config.enableToast) toast(message);
}

// 封装安全点击
function safeClick(selector, desc, timeout = 3000) {
    log(`尝试点击: ${desc}`);
    let el = selector.findOne(timeout);
    if (el && el.enabled()) {
        el.click();
        log(`点击成功: ${desc}`);
        return true;
    } else {
        log(`点击失败: ${desc}`);
        return false;
    }
}

// 通用点击函数：只需指定一个选择器值（text/desc/id）
function universalClick(identifier, desc, timeout = 3000) {
    log(`尝试点击: ${desc}`);
    let el = text(identifier).findOne(timeout)
        || desc(identifier).findOne(timeout)
        || id(identifier).findOne(timeout);
    if (!el) {
        log(`未找到元素: ${desc}`);
        return false;
    }
    if (el.clickable()) {
        el.click();
        log(`点击成功: ${desc}`);
        return true;
    }
    try {
        let bounds = el.bounds();
        click(bounds.centerX(), bounds.centerY());
        log(`使用坐标点击: ${desc}`);
        return true;
    } catch (e) {
        log(`点击异常: ${e}`);
        return false;
    }
}
function depthSelector(depth) {
    return selector().depth(depth);
}

// 打印控件树的递归函数
function printUIInfo(node, depth = 0) {
    if (!node) return;
    let prefix = "  ".repeat(depth);
    let info = `${prefix}${node.className()}  [text="${node.text()}", id="${node.id()}", desc="${node.desc()}"]`;
    console.log(info);

    let children = node.children();
    for (let i = 0; i < children.length; i++) {
        printUIInfo(children[i], depth + 1);
    }
}
// 封装安全输入
function safeSetText(field, text, desc) {
    log(`尝试输入: ${desc}`);
    try {
        field.click(); sleep(500);
        field.setText(text); sleep(500);
        if (field.text && field.text() === text) {
            log(`输入成功: ${desc}`);
            return true;
        }
    } catch (e) {
        log(`setText异常: ${e}`);
    }
    // 兜底 - 模拟输入
    log(`setText失败，尝试模拟输入: ${desc}`);
    try {
        let b = field.bounds();
        click(b.centerX(), b.centerY()); sleep(500);
    } catch (_) {
        log('无法点击控件中心，使用预设位置点击');
        click(500, 1200); sleep(500); // 你也可以传参决定坐标
    }
    setClip(text); sleep(300);
    shell("input keyevent 279", true); sleep(500);
    shell(`input text ${text}`, true); sleep(500);
    return true; // 不再强校验内容，因 TikTok 会隐藏内容
}

// 打印所有文字
function printAllTexts() {
    let nodes = className('android.widget.TextView').find();
    let texts = nodes.map(n => n.text() && n.text().trim()).filter(t => t);
    log('界面文字: ' + texts.join(' | '));
    console.log('界面文字列表:\n' + texts.join('\n'));
}

// 重试辅助函数
function retryAction(action, maxAttempts = 3, interval = 1000) {
    for (let i = 1; i <= maxAttempts; i++) {
        if (action()) return true;
        log(`尝试 ${i}/${maxAttempts} 失败，重试`);
        sleep(interval);
    }
    return false;
}

// 错误处理函数
function handleError(message) {
    log(message);
    back(); sleep(1000);
}

// 登录实现
function login() {
    log('开始登录流程');
    printAllTexts(); // 记录初始界面状态

    // 步骤1：点击“Use phone / email / username”
    if (!retryAction(() => safeClick(desc('Use phone / email / username'), 'Use phone/email 按钮'), 3)) {
        return handleError('无法进入登录界面');
    }
    sleep(1000);

    // 步骤2：点击“Email / Username”
    if (!retryAction(() => safeClick(desc('Email / Username'), 'Email/Username 按钮'), 3)) {
        return handleError('无法选择邮箱登录');
    }
    sleep(1000);

    // 步骤3：输入邮箱并点击“Continue”
    setClip(config.email); sleep(300);
    click(471, 1358); sleep(800); // 粘贴邮箱
    // 获取根节点（UI 控件树的顶层）
    // 尝试查找任意可见节点作为起点
    // console.log("准备调用 selector().findOne()");
    // let rootNode = selector().findOne(5000);  // 最多等待 5 秒
    // console.log("selector().findOne() 调用完毕");
    // if (rootNode) {
    //     printUIInfo(rootNode);
    // } else {
    //     console.error("未能获取到控件树！");
    // }
    // 找到文本为 "Continue" 的 Button 并点击
    back();sleep(2000)
    let btn = text("Continue").className("android.widget.Button").findOne(5000);
    if (btn) {
        btn.click();
        console.log("点击了 Continue 按钮");
    } else {
        console.error("未找到 Continue 按钮");
    }
    sleep(1000);

    // 步骤4：获取并输入验证码
    let shortid = extractShortid(config.email);
    if (shortid) {
        config.verifyCode = getCode(shortid);
        log('拉取到验证码: ' + config.verifyCode);
    }
    let codeField = desc('Type in code').findOne(3000);
    if (codeField && config.verifyCode) {
        safeSetText(codeField, config.verifyCode, '验证码输入框');
        sleep(5000); // 等待验证码验证
    } else {
        return handleError('未找到验证码输入框或未获取到验证码');
    }

    // 步骤5：处理“Verify it’s really you”界面
    if (text('Verify it’s really you').exists()) {
        click(471, 666); sleep(1000); // 点击验证按钮
        let passwordField = className('android.widget.EditText').findOne(5000);
        if (passwordField && safeSetText(passwordField, config.password, '密码输入框')) {
            sleep(800);
            if (!retryAction(() => universalClick('Next', 'Next 按钮'), 3)) {
                return handleError('无法提交密码');
            }
        } else {
            return handleError('未找到密码输入框');
        }
    }

    // 检查登录是否成功
    if (desc('Profile').findOne(5000)) {
        log('登录成功');
        printAllTexts(); // 记录登录后界面状态
    } else {
        return handleError('登录失败，未能进入Profile界面');
    }
}

// 退出实现
function logout() {
    log('开始登出流程');
    let settingBtn = text('Settings and privacy').scrollIntoView(3000);
    if (!settingBtn) { log('未找到 Settings and privacy'); return; }
    settingBtn.click(); sleep(1000);
    if (safeClick(text('Log out'), 'Log out 按钮')) {
        sleep(500);
        safeClick(text('Log out'), '确认 Log out 按钮');
        log('登出完成');
    }
}

// 邮箱验证码获取相关函数
function extractShortid(email) {
    if (!email || typeof email !== 'string') {
        log("ERROR", "邮箱地址无效");
        return null;
    }
    try {
        let parts = email.split('@');
        if (parts.length !== 2 || parts[1] !== 'tsbytlj.com') {
            log("ERROR", `邮箱格式错误: ${email}，预期格式为 <shortid>@tsbytlj.com`);
            return null;
        }
        return parts[0];
    } catch (e) {
        log("ERROR", `提取 shortid 失败: ${e.message}`);
        return null;
    }
}

function getCode(shortid, maxAttempts = 30, interval = 5000) {
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

// 状态机核心
let currentState = STATES.CHECK_LAUNCH;

function step() {
    switch (currentState) {
        case STATES.CHECK_LAUNCH:
            log('状态: CHECK_LAUNCH');
            if (currentPackage() !== config.packageName) {
                log('未检测到 TikTok，启动应用');
                app.launchPackage(config.packageName);
                sleep(3000);
            }
            currentState = STATES.HOME;
            break;

        case STATES.HOME:
            log('状态: HOME');
            if (desc('Profile').exists()) {
                currentState = STATES.PROFILE;
            } else {
                log('HOME: 未检测到 Profile 按钮，回退');
                back(); sleep(1000);
            }
            break;

        case STATES.PROFILE:
            log('状态: PROFILE');
            safeClick(desc('Profile'), 'Profile 按钮'); sleep(2000);
            if (text('Log in to TikTok').exists() && desc('Use phone / email / username').exists()) {
                log('检测到登录界面');
                currentState = STATES.LOGIN_FLOW;
            } else if (desc('Add another account').exists()) {
                log('检测到已登录状态，点击 Add another account');
                safeClick(desc('Add another account'), 'Add another account 按钮');
                sleep(1500);
                currentState = STATES.LOGIN_FLOW;
            } else if (text('Settings and privacy').exists()) {
                log('检测到已登录状态，准备登出');
                currentState = STATES.LOGOUT_FLOW;
            } else {
                log('PROFILE: 未识别界面，打印文字');
                printAllTexts(); sleep(2000);
            }
            break;

        case STATES.LOGIN_FLOW:
            log('状态: LOGIN_FLOW');
            login();
            currentState = STATES.DONE;
            break;

        case STATES.LOGOUT_FLOW:
            log('状态: LOGOUT_FLOW');
            logout();
            currentState = STATES.DONE;
            break;

        case STATES.DONE:
            log('状态: DONE，脚本结束');
            exit();
            break;

        default:
            log('未知状态，退出');
            exit();
    }
}

// 主循环
console.show();
log('脚本启动 - 状态机模式');
while (true) {
    try { step(); } catch (e) { console.error(e); log('脚本异常，重试'); }
    sleep(500);
}