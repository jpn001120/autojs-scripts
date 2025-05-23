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
clickNearestClickable('Name');

