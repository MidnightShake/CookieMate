
// 显示消息函数
function OPFunc(message) {
    try {
        console.log(message);
        document.getElementById('cookie_message_OutPut').value = message
    } catch (error) {
        console.error("错误,显示消息 Error: " + "\n" + " " + error);
        document.getElementById('cookie_message_OutPut').value = "错误,显示消息 Error: " + "\n" + " " + error;
    }
}

// 显示测试消息函数
function TextOPFunc(message) {
    (async function () {
        try {
            if (window_isServiceWorker) {
                console.log(message);
                await storeLogToLocalStorage(message, 'info_ServiceWorker')
                    ;
            } else if (window_isPopup) {
                await storeLogToLocalStorage(message, 'info_Popup')
                await displayLogsFromLocalStorage()
            } else {
                ;
            }
        } catch (error) {
            if (window_isServiceWorker) {
                console.error("错误,显示测试消息 Error message: " + error.message + "Error stack: " + error.stack);
            } else if (window_isPopup) {
                document.getElementById('textOutput').value = "错误,显示测试消息 Error: " + "\n" + " " + error.message + "\n" + " " + error.stack;
            } else {
                console.error("错误,显示测试消息 Error message: " + error.message + "Error stack: " + error.stack);
            }
        }
    })();
}

// 发送消息给background函数
function Connection_background(name, message) {
    let port = chrome.runtime.connect({ name: name });
    port.postMessage({ message: sanitizeInput(message) });
    port.onMessage.addListener(function (message_background) {
        console.log("Message from background.js:", sanitizeInput(message_background.reply));
        return sanitizeInput(message_background.reply);
    });
}

// 存储日志到 IndexedDB
// function storeLogToIndexedDB(infoData, category) {
//     let request = indexedDB.open('newLogDatabase', 1);
//     request.onupgradeneeded = function(event) {
//         let db = event.target.result;
//         let store = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
//         store.createIndex('category', 'category', { unique: false });
//     };
//     request.onsuccess = function(event) {
//         let db = event.target.result;
//         let transaction = db.transaction('logs', 'readwrite');
//         let store = transaction.objectStore('logs');
//         let timesdate = new Date();
//         let options = { 
//             year: 'numeric', 
//             month: '2-digit', 
//             day: '2-digit', 
//             hour: '2-digit', 
//             minute: '2-digit', 
//             second: '2-digit', 
//             fractionalSecondDigits: 3, 
//             hour12: false, 
//             timeZone: 'Asia/Shanghai' 
//         };
//         let timestamp = timesdate.toLocaleString('en-US', options);
//         store.add({ info: infoData, category: category, times: timestamp });
//     };
//     request.onerror = function(event) {
//         console.error('Error storing log:', event.target.error);
//     };
// }

// 实时显示日志
// function displayLogsInRealTime() {
//     let request = indexedDB.open('newLogDatabase', 1);
//     request.onsuccess = function(event) {
//         let count = 0;
//         let outputElement =  '';
//         let db = event.target.result;
//         let transaction = db.transaction('logs', 'readonly');
//         let store = transaction.objectStore('logs');
//         let index = store.index('category');
//         // let keyRange = IDBKeyRange.only('info');     // 显示指定分类
//         // let cursorRequest = index.openCursor(keyRange, "prev");
//         let cursorRequest = index.openCursor(null, 'prev'); 
//         cursorRequest.onsuccess = function(event) {
//             let cursor = event.target.result;
//             let textOutput = document.getElementById('textOutput');
//             if (cursor && count <= 50) {
//                 let log = cursor.value.times + ' - [' + cursor.value.category + '] - ' + cursor.value.info;
//                 count++;
//                 outputElement += log + '\n';
//                 console.log(log);
//                 cursor.continue();
//             } else {
//                 textOutput.value = outputElement;
//             }
//         };
//     };
//     request.onerror = function(event) {
//         console.error('Error opening database:', event.target.error);
//     };
// }

// 存储日志到本地存储
async function storeLogToLocalStorage(infoData, category) {
    let timesdate = new Date();
    let options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        hour12: false,
        timeZone: 'Asia/Shanghai'
    };
    let timestamp = timesdate.toLocaleString('en-US', options);
    let logEntry = { info: infoData, category: category, times: timestamp };
    let logs = await getChromeStorageData('logs') || [];
    logs.unshift(logEntry);
    chrome.storage.local.set({ logs: logs });
}

// 显示日志
async function displayLogsFromLocalStorage() {
    let logs = await getChromeStorageData('logs') || [];
    let textOutput = document.getElementById('textOutput');
    let outputElement = '';
    for (let index = 0; index < logs.length; index++) {
        if (index <= 50) {
            const element = logs[index];
            let logInfo = element.times + ' - [' + element.category + '] - ' + element.info;
            outputElement += logInfo + '\n';
        } else {
            break;
        }
    }
    textOutput.value = outputElement;
}

// 封装 chrome.storage.local.get() 方法
async function getChromeStorageData(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else if (result[key] !== undefined) {
                resolve(result[key]);
            } else {
                resolve(false);
            }
        });
    });
}

// 测试云服务器连通性
async function Test_connectivity_cloud_server(url) {
    try {      
        const response = await fetch(url.trim().replace(/\/+$/, '') + "/");
        if (response.ok) {
            console.log("Test connectivity to cloud server request successful !");
            return true;
        } else {
            console.log("Test connectivity to cloud server request failed !");
            return false;
        }
    } catch (error) {
        console.log("Test connectivity to cloud server Error: " + "\n" + " " + error.message + "\n" + " " + error.stack);
        return "Error";
    }
}

// 测试不通过 禁用云相关按钮
function Test_failed_Disable_button_style(resource) {
    let button_id_array = [
        'createSelectAndMonitorkeywordBtn',
        'CronJobBtn',
        'geturlCookiesBtn',
        'showAllDomainBtn',
        'AllDomainInputBtn',
        'SingleCoverageCookiesBtn',
        'AllDomainCoverageCookiesBtn'
    ]
    button_id_array.forEach(element => {
        let button = document.getElementById(element);
        if (resource) {
            button.disabled = false;
            button.addEventListener('mouseover', function () {
                button.style.backgroundColor = '';
            });
            button.addEventListener('mouseout', function () {
                button.style.backgroundColor = '';
            });
        } else {
            button.disabled = true;
            button.addEventListener('mouseover', function () {
                button.style.backgroundColor = 'red';
            });
            // button.addEventListener('mouseout', function() {
            //     button.style.backgroundColor = '';
            // });
        }
    });
}


// 获取当前页面的cookie
async function getCurrentCookies() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
            try {
                const cookies = await new Promise((resolve, reject) => {
                    chrome.cookies.getAll({ url: tabs[0].url }, function (cookies) {
                        resolve(cookies);
                    });
                });
                let cookieString = "";
                for (let i = 0; i < cookies.length; i++) {
                    let value = cookies[i].value;
                    value = value.replace(/[ ;]+$/g, "");
                    cookieString += cookies[i].name + "=" + value + ";";
                }
                cookieString = cookieString.replace(/;\s*$/, "");
                if (!cookieString) {
                    TextOPFunc("提示: 当前站点页面不存在 cookie 值!");
                    resolve(false);
                } else {
                    OPFunc(cookieString);
                    TextOPFunc("当前站点页面的 cookie 值已显示!");
                    resolve(cookies);
                }
            } catch (error) {
                reject(error);
            }
        });
    });
}

// 自定义选择弹窗
function customConfirm(message, btn1Text, btn2Text) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.background = 'white';
        dialog.style.padding = '20px';
        dialog.style.border = '1px solid black';
        dialog.style.zIndex = '1000';

        const messageElement = document.createElement('p');
        messageElement.textContent = message;

        const btn1 = document.createElement('button');
        btn1.textContent = btn1Text;
        btn1.addEventListener('click', () => {
            resolve(true);
            dialog.remove();
        });

        const btn2 = document.createElement('button');
        btn2.textContent = btn2Text;
        btn2.addEventListener('click', () => {
            resolve(false);
            dialog.remove();
        });

        dialog.appendChild(messageElement);
        dialog.appendChild(btn1);
        dialog.appendChild(btn2);

        document.body.appendChild(dialog);
    });
}

// 下载函数
async function downloadForServer() {
    chrome.action.setBadgeText({ text: '▼' });
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' }); //'▲▼'红色'#FF0000'、绿色‘#00FF00’
    const urlInput = await getChromeStorageData('url');
    const uuidInput = await getChromeStorageData('uuid');
    if (urlInput && uuidInput) {
        const downloadurl = urlInput.trim().replace(/\/+$/, '') + "/get/" + uuidInput;
        try {
            TextOPFunc("下载数据中...");
            const response = await fetch(downloadurl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const response_data = await response.json();
            // 检测下载的数据是否正常
            const jsonString = JSON.stringify(response_data);
            if (jsonString.includes("not found")) {
                chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                chrome.storage.local.set({ 'state_green_dot': "none" });
                chrome.storage.local.set({ 'state_red_dot': "block" });
                chrome.storage.local.set({ 'text_state': false });
                if (window_isPopup) {
                    document.getElementById("state_green_dot").style.display = "none";
                    document.getElementById("state_red_dot").style.display = "block";
                    Test_failed_Disable_button_style(false);
                }
                TextOPFunc("错误,未下载到数据: " + "\n" + " " + "请输入正确的 用户UUID !!");
                return 'uuid?';
            }
            JSON.parse(jsonString);

            if (response_data && ('encrypted' in response_data) && !(response_data == undefined)) {
                chrome.action.setBadgeText({ text: '' });
                let text_state = await getChromeStorageData('text_state');
                if (!text_state) {
                    chrome.storage.local.set({ 'state_green_dot': "block" });
                    chrome.storage.local.set({ 'state_red_dot': "none" });
                    chrome.storage.local.set({ 'text_state': true });
                    if (window_isPopup) {
                        document.getElementById("state_green_dot").style.display = "block";
                        document.getElementById("state_red_dot").style.display = "none";
                        Test_failed_Disable_button_style(true);
                    }
                }
                TextOPFunc("下载数据完成。");
                return response_data;
            } else {
                chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                TextOPFunc("错误,下载到无效数据: " + "\n" + " " + "请自行检查 云服务器中储存的 当前用户UUID的 数据内容 是否正常!!");
                return false;
            }
        } catch (error) {
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
            chrome.storage.local.set({ 'state_green_dot': "none" });
            chrome.storage.local.set({ 'state_red_dot': "block" });
            chrome.storage.local.set({ 'text_state': false });
            if (window_isPopup) {
                document.getElementById("state_green_dot").style.display = "none";
                document.getElementById("state_red_dot").style.display = "block";
                Test_failed_Disable_button_style(false);
            }
            if (error.message.includes("not valid JSON")) {
                TextOPFunc("错误,下载检测到无效数据: " + "\n" + " " + "请确保输入的 云服务器地址 正确!!");
                return false;
            } else if (error.message.includes("Failed to fetch")) {
                TextOPFunc("错误,下载错误: " + "\n" + " " + "请确保输入的 云服务器地址 正确!!");
                return false;
            } else {
                TextOPFunc("下载操作错误: " + "\n" + " " + error.message + "\n" + " " + error.stack);
                return false;
            }
        }
    }
}

// 解密函数
async function decrypt_func(encrypted) {
    const password = await getChromeStorageData('key');
    const uuid = await getChromeStorageData('uuid');
    if (password && uuid) {
        TextOPFunc("正在解密...");
        try {
            const the_key = CryptoJS.MD5(uuid + '-' + password).toString().substring(0, 16);
            const decrypted = CryptoJS.AES.decrypt(encrypted, the_key).toString(CryptoJS.enc.Utf8);
            const parsed = JSON.parse(decrypted);
            TextOPFunc("解密完成。");
            let text_state = await getChromeStorageData('text_state');
            if (!text_state) {
                chrome.storage.local.set({ 'state_green_dot': "block" });
                chrome.storage.local.set({ 'state_red_dot': "none" });
                chrome.storage.local.set({ 'text_state': true });
                if (window_isPopup) {
                    document.getElementById("state_green_dot").style.display = "block";
                    document.getElementById("state_red_dot").style.display = "none";
                    Test_failed_Disable_button_style(true);
                }
            }
            return parsed;
        } catch (error) {
            chrome.storage.local.set({ 'state_green_dot': "none" });
            chrome.storage.local.set({ 'state_red_dot': "block" });
            chrome.storage.local.set({ 'text_state': false });
            if (window_isPopup) {
                document.getElementById("state_green_dot").style.display = "none";
                document.getElementById("state_red_dot").style.display = "block";
                Test_failed_Disable_button_style(false);
            }
            if (error.message.includes("Malformed UTF-8 data")) {
                TextOPFunc("错误,解密数据失败: " + "\n" + " " + "请输入正确的 端对端加密key !!");
                return false;
            } else if (error.message.includes("not valid JSON")) {
                TextOPFunc("错误,解密检测到无效数据: " + "\n" + " " + "请自行检查云服务器储存的 数据 是否正常!!");
                return false;
            } else {
                TextOPFunc("解密操作错误: " + " " + error.message + "\n" + " " + error.stack);
                return false;
            }
        }
    } else {
        TextOPFunc("错误,解密数据失败: " + "\n" + " " + "请输入正确的 端对端加密key !!");
    }
}

// 获取指定域名在本地储存的cookie
async function getDomainCookie(domain) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain: domain }, function (cookie) {
            if (cookie) {
                resolve(cookie);
            } else {
                chrome.cookies.getAll({ domain: domain }, function (cookieHttp) {
                    if (cookieHttp) {
                        resolve(cookieHttp);
                    } else {
                        resolve(false);
                    }
                });
            }
        });
    });
}

// 右键菜单 获取指定域名在本地储存的cookie
async function menu_getDomainCookie(domain) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain: domain }, function (cookie) {
            if (cookie) {
                let cookieString = "";
                for (let i = 0; i < cookie.length; i++) {
                    let value = cookie[i].value;
                    value = value.replace(/[ ;]+$/g, "");
                    cookieString += cookie[i].name + "=" + value + ";";
                }
                cookieString = cookieString.replace(/;\s*$/, "");
                resolve(cookieString);
            } else {
                chrome.cookies.getAll({ domain: domain }, function (cookieHttp) {
                    if (cookieHttp) {
                        let cookieString = "";
                        for (let i = 0; i < cookieHttp.length; i++) {
                            let value = cookieHttp[i].value;
                            value = value.replace(/[ ;]+$/g, "");
                            cookieString += cookieHttp[i].name + "=" + value + ";";
                        }
                        cookieString = cookieString.replace(/;\s*$/, "");
                        resolve(cookieHttp);
                    } else {
                        resolve(false);
                    }
                });
            }
        });
    });
}

// 右键菜单 获取当前页面 远程 的Cookie 按钮 并跳转站点首页
async function menu_geturlCookiesAndRefresh_Page(domain) {
    const response = await downloadForServer();
    if (!response) {
        return;
    } else {
        const decryptedText = await decrypt_func(response.encrypted);
        let Running_results = await AllDomainCookiesInput(decryptedText, domain);
        if (Running_results) {
            return true;
        } else {
            return false;
        }
    }
}

// 去掉数组中的空元素
function removeNullValues(arr) {
    return arr.filter(item => item !== null && item !== undefined);
}

// 计算相似度得分
function calculateSimilarity(arr1, arr2) {
    let keys1 = arr1.map(item => item.split(':')[0]);
    let keys2 = arr2.map(item => item.split(':')[0]);
    let commonKeys = keys1.filter(key => keys2.includes(key));
    let similarity = ((commonKeys.length / keys1.length) + (commonKeys.length / keys2.length)) / 2;
    let return_sum = parseFloat(similarity.toFixed(2));
    return return_sum * 100;
}

// 数组排序后对比
function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
    return JSON.stringify(sortedArr1) === JSON.stringify(sortedArr2);
}

// 数组去除重复键，包括重复键本身
function filterUniqueKeyValuePairs(domain_cloudCookie) {
    if (domain_cloudCookie.length > 0) {
        let uniqueObject = {};
        domain_cloudCookie.forEach(item => {
            const [key, value] = item.split(':');
            if (!uniqueObject[key]) {
                uniqueObject[key] = value;
            } else if (uniqueObject[key] !== value) {
                delete uniqueObject[key];
            }
        });
        let uniqueArray = Object.keys(uniqueObject).map(key => `${key}:${uniqueObject[key]}`);
        return uniqueArray;
    } else {
        return domain_cloudCookie;
    }
}

// 计算包含关键词数量
function include_key_words_number(domain_Cookie, key_words_array) {
    let totalCount = 0;
    for (let i = 0; i < domain_Cookie.length; i++) {
        let keyValue = domain_Cookie[i].split(":");
        let key = keyValue[0];
        let value = keyValue[1];
        if (key_words_array.includes(keyValue[0] + ':' + keyValue[1])) {
            totalCount++;
        }
        if (key_words_array.includes(key)) {
            totalCount++;
        }
        if (key_words_array.includes(value)) {
            totalCount++;
        }
    }
    return totalCount;
}
// 导入站点清单的数据检查及导入操作
async function AllDomainCookiesInput(CookieData, domainData) {
    try {
        let Running_results = false;
        TextOPFunc("开始导入清单中站点的cookie数据...");
        // 去除空格并检查是否为空字符串
        let cleanedDomainData = domainData.trim();
        if (!cleanedDomainData) {
            TextOPFunc("错误,操作已停止,请输入正确格式域名清单,每行一个域名!");
            return;
        }
        if (!CookieData) {
            TextOPFunc("错误,云服务器不存在任何域名信息 !! " + "\n" + " 请自行检查云服务器数据信息!");
            return;
        } else if (cleanedDomainData.length > 3) {
            // 将每行的域名字符串分割成数组
            let arrayWithoutSpaces = cleanedDomainData.split('\n');
            // 去除数组内元素的空格
            let domainsArray = arrayWithoutSpaces.map(item => item.trim()).filter(item => item !== "");
            let result = {};
            let result_expirationDate = {};
            let resultNull = [];
            for (let i = 0; i < domainsArray.length; i++) {
                let domaincookie = '';
                let isRelated = false;
                let domain;
                try {
                    let url = new URL(domainsArray[i]);
                    domain = url.hostname;
                } catch (error) {
                    // 添加默认协议后再次尝试获取主机名
                    try {
                        let urlWithProtocol = new URL('https://' + domainsArray[i]);
                        domain = urlWithProtocol.hostname;
                    } catch (error) {
                        TextOPFunc("错误,请检查输入的域名清单中,域名格式是否正确!" + "\n" + "错误信息: " + "\n" + " " + error.message + "\n" + " " + error.stack);
                    }
                }
                for (let domainKey in CookieData.cookie_data) {
                    if (domain.endsWith(domainKey)) {
                        isRelated = true;
                        let domainCookies = CookieData.cookie_data[domainKey];
                        for (let cookie of domainCookies) {
                            domaincookie += `${cookie.name}=${cookie.value};`;
                            result_expirationDate[domainKey] = `${cookie.expirationDate}`;
                        }
                        result[domainKey] = domaincookie.slice(0, -1)
                        break;
                    }
                }
                if (!isRelated) {
                    resultNull.push(domainsArray[i]);
                }
            }
            if (Object.keys(result).length) {
                let setUrlCookies_resultsArray = [];
                let setUrlCookies_results = "";
                for (let url in result) {
                    let cookieInput = result[url];
                    if (cookieInput) {
                        let urldata = setUrl(url);
                        let setUrlCookies_result = await setUrlCookies(urldata, cookieInput, result_expirationDate[url]);
                        let setUrlCookies_resultObj = {
                            newUrl: setUrlCookies_result.Newurl,
                            successCount: setUrlCookies_result.successCount,
                            failureCount: setUrlCookies_result.failureCount
                        };
                        setUrlCookies_resultsArray.push(setUrlCookies_resultObj);
                    } else {
                        setUrlCookies_results += url + " 设置失败,其在云端的Cookie值为 空 或 无效!"
                    }
                }
                setUrlCookies_resultsArray.forEach(function (resultsArray) {
                    setUrlCookies_results += new URL(resultsArray.newUrl).hostname + " 成功设置" + resultsArray.successCount + "个值,失败" + resultsArray.failureCount + "个值。" + "\n"
                });
                TextOPFunc(setUrlCookies_results);
                Running_results = true;
            } else {
                TextOPFunc("错误,根据域名列表未获取到有效的云cookie数据,未操作导入cookie数据!请自行检查域名列表和云数据是否正常。");
            }
            if (!Array.isArray(resultNull) || resultNull.length !== 0) {
                let NullDataDomain = "";
                for (let key of resultNull) {
                    NullDataDomain += key + "\n";
                }
                TextOPFunc("错误,输入的 域名列表 内容错误!请检查输入的列表,其中不存在云端cookie数据的域名:" + "\n" + NullDataDomain);
            }
            if (Running_results) {
                return true;
            }
        } else {
            TextOPFunc("错误,未成功导入站点域名列表的云端cookie数据!");
            return;
        }
    } catch (error) {
        TextOPFunc("错误,根据站点域名列表导入对应cookies出现 Error: " + "\n" + " " + error.message + "\n" + " " + error.stack);
    }
}

//上传函数
async function uploadToServer(decrypted) {
    chrome.action.setBadgeText({ text: '▲' });
    chrome.action.setBadgeBackgroundColor({ color: '#00FF00' }); //'▲▼'红色'#FF0000'、绿色‘#00FF00’
    const urlInput = await getChromeStorageData('url');
    const uuidInput = await getChromeStorageData('uuid');
    const uploadurl = urlInput.trim().replace(/\/+$/, '') + "/update";
    if (urlInput && uuidInput) {
        try {
            TextOPFunc("上传处理数据中...");
            const encrypted = await encrypt_func(decrypted)
            if (!encrypted) {
                TextOPFunc("检测到错误,暂存数据上传失败。");
                return false;
            }
            const uploadData = {
                uuid: uuidInput,
                encrypted: encrypted
            };
            let headers = { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }
            const response = await fetch(uploadurl, {
                method: 'POST',
                headers: headers,
                body: pako.gzip(JSON.stringify(uploadData))
            });
            const response_data = await response.json();
            // 检测上传返回的数据是否正常
            const jsonString = JSON.stringify(response_data);
            JSON.parse(jsonString);

            if (response_data && jsonString.includes("done")) {
                chrome.action.setBadgeText({ text: '' });
                TextOPFunc("上传数据完成。");
                return response_data;
            } else {
                chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
                TextOPFunc("错误,上传检测到云服务器返回无效数据 或 上传错误: " + "\n" + " " + "请重试,或请自行检查 云服务器中储存的 当前用户UUID的 数据内容 是否正常!!");
                TextOPFunc("上传出错操作返回的数据" + jsonString);
                return false;
            }
        } catch (error) {
            chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
            if (error.message.includes("not valid JSON")) {
                TextOPFunc("错误,上传检测到云服务器返回无效数据: " + "\n" + " " + "请确保输入的 云服务器地址 正确 或 网络正常!!");
                return false;
            } else if (error.message.includes("Failed to fetch")) {
                TextOPFunc("错误,上传错误: " + "\n" + " " + "请确保输入的 云服务器地址 正确 或 网络正常!!");
                return false;
            } else {
                TextOPFunc("上传操作错误: " + "\n" + " " + error.message + "\n" + " " + error.stack);
                return false;
            }
        }
    }
}

// 加密函数
async function encrypt_func(decrypted) {
    const password = await getChromeStorageData('key');
    const uuid = await getChromeStorageData('uuid');
    if (password && uuid) {
        TextOPFunc("正在加密...");
        try {
            let local_storages = '';
            const the_key = CryptoJS.MD5(uuid + '-' + password).toString().substring(0, 16);
            const data_to_encrypt = JSON.stringify({ "cookie_data": decrypted, "local_storage_data": local_storages, "update_time": new Date() });
            const encrypted = CryptoJS.AES.encrypt(data_to_encrypt, the_key).toString();
            if (!decrypted) {
                TextOPFunc("提醒:" + "\n" + " " + "检测到待加密的cookie数据为空 !!");
                if (confirm('检测到待加密的cookie数据为空,是否继续?' + "\n" + '(首次创建用户基础数据不会上传任何站点cookie)')) {
                    TextOPFunc("加密完成。");
                    return encrypted;
                } else {
                    return false;
                }
            }
            TextOPFunc("加密完成。");
            return encrypted;
        } catch (error) {
            if (error.message.includes("Malformed UTF-8 data")) {
                TextOPFunc("错误,加密数据失败: " + "\n" + " " + "请输入正确的 端对端加密key !!");
                return false;
            } else if (error.message.includes("not valid JSON")) {
                TextOPFunc("错误,加密检测到无效数据: " + "\n" + " " + "请自行检查云服务器储存的 数据 是否正常!!");
                return false;
            } else {
                TextOPFunc("加密操作错误: " + " " + error.message + "\n" + " " + error.stack);
                return false;
            }
        }
    } else {
        TextOPFunc("错误,加密数据失败: " + "\n" + " " + "请输入正确的 端对端加密key !!");
        return false;
    }
}


// 设置url的cookie
function setUrlCookies(url, cookieInput, expirationDate) {
    TextOPFunc(expirationDate);
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let Newurl;
            if (!url) {
                Newurl = tabs[0].url;
                if (Newurl.includes('extension')) {
                    return;
                }
            } else {
                Newurl = url;
            }
            chrome.cookies.getAll({ url: Newurl }, function (cookies) {
                const cookiePromises = [];
                for (let i = 0; i < cookies.length; i++) {
                    cookiePromises.push(
                        new Promise((resolve, reject) => {
                            chrome.cookies.remove({ url: Newurl, name: cookies[i].name }, function () {
                                resolve();
                            });
                        })
                    );
                }
                Promise.all(cookiePromises)
                    .then(() => {
                        const cookiesArray = cookieInput.split(";");
                        const cookieSetPromises = [];
                        let successCount = 0;
                        let failureCount = 0;
                        if (expirationDate == "0" || !expirationDate || expirationDate == "undefined") {
                            expirationDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
                        } else {
                            expirationDate = parseInt(expirationDate);
                        }
                        for (let j = 0; j < cookiesArray.length; j++) {
                            const cookie = cookiesArray[j].trim().split("=");
                            const name = cookie[0];
                            const value = cookie[1];
                            cookieSetPromises.push(
                                new Promise((resolve, reject) => {
                                    chrome.cookies.set({ url: Newurl, name: name, value: value , expirationDate: expirationDate }, function (setCookie) {
                                        if (setCookie) {
                                            successCount++;
                                            resolve();
                                        } else {
                                            failureCount++;
                                            resolve();
                                        }
                                    });
                                })
                            );
                        }
                        Promise.all(cookieSetPromises)
                            .then(() => {
                                resolve({ Newurl, successCount, failureCount });
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });
        });
    });
}

// 匹配url的站点地址
function setUrl(urlIn) {
    const DomainList = returnDomainList();
    const httpDomain = 'http://';
    const httpsDomain = 'https://';
    let resultUrl = '';
    TextOPFunc('正在匹配站点:    ' + urlIn);
    if (urlIn.includes(httpDomain) || urlIn.includes(httpsDomain)) {
        resultUrl = urlIn;
        return resultUrl;
    } else if (urlIn) {
        for (let i = 0; i < DomainList.length; i++) {
            if (DomainList[i].includes(urlIn)) {
                resultUrl = 'https://' + DomainList[i];
                break;
            } else {
                resultUrl = 'https://' + urlIn;
            }
        }
        return resultUrl;
    }
}

// 匹配站点关键词的域名
function returnDomainList() {
    const domain = [
        "1ptba.com",
        "52pt.site",
        "abtorrents.me",
        "aidoru-online.me",
        "aither.cc",
        "alpharatio.cc",
        "animebytes.tv",
        "anthelion.me",
        "audiences.me",
        "audionews.org",
        "azusa.wiki",
        "baconbits.org",
        "bemaniso.ws",
        "beyond-hd.me",
        "bibliotik.me",
        "bitbr",
        "bitporn.eu",
        "bitpt.cn",
        "blutopia.cc",
        "broadcasthe.net",
        "brokenstones.is",
        "bt.neu6.edu.cn",
        "bwtorrents.tv",
        "byr.pt",
        "carpt.net",
        "ccfbits.org",
        "cgpeers.to",
        "cinemageddon.net",
        "club.hares.top",
        "cnlang.org",
        "concertos.live",
        "crabpt.vip",
        "cyanbug.net",
        "dajiao.cyou",
        "dicmusic.com",
        "digitalcore.club",
        "discfan.net",
        "ecustpt.eu.org",
        "eiga.moi",
        "et8.org",
        "extremlymtorrents.ws",
        "femdomcult.org",
        "filelist.io",
        "fsm.name",
        "gay-torrents.org",
        "gazellegames.net",
        "gfxpeers.net",
        "greatposterwall.com",
        "hawke.uno",
        "hdarea.club",
        "hdatmos.club",
        "hdbits.org",
        "hdchina.org",
        "hdcity.city",
        "hddolby.com",
        "hdfans.org",
        "hdf.world",
        "hdhome.org",
        "hdpt.xyz",
        "hdroute.org",
        "hdsky.me",
        "hd-space.org",
        "hdtime.org",
        "hd-torrents.org",
        "hdvideo.one",
        "hhanclub.top",
        "htpt.cc",
        "hudbt.hust.edu.cn",
        "ianon.app",
        "ihdbits.me",
        "iptorrents.com",
        "joyhd.net",
        "jpopsuki.eu",
        "jptv.club",
        "jptvts.us",
        "kamept.com",
        "karagarga.in",
        "kimoji.club",
        "kufei.org",
        "kufirc.com",
        "learnflakes.net",
        "leaves.red",
        "login.superbits.org",
        "losslessclub.com",
        "lst.gg",
        "lztr.me",
        "milkie.cc",
        "monikadesign.uk",
        "nanyangpt.com",
        "ncore.pro",
        "nebulance.io",
        "nicept.net",
        "npupt.com",
        "open.cd",
        "orpheus.network",
        "ourbits.club",
        "our.kelu.one",
        "pandapt.net",
        "passthepopcorn.me",
        "piggo.me",
        "pornbay.org",
        "pt.0ff.cc",
        "pt.2xfree.org",
        "pt.btschool.club",
        "ptcafe.club",
        "ptchdbits.co",
        "ptchina.org",
        "pt.dhtclub.com",
        "pt.eastgame.org",
        "pterclub.com",
        "pt.gtk.pw",
        "pt.hd4fans.org",
        "pt.hdbd.us",
        "pt.hdpost.top",
        "pt.hdupt.com",
        "pthome.net",
        "pt.itzmx.com",
        "pt.keepfrds.com",
        "pt.newworld.plus",
        "ptsbao.club",
        "pt.sjtu.edu.cn",
        "pt.soulvoice.club",
        "ptvicomo.net",
        "pt.xauat6.edu.cn",
        "pt.zhixing.bjtu.edu.cn",
        "pussytorrents.org",
        "qingwapt.com",
        "raingfh.top",
        "redacted.ch",
        "resource.xidian.edu.cn",
        "rousi.zip",
        "rutracker.org",
        "sdbits.org",
        "shadowthein.net",
        "share.ilolicon.com",
        "sharkpt.net",
        "speedapp.io",
        "sportscult.org",
        "springsunday.net",
        "star-space.net",
        "sugoimusic.me",
        "teamhd.org",
        "telly.wtf",
        "thegeeks.click",
        "tjupt.org",
        "torrent.desi",
        "totheglory.im",
        "t.tosky.club",
        "u2.dmhy.org",
        "ubits.club",
        "uhdbits.org",
        "ultrahd.net",
        "wintersakura.net",
        "world-in-hd.net",
        "wukongwendao.top",
        "www.agsvpt.com",
        "www.beitai.pt",
        "www.cathode-ray.tube",
        "www.cinematik.net",
        "www.empornium.is",
        "www.filept.com",
        "www.gamegamept.com",
        "www.gaytor.rent",
        "www.haidan.video",
        "www.happyfappy.org",
        "www.hdkyl.in",
        "www.hitpt.com",
        "www.icc2022.com",
        "www.morethantv.me",
        "www.myanonamouse.net",
        "www.okpt.net",
        "www.oshen.win",
        "www.pttime.org",
        "www.skyey2.com",
        "www.torrentday.com",
        "www.torrentleech.org",
        "www.torrentseeds.org",
        "www.trancetraffic.com",
        "www.yemapt.org",
        "xingtan.one",
        "x-ite.me",
        "xp.m-team.cc",
        "zhuque.in",
        "zmpt.cc",
        "lemonhd.club"
    ];
    return domain;
}
