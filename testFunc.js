// 遍历整个控件树并导出为 JSON
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

let root = accessibilityRoot;
if (!root) {
    toast("未能获取无障碍服务的根节点");
    exit();
}

let json = JSON.stringify(dumpUI(root), null, 2);

// 保存到文件
let path = "/sdcard/ui_dump.json";
files.write(path, json);
toast("控件树已保存到 " + path);
