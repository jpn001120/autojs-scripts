// 获取当前活动窗口的控件树并导出为 JSON
function dumpUI(node) {
    if (!node) return null;
    return {
        text: node.text(),
        desc: node.desc(),
        className: node.className(),
        id: node.id(),
        bounds: node.bounds().toString(),
        clickable: node.clickable(),
        children: node.children().map(dumpUI)
    };
}

let root = currentActivity(); // Auto.js 6 不提供 accessibilityRoot，用这个代替没用，要这样做：

let rootNode = rootAutomator ? rootAutomator : accessibilityService.getRootInActiveWindow();
if (!rootNode) {
    toast("获取控件树失败，可能没有开启无障碍权限");
    exit();
}

let treeJson = JSON.stringify(dumpUI(rootNode), null, 2);
let path = "/sdcard/ui_dump.json";
files.write(path, treeJson);
toast("控件树已保存到 " + path);
