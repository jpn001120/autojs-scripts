
// 等待无障碍服务
auto.waitFor();
console.log("无障碍服务已启动");
toast("无障碍服务已启动");

// 定义配置
var config = {
    packageName: "com.zhiliaoapp.musically",
    email: "immemlwnh@tsbytlj.com",
    verifyCode: "993603",
    enableToast: false
};

// toast统一管理函数
function showToast(message) {
    if (config.enableToast) {
        toast(message);
    }
    // 保持console日志输出
    console.log(message);
}

// 通用错误处理函数
function handleError(message) {
    console.error("错误：" + message);
    showToast("错误：" + message);
    // 确保TikTok被关闭
    // closeTikTok();
    // 退出脚本
    exit();
}

// 打开TikTok
function openTikTok() {
    showToast("准备打开TikTok...");
    app.launchPackage(config.packageName);
    showToast("TikTok已启动");
}

function closeTikTok() {
    // 判断当前正在运行的应用是否是 TikTok
    if (currentPackage() !== config.packageName) {
        showToast("TikTok 没有在运行，无需关闭");
        console.log("当前运行包：" + currentPackage());
        return;
    }

    showToast("尝试关闭 TikTok...");
    app.openAppSetting(config.packageName);
    sleep(2000);
    
    let stopBtn = textContains("FORCE STOP").findOne(5000);
    if (stopBtn && stopBtn.enabled()) {
        stopBtn.click();
        showToast("点击 FORCE STOP");
        sleep(1000);

        let confirmBtn = textContains("OK").findOne(3000);
        if (confirmBtn) {
            confirmBtn.click();
            showToast("TikTok 已成功关闭");
        } else {
            showToast("未找到确认按钮");
        }
    } else {
        showToast("未找到 FORCE STOP 按钮");
    }

    back();
    sleep(1000);
    back();
}


// 点击屏幕中间
function clickScreenCenter() {
    showToast("准备点击屏幕中间...");
    let x = device.width / 2;
    let y = device.height / 2;
    click(x, y);
    showToast("已点击屏幕中间");
}

// 点击Profile
function clickProfile() {
    showToast("查找Profile按钮...");
    let profileBtn = desc("Profile").findOne(5000);
    if (!profileBtn) {
        handleError("未找到Profile按钮，退出脚本");
        return;
    }
    showToast("找到Profile按钮");
    profileBtn.click();
    sleep(2000);
}

// 添加按钮查找工具函数
function logAllButtons() {
    console.log("=== 开始打印所有按钮信息 ===");
    let btns = className("android.widget.Button").find();
    console.log("找到 " + btns.length + " 个按钮");
    
    for (let i = 0; i < btns.length; i++) {
        let btn = btns[i];
        console.log("按钮 " + (i + 1) + ":");
        console.log("- 文本: " + btn.text());
        console.log("- 描述: " + btn.desc());
        console.log("- ID: " + btn.id());
        console.log("- 位置: " + btn.bounds());
        console.log("- 可点击: " + btn.clickable());
        console.log("------------------------");
    }
    console.log("=== 按钮信息打印完成 ===");
}

// 添加带超时的元素查找函数
function findElementWithTimeout(selector, timeout, description) {
    showToast("查找" + description + "...");
    let element = selector.findOne(timeout);
    
    if (!element) {
        console.error(description + "查找超时（" + timeout + "ms）");
        showToast(description + "查找超时，打印所有按钮信息");
        logAllButtons();
        console.log(description + "未找到，退出脚本");
        return null;
    }
    
    showToast("找到" + description);
    return element;
}

// 修改检查登录状态函数
function checkLoginStatus() {
    showToast("检查是否已登录...");
    
    let profileMenu = findElementWithTimeout(
        desc("Profile"),
        2000,
        "Profile菜单"
    );
    
    if (profileMenu) {
        showToast("检测到已登录");
        return true;
    } else {
        showToast("未检测到登录状态");
        return false;
    }
}

// 退出登录流程
function logout() {
    showToast("开始退出登录流程");
    
    // 查找Profile按钮
    let profileBtn = findElementWithTimeout(
        desc("Profile"),
        5000,
        "Profile按钮"
    );
    if (!profileBtn) return;
    profileBtn.click();
    sleep(1000);

    // 点击空白处
    click(720,300);
    sleep(1000);
    click(720,300);
    sleep(1000);

    // 查找Profile menu按钮
    let profileMenuBtn = findElementWithTimeout(
        className("android.widget.Button").desc("Profile menu"),
        5000,
        "Profile menu按钮"
    );
    if (!profileMenuBtn) return;
    click(671, 82);
    sleep(1000);

    // 查找Settings按钮
    let settingsBtn = findElementWithTimeout(
        text("Settings and privacy"),
        5000,
        "Settings and privacy按钮"
    );
    if (!settingsBtn) return;
    click(396, 1276);
    sleep(1000);

    // 滑动到底部
    showToast("滑动到底部...");
    for (let i = 0; i < 3; i++) {
        swipe(device.width / 2, device.height * 0.8,
              device.width / 2, device.height * 0.2,
              300);
        sleep(500);
    }

    // 查找Log out按钮
    let logoutBtn = findElementWithTimeout(
        text("Log out"),
        5000,
        "Log out按钮"
    );
    if (!logoutBtn) return;
    click(360, 1207);
    sleep(1000);

    // 确认退出
    click(360, 1203);
    sleep(1000);

    showToast("退出登录流程完成");
}

// 登录流程
function login() {
    showToast("开始登录流程");

    // 2.1 点击登录方式选择
    let loginMethodBtn = findElementWithTimeout(
        text('Add another account'),
        5000,
        "登录方式按钮"
    );
    if (!loginMethodBtn) return;
    loginMethodBtn.click();
    sleep(1000);

    // 2.1.1 选择手机邮箱登录
    let emailPhoneLoginBtn = findElementWithTimeout(
        desc('Use phone / email / username'),
        5000,
        "邮箱手机登录按钮"
    );
    if (!emailPhoneLoginBtn) return;
    emailPhoneLoginBtn.click();
    sleep(1000);

    // 2.1.2 选择手机邮箱登录
    let emailLoginBtn = findElementWithTimeout(
        desc('Email / Username'),
        5000,
        "邮箱登录按钮"
    );
    if (!emailLoginBtn) return;
    emailLoginBtn.click();
    sleep(1000);
    // 2.2 输入邮箱
    let emailInput = findElementWithTimeout(
        text('Email or username'),
        5000,
        "邮箱输入框"
    );
    if (!emailInput) return;
    emailInput.setText(config.email);
    sleep(1000);


    // 2.2.1 点击Continue
    click(356,828)
    sleep(5000);

    // 2.3 输入验证码
    // 复制 数字666666
    let code = "666666";
    let result = shell("input text " + code, true);
    if (result.code === 0) {
        toast("验证码输入成功");
    } else {
        toast("验证码输入失败");
    }
    sleep(1000);
}

// 主要流程
function main() {
    try {
        showToast("开始执行主流程");

        showToast("1. 首先关闭TikTok...");
        closeTikTok();
        
        showToast("2. 重新打开TikTok...");
        openTikTok();
        
        showToast("等待应用启动(3秒)...");
        sleep(3000);
        
        showToast("4. 点击屏幕中间...");
        clickScreenCenter();
        
        showToast("5. 检查登录状态...");
        let isLoggedIn = checkLoginStatus();
        
        if (isLoggedIn === null) {
            handleError("无法确定登录状态，退出脚本");
            return;
        }
        
        if (!isLoggedIn) {
            showToast("6. 未登录，开始登录流程");
            login();
        } else {
            showToast("6. 已登录，开始退出流程");
            logout();
        }
        
        showToast("主流程执行完成");
    } catch (e) {
        handleError("执行出错：" + e.message);
    } finally {
        // 确保脚本结束时TikTok被关闭
        // closeTikTok();
    }
}

// 显示控制台方便调试
console.show();
showToast("=== 脚本开始运行 ===");
main();
