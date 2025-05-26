// TikTok 自动化脚本 - 基于状态机的流程管理
// 1. 定义各个状态
const STATES = {
    CHECK_LAUNCH: 'CHECK_LAUNCH',
    HOME: 'HOME',
    PROFILE: 'PROFILE',
    LOGIN_FLOW: 'LOGIN_FLOW',
    LOGOUT_FLOW: 'LOGOUT_FLOW',
    EDIT_PROFILE: 'EDIT_PROFILE',    // 编辑资料
    UPLOAD_VIDEO: 'UPLOAD_VIDEO',    // 上传视频
    DONE: 'DONE'
};

// 配置
const config = {
    packageName: 'com.zhiliaoapp.musically',
    email: 'x-uz0uh7w@tsbytlj.com',
    password: '98UWv8Rw4xuDG.',
    verifyCode: '',
    enableToast: true, // 控制是否显示 toast
    
    // 新增配置
    features: {
        editProfile: {
            enabled: true,           // 是否启用资料修改
            nickname: 'wqnmd008',      // 新昵称（可选）
            bio: 'follow me for every day',          // 新简介（可选）
            avatar: 'https://raw.githubusercontent.com/jpn001120/autojs-scripts/main/1.png'  // 新头像路径（可选）
        },
        uploadVideo: {
            enabled: true,           // 是否启用视频上传
            videoUrl: 'https://raw.githubusercontent.com/jpn001120/autojs-scripts/main/topmodel.mp4';  // 视频文件路径
            descirption:'funny day'
        }
    }
};

// 统一日志函数
function log(message) {
    console.log(message);
    if (config.enableToast) toast(message);
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
    log(printAllTexts);
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

    // 步骤1：点击"Use phone / email / username"
    if (!retryAction(() => safeClickByText('Use phone / email / username'), 3)) {
        return handleError('无法进入登录界面');
    }
    sleep(1000);

    // 步骤2：点击"Email / Username"
    if (!retryAction(() => safeClickByText('Email / Username'), 3)) {
        return handleError('无法选择邮箱登录');
    }
    sleep(1000);

    // 步骤3：输入邮箱并点击"Continue"
    setClip(config.email); sleep(300);
    click(471, 1358); sleep(800); // 粘贴邮箱
    let shortid = extractShortid(config.email);

    setShortid(shortid);
    back();sleep(2000);
    click(480,1998);sleep(1000)
    if (shortid) {
        config.verifyCode = getCode(shortid);
        log('拉取到验证码: ' + config.verifyCode);
    }
    let codeField = desc('Type in code').findOne(3000);
    if (codeField && config.verifyCode) {
        safeSetText(codeField, config.verifyCode, '验证码输入框');
    } else {
        return handleError('未找到验证码输入框或未获取到验证码');
    }

    sleep(1666)
    safeClickByText('Password'); sleep(1000); // 点击验证按钮
    safeClickByText('Next');  sleep(1000); // 点击next

    let passwordField = className('EditText').findOne(5000);
    if (passwordField && safeSetText(passwordField, config.password, '密码输入框')) {
        sleep(800);
        if (!retryAction(() => universalClick('Next', 'Next 按钮'), 3)) {
            return handleError('无法提交密码');
        }
    } else {
        return handleError('未找到密码输入框');
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
    // desc('Profile menu')


    let settingBtn = text('Settings and privacy').scrollIntoView(3000);
    if (!settingBtn) { log('未找到 Settings and privacy'); return; }
    settingBtn.click(); sleep(1000);
    if (clickNearestClickable('Log out')) {
        sleep(500);
        clickNearestClickable('Log out');
        log('登出完成');
    }
}
function safeClickByText(txt) {
    let obj = text(txt).findOne(3000);
    if (!obj) {
        toast("未找到文本控件: " + txt);
        return false;
    }

    if (obj.clickable()) {
        return obj.click();
    } else {
        let clickableParent = obj;
        while (clickableParent && !clickableParent.clickable()) {
            clickableParent = clickableParent.parent();
        }
        if (clickableParent) {
            return clickableParent.click();
        } else {
            let b = obj.bounds();
            return click(b.centerX(), b.centerY());
        }
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
/**
 * 点击指定文本控件的最近可点击父节点
 * @param {string} textToFind - 控件上显示的文字
 * @returns {boolean} 是否点击成功
 */
function clickNearestClickable(textToFind) {
    let node = text(textToFind).findOne(3000); // 最多等3秒
    if (!node) {
        toast("未找到文本: " + textToFind);
        return false;
    }

    // 向上找最近可点击的父节点
    let clickableNode = node;
    while (clickableNode && !clickableNode.clickable()) {
        clickableNode = clickableNode.parent();
    }

    if (clickableNode) {
        toast("找到可点击父节点，正在点击...");
        return clickableNode.click();
    } else {
        // 如果没有可点击控件，则降级用坐标点击
        toast("未找到 clickable 父节点，使用坐标点击");
        let bounds = node.bounds();
        return click(bounds.centerX(), bounds.centerY());
    }
}
// 资料修改模块
function editProfile() {
    log('开始修改资料流程');
    
    // 1. 打开app 如果已经打开了就关闭再打开
    log('检查并启动TikTok应用');
    if (currentPackage() === config.packageName) {
        log('TikTok已运行，先关闭应用');
        app.launchPackage(config.packageName);
        sleep(2000);
        back();
        sleep(1000);
    }
    log('启动TikTok应用');
    app.launchPackage(config.packageName);
    sleep(3000);

    // 2. 点击profile
    log('点击个人资料按钮');
    if (!retryAction(() => (clickNearestClickable('Profile')), 3)) {
        return handleError('无法进入个人资料页面');
    }
    sleep(2000);

    // 3. 判断是否已经登录 如果没登录 就执行登录
    log('检查登录状态');
    if (text('Log in to TikTok').exists()) {
        log('未登录，执行登录流程');
        login();
        log('点击个人资料按钮');
        if (!retryAction(() => (clickNearestClickable('Profile')), 3)) {
            return handleError('无法进入个人资料页面');
        }

    } else {
        log('已登录状态');
    }
    sleep(2000);

    // 4. 点击Set up profile
    log('点击设置资料按钮');
    if (!retryAction(() => clickNearestClickable('Edit profile'), 3)) {
        return handleError('无法进入资料设置页面');
    }
    sleep(2000);

    // 修改昵称
    // if (config.features.editProfile.nickname) {
    //     log('开始修改昵称');
    //     // 5. 点击Name进入昵称编辑页面
    //     log('点击Name进入昵称编辑页面');
    //     if (!retryAction(() => clickNearestClickable('Name'), 3)) {
    //         return handleError('无法进入昵称编辑页面');
    //     }
    //     sleep(2000);

    //     // 6. 修改昵称
    //     log('开始输入新昵称: ' + config.features.editProfile.nickname);
    //     let nicknameField = id('com.zhiliaoapp.musically:id/eu1').findOne(3000);
    //     if (nicknameField) {
    //         nicknameField.setText('');
    //         sleep(500);
    //         nicknameField.setText(config.features.editProfile.nickname);
    //         log('昵称输入完成');
    //     } else {
    //         return handleError('未找到昵称输入框');
    //     }
    //     sleep(1000);

    //     // 7. 保存昵称
    //     log('点击保存昵称');
    //     if (!retryAction(() => clickNearestClickable('Save'), 3)) {
    //         return handleError('无法保存昵称');
    //     }
    //     sleep(4000);
    //     // confirm
    //     log('点击确认');
    //     if (!retryAction(() => clickNearestClickable('Confirm'), 3)) {
    //         return handleError('无法确认昵称修改');
    //     }
    //     sleep(1000);
    //     log('昵称修改完成');

    //     // 关闭app
    //     back();
    //     sleep(1000);

    // }

    // // 修改简介
    // if (config.features.editProfile.bio) {
        
    //     // 5. 点击Bio进入简介编辑页面
    //     log('点击Bio进入简介编辑页面');
    //     if (!retryAction(() => clickNearestClickable('Bio'), 3)) {
    //         return handleError('无法进入简介编辑页面');
    //     }
    //     sleep(2000);

    //     // 6. 修改简介
    //     log('开始输入新简介: ' + config.features.editProfile.bio);
    //     let bioField = id('com.zhiliaoapp.musically:id/eu1').findOne(3000);
    //     if (bioField) {
    //         bioField.setText('');
    //         sleep(500);
    //         bioField.setText(config.features.editProfile.bio);
    //         log('简介输入完成');
    //     } else {
    //         return handleError('未找到简介输入框');
    //     }
    //     sleep(1000);

    //     // 7. 保存简介
    //     log('点击保存简介');
    //     if (!retryAction(() => clickNearestClickable('Save'), 3)) {
    //         return handleError('无法保存简介');
    //     }
    //     log('简介修改完成');
    //     sleep(2000);
    //     back();
    //     sleep(1000);
    // }

    // 修改头像
    if (config.features.editProfile.avatar) {
        log('开始修改头像');
        
        // 0. 下载头像图片
        log('开始下载头像图片 ');
        let avatarPath = '/sdcard/Download/avatar.png';
        
        try {
            let response = http.get(config.features.editProfile.avatar);
            if (response.statusCode === 200) {
                files.writeBytes(avatarPath, response.body.bytes());
                log('头像下载完成: ' + avatarPath);
            } else {
                return handleError('头像下载失败');
            }
        } catch (e) {
            return handleError('头像下载异常: ' + e);
        }
        sleep(1000);
        // 扫描通知媒体库
        let Uri = android.net.Uri;
        let Intent = android.content.Intent;
        let uri = Uri.fromFile(new java.io.File(avatarPath));
        let intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, uri);
        context.sendBroadcast(intent);
        toast("头像下载完成并通知媒体库");
        // 4. 点击头像 text('Change photo')
        log('点击当前头像');
        if (!retryAction(() => clickNearestClickable('Change photo'), 3)) {
            return handleError('无法进入更换照片页面');
        }
        sleep(2000);

        // 5. 点击Change photo
        log('点击更换照片按钮');
        if (!retryAction(() => clickNearestClickable('Select from Gallery'), 3)) {
            return handleError('无法进入更换照片页面');
        }
        sleep(2000);

        // 6. 点击ALLOW
        log('点击允许权限按钮');
        if (!retryAction(() => clickNearestClickable('ALLOW ALL'), 1)) {
            // return handleError('无法授予权限');
            log('yes allow all already!')
        }
        sleep(2000);

        // 7. 点击左上角第一个
        log('id 选中左上角第一个图片');
        id('h5l').findOne().click();
        sleep(2000);

        log('点击Next');
        if (!retryAction(() => clickNearestClickable('Next'), 3)) {
            return handleError('无法授予权限');
        }
        sleep(2000);

        log('save post'); //text('Save & post')
        if (!retryAction(() => clickNearestClickable('Save & post'), 3)) {
            return handleError('无法授予权限');
        }
        sleep(2000);

        log('save post'); //text('Save & post') centerX(480).centerY(1986)
        if (!retryAction(() => clickNearestClickable('Save & post'), 3)) {
            return handleError('无法授予权限');
        }
        sleep(5000);

        // 删除avatarPath图片
        // 检查文件是否存在
        if (files.exists(avatarPath)) {
            files.remove(avatarPath);
            log("图片已删除");
        } else {
            log("文件不存在");
        }

        log('头像修改完成');
    }

    log('所有资料修改完成');
    // 退出app
    log('退出TikTok应用');
    back();
    sleep(1000);
    back();
    sleep(1000);
    back();
    sleep(1000);
}

function downloadFile(url, path) {
    let r = http.get(url);
    if (r.statusCode === 200) {
        files.writeBytes(path, r.body.bytes());
        log('视频下载完成：' + path);

        // 通知媒体库更新
        mediaScan(path);
        return true
    } else {
        log('下载失败，状态码：' + r.statusCode);
        return false
    }
}

// 通知系统媒体库刷新，让系统相册等能看到新视频
function mediaScan(filePath) {
    log('通知媒体库刷新' + filePath)
    let Uri = android.net.Uri;
        let Intent = android.content.Intent;
        let uri = Uri.fromFile(new java.io.File(filePath));
        let intent = new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, uri);
        context.sendBroadcast(intent);
}
function restartApp(packageName) {

    // 1. 打开app 如果已经打开了就关闭再打开
    log('检查并启动TikTok应用');
    if (currentPackage() === config.packageName) {
        log('正在重启应用：' + packageName);

        // 强制停止
        let result = shell('am force-stop ' + packageName, true);
        if (result.code === 0) {
            log('已使用 shell 强制停止应用');
        } else {
            log('shell 强制停止失败，回退使用多次 back 方式');
            // 退回桌面并多次 back
            for (let i = 0; i < 5; i++) {
                back();
                sleep(300);
            }
            home();
        }
    }    

    sleep(1000);
    log('重新启动应用...');
    app.launchPackage(packageName);
    sleep(3000);
}

// 视频上传模块
function uploadVideo() {
    console.log(`
2025年05月26日15:32:22


`);
        
    if (config.features.uploadVideo.videoUrl) {

        // restartApp(config.packageName);
        // 0. 下载视频
        log('正在下载视频');
        // 下载视频并保存到本地
        let url = 'https://raw.githubusercontent.com/jpn001120/autojs-scripts/main/topmodel.mp4';
        let savePath = '/sdcard/Download/topmodel.mp4';

        if(!downloadFile(config.features.uploadVideo.videoUrl, savePath)){
            return handleError('无法下载视频');
        };


        log('开始上传视频');
    
        // 1. 点击发布按钮
        log('点击发布按钮')
        if (!retryAction(() => desc('Create').findOne(2000).click(), 3)) {
            return handleError('无法进入发布页面');
        }
        sleep(1000);
        
        // 
        log('WHILE USING THE APP 权限允许判断')
        auto.waitFor();
        sleep(2000);
        let allowButton = text("WHILE USING THE APP").findOne(5000); // 等待最多5秒
        if (allowButton) {
            allowButton.click();
            log("已点击 'WHILE USING THE APP' 按钮");
        } else {
            log("未找到 'WHILE USING THE APP' 按钮");
        }
        

        // 2. 选择视频
        if (!retryAction(() => clickNearestClickable('Upload'), 3)) {
            return handleError('无法进入上传页面');
        }
        sleep(1000);

        // 3. 选择视频文件
        // 这里需要实现文件选择逻辑...

        // 4. 等待上传完成
        // 这里需要实现上传进度检测逻辑...

        log('视频上传完成');


    }else{
        log('上传视频失败,没有视频信息')
    }
    
}

// 状态机核心
let currentState = STATES.CHECK_LAUNCH;

function step() {
    log('状态机判断中...');
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
            clickNearestClickable('Profile'); sleep(2000);
            if (text('Log in to TikTok').exists() && desc('Use phone / email / username').exists()) {
                log('检测到登录界面');
                currentState = STATES.LOGIN_FLOW;
            } else if (desc('Add another account').exists()) {
                log('检测到已登录状态，点击 Add another account');
                clickNearestClickable('Add another account');
                sleep(1500);
                currentState = STATES.LOGIN_FLOW;
            } else if (text('Settings and privacy').exists()) {// 待完善
                log('检测到已登录状态，准备登出');
                currentState = STATES.LOGOUT_FLOW;
            } else {
                log('PROFILE: 未识别界面，打印文字');
                printAllTexts(); sleep(2000);
            }
            sleep(5000)
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

        case STATES.EDIT_PROFILE:
            log('状态: EDIT_PROFILE');
            if (config.features.editProfile.enabled) {
                editProfile();
            }
            currentState = STATES.DONE;
            break;

        case STATES.UPLOAD_VIDEO:
            log('状态: UPLOAD_VIDEO');
            if (config.features.uploadVideo.enabled) {
                uploadVideo();
            }
            currentState = STATES.DONE;
            break;

        case STATES.DONE:
            log('状态: DONE，脚本结束');
            // exit(); // 好像会报错
            break;

        default:
            log('未知状态，退出');
            // exit();
    }
}

// 主函数
function main() {
    console.show();
    log('脚本启动 - 默认执行修改资料功能');
    
    // 设置默认功能
    config.features.editProfile.enabled = false;
    config.features.uploadVideo.enabled = true;
    
    // 设置初始状态为检查启动
    currentState = STATES.UPLOAD_VIDEO;
    
    // 启动主循环
    while (true) {
        try { 
            console.log('程序启动');
            step(); 
        } catch (e) { 
            console.error(e); 
            log('脚本异常，重试'); 
            sleep(500000);
        }
        sleep(500);
    }
    // editProfile();
}

// 启动脚本
main();