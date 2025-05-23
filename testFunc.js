function dumpNode(node) {
    if (!node) return null;
    return {
        text: node.text(),
        desc: node.desc(),
        id: node.id(),
        className: node.className(),
        clickable: node.clickable(),
        bounds: node.bounds().toString(),
        children: node.children().map(child => dumpNode(child))
    };
}

// 用当前活动窗口中的根控件来获取控件树
let rootNode = className("android.widget.FrameLayout").depth(0).findOne();  // 页面根控件

if (!rootNode) {
    toast("未找到根控件，可能未开启无障碍权限");
    exit();
}

let uiTree = dumpNode(rootNode);
let json = JSON.stringify(uiTree, null, 2);
let path = "/sdcard/ui_dump.json";
files.write(path, json);
toast("控件树已保存到 " + path);
