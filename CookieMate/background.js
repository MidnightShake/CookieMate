// 导入共享函数
importScripts('./Functions.js');
importScripts("./js/crypto-js/crypto-js.js")
importScripts("./js/pako/pako.js")
importScripts("./js/dompurify/dist/purify.js")

const window_isPopup = false;
const window_isServiceWorker = true;

// 插件安装加载事件
chrome.runtime.onInstalled.addListener(function() {
    console.log("Extension installed");
    // 执行初始化操作
    chrome.alarms.clearAll();
    // chrome.storage.local.clear();

    chrome.storage.local.remove('text_state');
    chrome.storage.local.remove('state_green_dot');
    chrome.storage.local.remove('state_red_dot');
    chrome.storage.local.remove('menu_get_cloudCookie_and_Refresh_Page');
    chrome.storage.local.remove('CronTime');
    chrome.storage.local.remove('Cron_switch');
    chrome.storage.local.remove('logs');
    TextOPFunc("--- 插件已加载,请填入相关参数,并测试连接 ---");
});

// 插件首次启动事件
// chrome.runtime.onStartup.addListener(function() {
//     console.log("Extension started");
//     // 执行初始化操作
//     chrome.alarms.clearAll();
//     chrome.storage.local.clear();
// });

// 插件卸载前事件
chrome.runtime.onSuspend.addListener(function() {
    console.log("Extension uninstall...");
    // 执行清理操作
    chrome.alarms.clearAll();
    chrome.storage.local.clear(function() {
        console.log('chrome local Storage cleared successfully!');
    });
});

// 在 background.js 中监听连接请求
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "Connection_background") {
        TextOPFunc("Connection established from popup.js");
        // 监听来自 popup.js 的消息
        port.onMessage.addListener(async function (message) {
            TextOPFunc("Message from popup.js:", message);
            if (message.message == 'set_CronFun') {
                let state_green_dot_result = await getChromeStorageData('state_green_dot');
                let state_red_dot_result = await getChromeStorageData('state_red_dot');
                if (state_green_dot_result == 'block' && state_red_dot_result == 'none') {
                    let Cron_switch = await getChromeStorageData('Cron_switch') || '0';
                    if (Cron_switch == '1') {
                        let CronTime = await getChromeStorageData('CronTime') || '0';
                        if (CronTime !== '0') {
                            TextOPFunc('定时主任务正在创建...');
                            chrome.alarms.create('CronFun', {
                                delayInMinutes: parseInt(CronTime),   // 定义 创建任务后多少时间即触发第一次
                                periodInMinutes: parseInt(CronTime)   // 定义 触发的间隔时间
                            });
                            chrome.alarms.onAlarm.addListener(async (alarm) => {
                                if (alarm.name == 'CronFun') {
                                    TextOPFunc('定时任务正在运行...');
                                    await Cron_get_cookie_and_overwriteCookies();
                                    TextOPFunc('此次定时任务运行结束。');
                                }
                            });
                            TextOPFunc('定时主任务创建成功,' + "运行周期: " + CronTime + '分钟/次!');
                        }
                    } else {
                        chrome.alarms.clearAll();
                    }
                } else {
                    chrome.alarms.clearAll();
                }
                // 向 popup.js 回复消息
                port.postMessage({ reply: "Message received! set_CronFun complete!" });
            } else {
                port.postMessage({ reply: "Message received! message: " + message.message });
            }
        });
    }
});

// 根据选定的浏览器收藏夹内标签的url判断对应站点在本地cookie值中的 关键词 是否存在，判断对应站点本地cookie是否匹配，不匹配则更新为云端数据值
async function Cron_get_cookie_and_overwriteCookies() {
    try {
        let localStorage_urls = await getChromeStorageData('saved_Favorite_selection_id_title_ursl') || false;
        if (localStorage_urls) {
            let domainUrls = JSON.parse(localStorage_urls).urls
            if (domainUrls) {
                const response = await downloadForServer();
                if (!response || response == 'uuid?') {
                    TextOPFunc("错误,定时任务运行检测到云端数据下载失败，等待下一次运行操作。");
                    return;
                } else {
                    const CookieData = await decrypt_func(response.encrypted);
                    if (! 'cookie_data' in CookieData) {
                        TextOPFunc("错误,定时任务运行检测到云端下载的数据中不包含任何cookie数据,等待下一次运行操作。");
                    } else {
                        // 对每个URL处理
                        let cookie_key_Array = await getChromeStorageData('domain_Cookie_Key');
                        if (!cookie_key_Array) {
                            TextOPFunc('检测到未设置站点cookie检测关键词,已跳过相关操作。');
                        }
                        let Waiting_for_upload = {};
                        for (let index = 0; index < domainUrls.length; index++) {
                            const domain = new URL(domainUrls[index]).hostname;
                            if (domain) {
                                let domain_localCookieData = await getDomainCookie(domain)
                                let domain_localCookie = [];
                                let domain_cloudCookie = [];
                                if (domain_localCookieData) {
                                    for (const localCookieData of domain_localCookieData) {
                                        domain_localCookie.push(`${localCookieData.name}:${localCookieData.value}`);
                                    }
                                    for (const domainKey in CookieData.cookie_data) {
                                        if (domain.endsWith(domainKey)) {
                                            const domainCookies_clouddata = (CookieData.cookie_data[domainKey]);
                                            if (domainCookies_clouddata.length > 0) {
                                                for (const cookie of domainCookies_clouddata) {
                                                    domain_cloudCookie.push(`${cookie.name}:${cookie.value}`);
                                                }
                                                break;
                                            } else {
                                                TextOPFunc("域名:\"" + domain + "\"在云端Cookie数据没有数据,尝试上传此站点的本地cookie数据...");
                                                let domainCookieData = await getDomainCookie(domainKey);
                                                if (!domainCookieData) {
                                                    TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                                                } else {
                                                    CookieData.cookie_data[domainKey] = domainCookieData;
                                                    TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                                                    Waiting_for_upload[domainKey] = [];
                                                }
                                                ;
                                            }
                                        }
                                    }
                                    if (arraysAreEqual(domain_cloudCookie, domain_localCookie)) {
                                        TextOPFunc("域名:\"" + domain + "\"的Cookie数据没有变化,跳过处理。");
                                        continue;
                                    } else {
                                        TextOPFunc("域名:\"" + domain + "\"的Cookie数据检测到变化,正在处理...");
                                        // 处理云端数据cookie中可能的重复键值
                                        if (cookie_key_Array) {
                                            for (let index2 = 0; index2 < cookie_key_Array.length; index2++) {
                                                const element2 = cookie_key_Array[index2];
                                                let domain_cookie_key_words = '';
                                                if (element2.key == domain) {
                                                    domain_cookie_key_words = element2.value;
                                                    TextOPFunc("域名:" + domain + "的cookie检测关键词 " + domain_cookie_key_words);
                                                    break;
                                                }
                                            }
                                            // 如果该站点已设置关键词,检测数据关键词
                                            if (domain_cookie_key_words.length > 0) {
                                                // 本地数据或云端数据 其中之一包含关键词
                                                let cloudCookie_include_key_words_number = include_key_words_number(filterUniqueKeyValuePairs(domain_cloudCookie), domain_cookie_key_words);
                                                let localCookie_include_key_words_number = include_key_words_number(filterUniqueKeyValuePairs(domain_localCookie), domain_cookie_key_words);
                                                if (localCookie_include_key_words_number == 0 && cloudCookie_include_key_words_number > 0) {
                                                    TextOPFunc("域名:\"" + domain + "\"仅云端Cookie数据包含关键词,尝试使用云端数据并覆盖本地...");
                                                    await AllDomainCookiesInput(CookieData, domain);
                                                    continue;
                                                } else if (localCookie_include_key_words_number > 0 && cloudCookie_include_key_words_number == 0) {
                                                    TextOPFunc("域名:\"" + domain + "\"仅本地Cookie数据含关键词,尝试上传此站点的本地cookie数据...");
                                                    let domainCookieData = await getDomainCookie(domain);
                                                    if (!domainCookieData) {
                                                        TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                                                        continue;
                                                    } else {
                                                        CookieData.cookie_data[domain] = domainCookieData;
                                                        TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                                                        Waiting_for_upload[domain] = [];
                                                        continue;
                                                    }
                                                } else if (localCookie_include_key_words_number == 0 && cloudCookie_include_key_words_number == 0) {
                                                    TextOPFunc("提醒: 域名\"" + domain + "\"本地与云端Cookie数据 均不包含关键词,暂不处理。");
                                                    continue;
                                                } else if (localCookie_include_key_words_number > cloudCookie_include_key_words_number) {
                                                    TextOPFunc("域名\"" + domain + "\"本地与云端Cookie数据 均包含关键词,但本地数据包含数量更多,此站点 本地数据 视为有效数据,尝试上传此站点的本地cookie数据...");
                                                    let domainCookieData = await getDomainCookie(domain);
                                                    if (!domainCookieData) {
                                                        TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                                                        continue;
                                                    } else {
                                                        CookieData.cookie_data[domain] = domainCookieData;
                                                        TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                                                        Waiting_for_upload[domain] = [];
                                                        continue;
                                                    }
                                                } else if (localCookie_include_key_words_number < cloudCookie_include_key_words_number) {
                                                    TextOPFunc("域名\"" + domain + "\"本地与云端Cookie数据 均包含关键词,但云端数据包含数量更多,此站点 云端数据 视为有效数据,尝试使用云端数据并覆盖本地...");
                                                    await AllDomainCookiesInput(CookieData, domain);
                                                    continue;
                                                } else if (localCookie_include_key_words_number != 0 && cloudCookie_include_key_words_number != 0 && localCookie_include_key_words_number == cloudCookie_include_key_words_number) {
                                                    TextOPFunc("域名\"" + domain + "\"本地与云端Cookie数据均包含关键词,但本地与云端数据包含数量相同,此站点 本地与云端数据 均视为有效数据,尝试继续处理...");
                                                }
                                            } else {
                                                // 本地数据或云端数据 均不包含关键词
                                                TextOPFunc("域名:\"" + domain + "\"未设置监测关键词,暂不处理cookie数据关键词相关操作。");
                                                continue;
                                            }
                                        }
                                        // 处理云端数据cookie中可能的重复键,清除本地数据与云端数据中 重复 键与值,再次对比
                                        TextOPFunc("检测是否仅cookie键重复...");
                                        let return_domain_cloudCookie = removeNullValues(filterUniqueKeyValuePairs(domain_cloudCookie));
                                        let return_domain_localCookie = removeNullValues(filterUniqueKeyValuePairs(domain_localCookie));
                                        TextOPFunc("重复键已临时修正,正在继续对比处理...");
                                        if (arraysAreEqual(return_domain_cloudCookie, return_domain_localCookie)) {
                                            TextOPFunc("域名:\"" + domain + "\"的云端Cookie数据临时修正后与本地数据一致,尝试上传此站点的本地cookie数据...");
                                            let domainCookieData = await getDomainCookie(domain);
                                            if (!domainCookieData) {
                                                TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                                            } else {
                                                CookieData.cookie_data[domain] = domainCookieData;
                                                TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                                                Waiting_for_upload[domain] = [];
                                            }
                                        } else {
                                            TextOPFunc("域名:\"" + domain + "\"的云端Cookie数据临时修正后与本地数据不一致,继续处理..");
                                            TextOPFunc("检测本地与云端数据相似度");
                                            let score = calculateSimilarity(return_domain_cloudCookie, return_domain_localCookie);
                                            if (score >= 50) {
                                                TextOPFunc("提醒: 检测到域名:\"" + domain + "\"的本地与云端数据相似度很高,该站点cookie数据暂不处理...");
                                                TextOPFunc(domain + "本地数据: " + JSON.stringify(domain_localCookie));
                                                TextOPFunc(domain + "云端数据: " + JSON.stringify(domain_cloudCookie));
                                            } else if (score = 0 && return_domain_cloudCookie.length >= 3 && return_domain_localCookie.length >= 3) {
                                                TextOPFunc("提醒: 检测到域名:\"" + domain + "\"的本地与云端数据完全不相似,该站点cookie数据暂不处理。");
                                            } else {
                                                TextOPFunc("检测到本地与云端数据相似度低,继续处理...");
                                                if (return_domain_cloudCookie.length > return_domain_localCookie.length) {
                                                    TextOPFunc("云端数据 去重后内容多,优先视为有效数据,尝试使用云端数据并覆盖本地...");
                                                    TextOPFunc(domain + "云端数据: " + JSON.stringify(return_domain_cloudCookie));
                                                    TextOPFunc(domain + "本地数据: " + JSON.stringify(return_domain_localCookie));
                                                    await AllDomainCookiesInput(CookieData, domain);
                                                } else if (return_domain_cloudCookie.length == return_domain_localCookie.length) {
                                                    TextOPFunc(domain + "云端数据: " + JSON.stringify(return_domain_cloudCookie));
                                                    TextOPFunc(domain + "本地数据: " + JSON.stringify(return_domain_localCookie));
                                                    TextOPFunc("本地数据 与 云端数据 去重后内容长度相同,该站点cookie数据暂不处理。");
                                                } else {
                                                    TextOPFunc("本地数据 去重后内容多,优先视为有效数据,尝试上传此站点的本地cookie数据...");
                                                    TextOPFunc(domain + "云端数据: " + JSON.stringify(return_domain_cloudCookie));
                                                    TextOPFunc(domain + "本地数据: " + JSON.stringify(return_domain_localCookie));
                                                    let domainCookieData = await getDomainCookie(domain);
                                                    if (!domainCookieData) {
                                                        TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                                                    } else {
                                                        CookieData.cookie_data[domain] = domainCookieData;
                                                        TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                                                        Waiting_for_upload[domain] = [];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    TextOPFunc("域名:\"" + domain + "\"没有本地Cookie数据,尝试从云端下载获取数据并覆盖...");
                                    await AllDomainCookiesInput(CookieData, domain);
                                }
                            }
                        }
                        if (Object.keys(Waiting_for_upload).length > 0) {
                            TextOPFunc("收藏夹站点cookie检测操作完成,待上传更新数据的站点数:\"" + Object.keys(Waiting_for_upload).length + "\"");
                            let upload_response = await uploadToServer(CookieData.cookie_data);
                            if (upload_response) {
                                TextOPFunc("当前收藏夹站点的本地与云端数据检测操作完成。数据已上传云端、覆盖本地更新。");
                            } else {
                                TextOPFunc("提示: 当前收藏夹站点的本地与云端数据检测操作完成。但数据已上传失败,请检查问题,或待下一次运行尝试重新检测与上传");
                            }
                        } else {
                            TextOPFunc("没有待上传更新云端数据的站点。");
                            TextOPFunc("当前收藏夹站点的本地与云端数据检测操作完成。数据已下载覆盖更新。");
                        }
                    }
                }
            } else {
                TextOPFunc("提示: 检测到 没有设置待监控的 浏览器标签目录。");
            }
        }
    } catch (error) {
        TextOPFunc("错误,根据选定的浏览器收藏夹内标签的url判断对应站点在本地cookie值操作 出现 Error: " + "\n" + " " + error.message + "\n" + " " + error.stack);
    }
}

// 创建右键菜单
chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
        type: 'normal',
        title: "获取当前页面的cookie到剪贴板",
        id: 'menu_get_cookie',
        contexts: ['all']
    });
});
// 监听状态变化 更新右键菜单
chrome.storage.onChanged.addListener(async function(changes, areaName) {
    if (changes.text_state) {
        let state_green_dot = await getChromeStorageData('state_green_dot')
        if (state_green_dot == "block") {
            chrome.contextMenus.create({
                type: 'normal',
                title: "获取云端的cookie覆盖并跳转站点首页",
                id: 'menu_get_cloudCookie_and_Refresh_Page',
                contexts: ['all']
            });
            chrome.storage.local.set({"menu_get_cloudCookie_and_Refresh_Page": "true"});
        } else if (state_green_dot == "none") {
            let menu_get_cloudCookie_and_Refresh_Page = await getChromeStorageData('menu_get_cloudCookie_and_Refresh_Page')
            if (menu_get_cloudCookie_and_Refresh_Page == "true") {
                chrome.contextMenus.remove('menu_get_cloudCookie_and_Refresh_Page');
            }
        } else {
            ;
        }
    }
});

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(
    async (info, currentTab) => {
       if(info.menuItemId=='menu_get_cookie'){
            if (currentTab.url.includes("http://") || currentTab.url.includes("https://")) {
                let domainCookieData = await menu_getDomainCookie(new URL(currentTab.url).hostname);
                chrome.tabs.sendMessage(currentTab.id,{clipboard:domainCookieData},(response) => {
                    if (chrome.runtime.lastError) {
                        console.log("background发送给contentScript消息时出错:", chrome.runtime.lastError.message);
                    } else {
                        console.log("background接收到信息:", response);
                    }
                });
            } else {
                console.log('当前页面无法实现此操作!');
            }
        }
        if(info.menuItemId=='menu_get_cloudCookie_and_Refresh_Page'){
            if (currentTab.url.includes("http://") || currentTab.url.includes("https://")) {
                let urlObject = new URL(currentTab.url);
                let protocol = urlObject.protocol;
                let hostname = urlObject.hostname;
                let protocolAndHostname = protocol + "//" + hostname;
                chrme.tabs.stop(currentTab.id);
                await menu_geturlCookiesAndRefresh_Page(hostname);
                chrome.tabs.sendMessage(currentTab.id,{RefreshPage:protocolAndHostname},(response) => {
                    if (chrome.runtime.lastError) {
                        console.log("background发送给contentScript消息时出错:", chrome.runtime.lastError.message);
                    } else {
                        console.log("background接收到信息:", response);
                    }
                });
            } else {
                console.log('当前页面无法实现此操作!');
            }
        }
    }
)