
//监听事件
try {
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.clipboard) {
            try {
                // 剪切板操作
                copyHandle(request.clipboard, sendResponse);
            } catch (error) {
                alert("处理剪切板操作出现异常!" + "\n" + " " + error.message + "\n" + " " + error.stack)
                console.log("contentScript.js处理剪切板操作出现异常!" + "\n" + " " + error.message + "\n" + " " + error.stack);
                sendResponse('contentScript.js处理剪切板操作出现异常!' + "\n" + " " + error.message + "\n" + " " + error.stack);
            } finally {
                sendResponse('数据已经复制到剪切板!');
            }
        } else {
            alert("出现异常,请重新操作获取!")
            console.log("contentScript.js收到其他消息" + JSON.stringify(request));
            sendResponse('contentScript.js收到其他消息: ' + JSON.stringify(request));
        };
    });
} catch (error) {
    console.log("contentScript.js监听消息产生异常,error:" + "\n" + " " + error.message + "\n" + " " + error.stack)
}

function copyHandle(text) {
    if (!navigator.clipboard) {
        alert('当前浏览器不兼容复制到剪贴板功能,不存在可使用的API: navigator.clipboard ,请查阅API兼容性: https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard/writeText#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7')
        console.log('当前浏览器不兼容复制到剪贴板功能,不存在可使用的API: navigator.clipboard ,请查阅API兼容性: https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard/writeText#%E6%B5%8F%E8%A7%88%E5%99%A8%E5%85%BC%E5%AE%B9%E6%80%A7')
        return;
    }
    navigator.clipboard.writeText(text)
        .then(() => {
            console.log('数据已经复制到剪切板，请进行下一步操作!')
        })
        .catch(err => {
            alert("无法复制cookie,产生异常,error:" + "\n" + " " + err.message + "\n" + " " + err.stack + "\n" + "请尝试重新获取!")
            console.log('无法复制此文本，异常信息如下', err + "\n" + " " + err.message + "\n" + " " + err.stack);
        });
}
