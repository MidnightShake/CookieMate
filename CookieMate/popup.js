const window_isPopup = true;
const window_isServiceWorker = false;

// 加载页面完成时执行的回调函数
document.addEventListener('DOMContentLoaded', async () => {

  // 定义url、密钥、uuid 输入框的引用位置
  const urlInput = document.getElementById('url');
  const keyInput = document.getElementById('key');
  const uuidInput = document.getElementById('uuid');

  // 尝试从 localStorage 中读取url、密钥、uuid
  const storedUrl = await getChromeStorageData('url');
  const storedKey = await getChromeStorageData('key');
  const storedUUID = await getChromeStorageData('uuid');
  // 如果 localStorage 中有保存的数据,则将其填充到密钥输入框
  if (storedUrl) {
    urlInput.value = storedUrl.substring(0, 64);
  }
  if (storedKey) {
    keyInput.value = storedKey.substring(0, 22);
  }
  if (storedUUID) {
    uuidInput.value = storedUUID.substring(0, 22);
  }

  // 监听随机生成按钮 生成16位的随机字符串
  document.getElementById('random_uuidBtn').addEventListener('click', random_uuid);
  document.getElementById('random_keyBtn').addEventListener('click', random_key);
  // 监听 保存 按钮
  document.getElementById("savebutton").addEventListener("click", saveFunc);
  // 监听 测试连接 按钮
  document.getElementById('textbutton').addEventListener('click', TextFunc);
  // 监听 监测目录 按钮
  document.getElementById("createSelectAndMonitorkeywordBtn").addEventListener("click", create_Select_and_Monitor_keyword);
  // 监听 定时任务 按钮
  document.getElementById("CronJobBtn").addEventListener("click", CronJob);
  // 监听 获取并显示 当前页面 的cookie 按钮
  document.getElementById("getCurrentCookiesBtn").addEventListener("click", getCurrentCookies);
  // 监听 获取并显示 当前页面 在云端 的Cookie 按钮
  document.getElementById('geturlCookiesBtn').addEventListener('click', geturlCookiesBtn);
  // 根据 输入框内容 覆盖修改当前页面的cookie
  document.getElementById("overwriteCookiesBtn").addEventListener("click", overwriteCookies);
  // 监听 跳转当前页面首页 按钮,刷新跳转当前页面首页
  document.getElementById('Refresh_PageBtn').addEventListener('click', Refresh_Page);
  // 获取并显示 云端储存 的所有 域名 列表
  document.getElementById('showAllDomainBtn').addEventListener('click', showAllDomain);
  // 根据输入框 域名列表 获取云端数据并导入对应本地cookies
  document.getElementById('AllDomainInputBtn').addEventListener('click', AllDomainInput);

  // 获取当前页面本地cookie并覆盖修改云端 单站点 数据
  document.getElementById('SingleCoverageCookiesBtn').addEventListener('click', SingleCoverageCookies);
  // 根据 站点域名列表 获取对应本地cookie,并覆盖到云端对应站点cookies数据
  document.getElementById('AllDomainCoverageCookiesBtn').addEventListener('click', AllDomainCoverageCookies);

  // 显示上次测试连接状态
  document.getElementById("state_green_dot").style.display = await getChromeStorageData('state_green_dot') || 'block';
  document.getElementById("state_red_dot").style.display = await getChromeStorageData('state_red_dot') || 'block';
  Test_failed_Disable_button_style(await getChromeStorageData('text_state') || false);

  chrome.storage.local.set({'Cron_page': false});
  chrome.storage.local.set({'Set_monitoring_Keywords_page': false});
  chrome.storage.local.set({'createSelect_page': false});

  await displayLogsFromLocalStorage();
});

// 清除其他功能生成的页面元素
function clean_pageFun(pageId) {
  let pageId_array = [
    'Cron_page',
    'Set_monitoring_Keywords_page',
    'createSelect_page'
  ]
  pageId_array.forEach(element => {
    if (element !== pageId) {
      let elementToRemove = document.getElementById(element);
      if (elementToRemove) {
          elementToRemove.remove();
      }
    }
  });
}

// 保存用户数据
async function saveFunc() {
  clean_pageFun();
  let urlInput = document.getElementById('url');
  let keyInput = document.getElementById('key');
  let uuidInput = document.getElementById('uuid');
  chrome.storage.local.set({ 'url': sanitizeInput(urlInput.value) });
  chrome.storage.local.set({ 'key': sanitizeInput(keyInput.value) });
  chrome.storage.local.set({ 'uuid': sanitizeInput(uuidInput.value) });
  TextOPFunc("用户数据已保存。请尝试连接云服务器!");
}

// 测试连接性函数
async function TextFunc() {
  try {
    clean_pageFun();
    let urlInput = document.getElementById('url');
    let uuidInput = document.getElementById('uuid');
    let keyInput = document.getElementById('key');
    chrome.storage.local.set({ 'url': sanitizeInput(urlInput.value) });
    chrome.storage.local.set({ 'uuid': sanitizeInput(uuidInput.value) });
    chrome.storage.local.set({ 'key': sanitizeInput(keyInput.value) });
    TextOPFunc("用户数据已保存。");
    if (!sanitizeInput(urlInput.value)) {
      TextOPFunc('请输入云端服务器地址?!');
      alert('请输入云端服务器地址?!');
      return false;
    } else if (!sanitizeInput(uuidInput.value)) {
      TextOPFunc('请输入用户UUID?!');
      alert('请输入用户UUID?!');
      return false;
    } else if (!sanitizeInput(keyInput.value)) {
      TextOPFunc('请输入端对端加密key?!');
      alert('请输入端对端加密key?!');
      return false;
    }
    TextOPFunc("开始尝试连接云服务器...");
    let Test_connectivity_response = await Test_connectivity_cloud_server(sanitizeInput(urlInput.value));
    let test_result = false;
    if (Test_connectivity_response) {
      if (Test_connectivity_response == "Error") {
        stateFunc(urlInput, keyInput, uuidInput, test_result);
        TextOPFunc("测试连接云服务器失败!请检查 云端服务器地址是否输入正确? 或本地网络连通性是否正常?!");
        alert('测试连接云服务器失败!请检查 云端服务器地址是否输入正确? 或本地网络连通性是否正常?!');
        return false;
      }
      TextOPFunc("连接云服务器成功，开始尝试下载数据...");
      let download_response = await downloadForServer();
      if (!download_response) {
        stateFunc(urlInput, keyInput, uuidInput, test_result);
        TextOPFunc("云服务器可连接,但尝试下载数据失败! 测试连接云服务器失败!");
        alert('云服务器可连接,但尝试下载数据失败! 测试连接云服务器失败!');
        return false;
      } else if (download_response == 'uuid?') {
        stateFunc(urlInput, keyInput, uuidInput, test_result);
        if (confirm('云服务器可连接,但未检测到此UUID用户数据。是否尝试新建云端用户基础数据?')) {
          let upload_response = await uploadToServer({});
          if (upload_response) {
            TextOPFunc("云端成功新增用户基础数据,重新开始测试...");
            await TextFunc();
          } else {
            TextOPFunc("云端新增用户基础数据失败,请检查网络连接是否正常?!");
            alert("云端新增用户基础数据失败,请检查网络连接是否正常?!");
            return false;
          }
        } else {
          TextOPFunc("已取消 新增用户基础数据");
          return false;
        }
      } else {
        const CookieData = await decrypt_func(download_response.encrypted);
        if (CookieData) {
          stateFunc(urlInput, keyInput, uuidInput, true);
          TextOPFunc("测试连接云服务器通过!");
          alert('测试连接云服务器通过!');
        } else {
          stateFunc(urlInput, keyInput, uuidInput, test_result);
          TextOPFunc("云服务器可连接,但尝试解密已下载的用户数据失败! 请检查端对端加密key是否正确?! 测试连接云服务器失败!");
          alert('云服务器可连接,但尝试解密已下载的用户数据失败! 请检查端对端加密key是否正确?! 测试连接云服务器失败!');
          return false;
        }
      }
    } else {
      stateFunc(urlInput, keyInput, uuidInput, test_result);
      TextOPFunc("尝试连接云服务器失败!请检查 云端服务器地址是否输入正确? 或本地网络连通性是否正常?!");
      alert('尝试连接云服务器失败!请检查 云端服务器地址是否输入正确? 或本地网络连通性是否正常?!');
      return false;
    }
  } catch (error) {
    TextOPFunc("错误,测试Error: " + "\n" + " " + error.message + "\n" + " " + error.stack);
  }
}

// 根据站点cookie监测关键词监测并更新本地cookies
async function create_Select_and_Monitor_keyword() {
  clean_pageFun();
  let domain_Cookie_Key_Array = await getChromeStorageData('domain_Cookie_Key');
  if (domain_Cookie_Key_Array) {
    if (domain_Cookie_Key_Array.length > 0) {
      TextOPFunc('检测到已储存的检测关键词: ' + "\n" + String(domain_Cookie_Key_Array));
      if (confirm('是否 修改 已储存的监测关键词?')) {
        await Set_monitoring_Keywords(JSON.parse(domain_Cookie_Key_Array));
        if (confirm('是否 删除 已储存的所有监测关键词?')) {
          chrome.storage.local.remove('domain_Cookie_Key');
        } else {
          ;
        }
      } else {
        ;
      }
    }
  } else {
    let domain_urls = JSON.parse(await getChromeStorageData('saved_Favorite_selection_id_title_ursl') || '{}').urls;
    if (String(domain_urls) == 'undefined') {
      TextOPFunc('检测到未指定浏览器收藏夹。');
      if (confirm('检测到未指定浏览器收藏夹,是否选择浏览器收藏夹? ' + "\n" + '(自动检测其中站点标签的cookie数据)')) {
        await createSelect();
      } else {
        TextOPFunc('已取消指定监测浏览器收藏夹。');
      }
    } else {
      let Favorite_selection_title = JSON.parse(await getChromeStorageData('saved_Favorite_selection_id_title_ursl') || '{}').title
      if (confirm('检测到已指定浏览器收藏夹' + '<' + Favorite_selection_title + "> " + ' 是否修改选择其他浏览器收藏夹?')) {
        await createSelect();
      } else {
        TextOPFunc('已取消选择其他监测浏览器收藏夹。');
        TextOPFunc('检测到已指定浏览器收藏夹' + '<' + Favorite_selection_title + "> " + ',但是未设置站点cookie检测关键词。');
        if (confirm('检测到已指定浏览器收藏夹' + '<' + Favorite_selection_title + "> " + "\n" + '但是未设置站点cookie检测关键词。' + "\n" + '是否设置站点cookie检测关键词?' + "\n" + '(例如 获取到的cookie数据为: aaa:bbb123,bbb:ccc123 如果设置的检测关键词为 aaa ,当获取到站点cookie数据时,会检测是否包含 aaa ,如果包含,则判断获取到的cookie数据为有效数据并保存)')) {
          let cookie_key_Array = [];
          domain_urls.forEach(domain => {
            cookie_key_Array.push({ key: new URL(domain).hostname, value: "" });
          });
          await Set_monitoring_Keywords(cookie_key_Array);
        } else {
          TextOPFunc('已取消设置站点cookie检测关键词。');
        }
      }
    }
  }
}

// 定时任务函数
async function CronJob() {
  clean_pageFun();
  let Cron_switch =  await getChromeStorageData('Cron_switch') || '0';
  let CronTime =  await getChromeStorageData('CronTime') || '0';

  let formElement = document.createElement('form');
  formElement.id = 'Cron_page';
  let title = document.createElement('div');
  title.textContent = '↓ ↓ ↓ 设置定时任务 ↓ ↓ ↓';
  title.style.fontSize = '15px';
  title.style.textAlign = 'center';
  title.style.color = 'rgb(255, 255, 255)';
  formElement.appendChild(title);

  let rowElement = document.createElement('div');
  rowElement.style.display = 'flex';
  rowElement.style.padding = '2px';
  rowElement.style.borderRadius = '5px';
  rowElement.style.backgroundColor = '#3b3939';
  rowElement.style.height = '30px';
  rowElement.style.alignItems = 'center';
  rowElement.style.justifyContent = 'center';

  let label_input1 = document.createElement('label');
  label_input1.style.whiteSpace = 'nowrap';
  label_input1.style.color = 'rgb(255, 255, 255)';
  label_input1.textContent = '周期:';
  label_input1.style.width = '35px';
  rowElement.appendChild(label_input1);

  let input_cronTime = document.createElement('input');
  input_cronTime.style.textAlign = 'right';
  input_cronTime.value = CronTime;
  input_cronTime.style.width = '30px';
  input_cronTime.style.border = '1px solid #6d6969';
  input_cronTime.style.backgroundColor = '#6d6969';
  input_cronTime.style.color = 'rgb(255, 255, 255)';
  input_cronTime.style.borderRadius = '5px';
  input_cronTime.addEventListener('mouseenter', function () {
    this.style.border = '1px solid #6fb6d4';
  });
  input_cronTime.addEventListener('mouseleave', function () {
    this.style.border = '1px solid #6d6969';
  });
  rowElement.appendChild(input_cronTime);

  let label_input2 = document.createElement('label');
  label_input2.style.whiteSpace = 'nowrap';
  label_input2.style.color = 'rgb(255, 255, 255)';
  label_input2.textContent = '分钟/次';
  label_input2.style.width = '80px';
  rowElement.appendChild(label_input2);

  let label_toggleSwitch = document.createElement('label');
  label_toggleSwitch.style.whiteSpace = 'nowrap';
  label_toggleSwitch.style.color = 'rgb(255, 255, 255)';
  label_toggleSwitch.textContent = '启动开关:';
  label_toggleSwitch.style.width = '55px';
  rowElement.appendChild(label_toggleSwitch);

  let toggleSwitch = document.createElement('input');
  toggleSwitch.type = 'range';
  toggleSwitch.min = '0';
  toggleSwitch.max = '1';
  toggleSwitch.step = '1';
  toggleSwitch.value = Cron_switch;
  toggleSwitch.addEventListener('mouseenter', function () {
    this.style.border = '1px solid #6fb6d4';
  });
  toggleSwitch.addEventListener('mouseleave', function () {
    this.style.border = '1px solid #565656';
  });
  toggleSwitch.addEventListener('input', function() {
    if (toggleSwitch.value === '1') {
        toggleSwitch.style.background = '#6fb6d4';
        chrome.storage.local.set({'Cron_switch': '1'});
        let updatedArray = [];
        Array.from(formElement.elements).forEach((element, index) => {
          if (element.tagName === 'INPUT') {
            updatedArray.push( element.value );
          }
        });
        if (updatedArray[0] > 0) {
          chrome.storage.local.set({ 'CronTime': updatedArray[0] });
          Connection_background('Connection_background','set_CronFun');
          TextOPFunc('已开启定时任务。');
        } else {
          alert('启定时任务启动出错! 请填入定时周期时间! 并重新启动定时任务,否则定时任务不会运行。');
        }
    } else {
        toggleSwitch.style.background = '#ccc';
        chrome.storage.local.set({'Cron_switch': '0'});
        Connection_background('Connection_background','set_CronFun');
        TextOPFunc('已关闭定时任务。');
    }
  });

  toggleSwitch.style.appearance = 'none';
  toggleSwitch.style.width = '50px';
  toggleSwitch.style.height = '20px';
  if (Cron_switch == '1') {
    toggleSwitch.style.background = '#6fb6d4';
  } else {
    toggleSwitch.style.background = '#ccc';
  }
  toggleSwitch.style.outline = 'none';
  toggleSwitch.style.cursor = 'pointer';

  toggleSwitch.style.borderRadius = '34px';
  rowElement.appendChild(toggleSwitch);

  formElement.appendChild(rowElement);
  document.body.appendChild(formElement);
}

// 设置站点的cookie监测关键词
async function Set_monitoring_Keywords(dictionaryArray) {
  try {
    clean_pageFun();
    let formElement = document.createElement('form');
    formElement.id = 'Set_monitoring_Keywords_page';

    let title = document.createElement('div');
    title.textContent = '↓ ↓ ↓ 设置站点的cookie监测关键词 ↓ ↓ ↓';
    title.style.fontSize = '15px';
    title.style.textAlign = 'center';
    title.style.color = 'rgb(255, 255, 255)';
    formElement.appendChild(title);
    let submitButton_Cancel_start = document.createElement('button');
    submitButton_Cancel_start.textContent = '取消修改';
    submitButton_Cancel_start.style.width = '150px';
    submitButton_Cancel_start.style.border = '1px solid #222222';
    submitButton_Cancel_start.style.borderRadius = '5px';
    submitButton_Cancel_start.style.backgroundColor = '#565656';
    submitButton_Cancel_start.style.color = 'rgb(255, 255, 255)';
    submitButton_Cancel_start.style.marginTop = '5px';
    submitButton_Cancel_start.style.marginBottom = '5px';
    submitButton_Cancel_start.style.marginLeft = '20px';
    submitButton_Cancel_start.style.marginRight = '20px';
    submitButton_Cancel_start.addEventListener('mouseenter', function () {
      this.style.border = '1px solid #6fb6d4';
      this.style.backgroundColor = '#6fb6d4';
    });
    submitButton_Cancel_start.addEventListener('mouseleave', function () {
      this.style.border = '1px solid #222222';
      this.style.backgroundColor = '#565656';
    });
    submitButton_Cancel_start.addEventListener('click', () => {
      TextOPFunc('已取消修改站点cookie检测关键词。');
    });

    let submitButton_OK_start = document.createElement('button');
    submitButton_OK_start.textContent = '保存修改';
    submitButton_OK_start.style.width = '150px';
    submitButton_OK_start.style.border = '1px solid #222222';
    submitButton_OK_start.style.borderRadius = '5px';
    submitButton_OK_start.style.backgroundColor = '#565656';
    submitButton_OK_start.style.color = 'rgb(255, 255, 255)';
    submitButton_OK_start.addEventListener('mouseenter', function () {
      this.style.border = '1px solid #6fb6d4';
      this.style.backgroundColor = '#6fb6d4';
    });
    submitButton_OK_start.addEventListener('mouseleave', function () {
      this.style.border = '1px solid #222222';
      this.style.backgroundColor = '#565656';
    });
    submitButton_OK_start.addEventListener('click', () => {
      let updatedArray = [];
      Array.from(formElement.elements).forEach((element, index) => {
        if (element.tagName === 'INPUT') {
          let key = element.previousElementSibling.textContent;
          let value = element.value;
          updatedArray.push({ key: key, value: sanitizeInput([value]) });
        }
      });
      if (updatedArray.length > 0) {
        chrome.storage.local.set({ 'domain_Cookie_Key': JSON.stringify(updatedArray) });
        alert('已储存站点cookie检测关键词。');
        TextOPFunc('已储存站点cookie检测关键词。');
      } else {
        alert('处理监测站点的cookie关键词出错,内容为空,结果未保存。');
      }
    });
    formElement.appendChild(submitButton_Cancel_start);
    formElement.appendChild(submitButton_OK_start);

    dictionaryArray.forEach((item, index) => {
      let rowElement = document.createElement('div');
      rowElement.style.display = 'flex';
      rowElement.style.padding = '2px';
      rowElement.style.borderRadius = '5px';
      rowElement.style.backgroundColor = '#3b3939';

      let number = document.createElement('label');
      number.textContent = ' [' + index + ']    ';
      number.style.flex = '0 0 30px';
      number.style.color = 'rgb(255, 255, 255)';

      let keyElement = document.createElement('label');
      keyElement.textContent = item.key;
      keyElement.style.flex = '1 1 50%';
      keyElement.style.color = 'rgb(255, 255, 255)';
      keyElement.addEventListener('mouseenter', function () {
        this.style.border = '1px solid #6fb6d4';
      });
      keyElement.addEventListener('mouseleave', function () {
        this.style.border = '1px solid #3b3939';
      });
      keyElement.setAttribute('for', 'inputElement-' + index);

      let inputElement = document.createElement('input');
      inputElement.setAttribute('id', 'inputElement-' + index);
      inputElement.value = item.value;
      inputElement.style.flex = '0 1 50px';
      inputElement.style.border = '2px solid #565656';
      inputElement.style.backgroundColor = '#565656';
      inputElement.style.color = 'rgb(255, 255, 255)';
      inputElement.addEventListener('mouseenter', function () {
        this.style.border = '1px solid #6fb6d4';
      });
      inputElement.addEventListener('mouseleave', function () {
        this.style.border = '1px solid #565656';
      });

      rowElement.appendChild(number);
      rowElement.appendChild(keyElement);
      rowElement.appendChild(inputElement);
      formElement.appendChild(rowElement);
    });

    let submitButton_Cancel_end = document.createElement('button');
    submitButton_Cancel_end.textContent = '取消修改';
    submitButton_Cancel_end.style.width = '150px';
    submitButton_Cancel_end.style.border = '1px solid #222222';
    submitButton_Cancel_end.style.borderRadius = '5px';
    submitButton_Cancel_end.style.backgroundColor = '#565656';
    submitButton_Cancel_end.style.color = 'rgb(255, 255, 255)';
    submitButton_Cancel_end.style.marginTop = '5px';
    submitButton_Cancel_end.style.marginBottom = '5px';
    submitButton_Cancel_end.style.marginLeft = '20px';
    submitButton_Cancel_end.style.marginRight = '20px';
    submitButton_Cancel_end.addEventListener('mouseenter', function () {
      this.style.border = '1px solid #6fb6d4';
      this.style.backgroundColor = '#6fb6d4';
    });
    submitButton_Cancel_end.addEventListener('mouseleave', function () {
      this.style.border = '1px solid #222222';
      this.style.backgroundColor = '#565656';
    });
    submitButton_Cancel_end.addEventListener('click', () => {
      TextOPFunc('已取消修改站点cookie检测关键词。');
    });

    let submitButton_OK_end = document.createElement('button');
    submitButton_OK_end.textContent = '保存修改';
    submitButton_OK_end.style.width = '150px';
    submitButton_OK_end.style.border = '1px solid #222222';
    submitButton_OK_end.style.borderRadius = '5px';
    submitButton_OK_end.style.backgroundColor = '#565656';
    submitButton_OK_end.style.color = 'rgb(255, 255, 255)';
    submitButton_OK_end.addEventListener('mouseenter', function () {
      this.style.border = '1px solid #6fb6d4';
      this.style.backgroundColor = '#6fb6d4';
    });
    submitButton_OK_end.addEventListener('mouseleave', function () {
      this.style.border = '1px solid #222222';
      this.style.backgroundColor = '#565656';
    });
    submitButton_OK_end.addEventListener('click', () => {
      let updatedArray = [];
      Array.from(formElement.elements).forEach((element, index) => {
        if (element.tagName === 'INPUT') {
          let key = element.previousElementSibling.textContent;
          let value = element.value;
          updatedArray.push({ key: key, value: sanitizeInput(value) });
        }
      });
      if (updatedArray.length > 0) {
        chrome.storage.local.set({ 'domain_Cookie_Key': JSON.stringify(updatedArray) });
        alert('已储存站点cookie检测关键词。');
        TextOPFunc('已储存站点cookie检测关键词。');
      } else {
        alert('处理监测站点的cookie关键词出错,内容为空,结果未保存。');
      }
    });
    formElement.appendChild(submitButton_Cancel_end);
    formElement.appendChild(submitButton_OK_end);
    document.body.appendChild(formElement);
  } catch (error) {
    TextOPFunc("处理监测站点的cookie关键词出错: " + error.message + "\n" + " " + error.stack);
  }
}

// 递归获取所有文件夹及其子文件夹结构
function getFoldersRecursively(node, folderList, depth) {
  if (node.children) {
    node.children.forEach((child) => {
      let prefix = "\u00A0".repeat(depth) + "└ > ";
      if (child.children && child.children.length > 0) {
        folderList.push({ id: child.id, title: prefix + child.title, original_title: child.title });
        getFoldersRecursively(child, folderList, depth + 7);
      }
    });
  }
}

// 获取文件夹中的标签 URL
function getBookmarksInFolder(folderId) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getChildren(folderId, (children) => {
      const urls = children.filter((child) => child.url).map((child) => child.url);
      if (urls) {
        resolve(urls);
      } else {
        resolve(false);
      }
    });
  });
}

// 获取收藏夹标签创建选择菜单
async function createSelect() {
  try {
    clean_pageFun();
    const bookmarkTreeNodes = await new Promise((resolve, reject) => {
      chrome.bookmarks.getTree((nodes) => resolve(nodes));
    });
    const foldersList = [];
    getFoldersRecursively(bookmarkTreeNodes[0], foldersList, 0);
    const select = document.createElement('select');
    select.id = 'createSelect_page';
    select.classList.add('select-box');
    select.style.padding = '5px';
    select.style.fontSize = '12px';
    select.style.border = '1px solid #222222';
    select.style.borderRadius = '5px';
    select.style.width = '285px';
    select.style.backgroundColor = '#565656';
    select.style.color = 'rgb(255, 255, 255)';
    select.addEventListener('mouseenter', function () {
      this.style.border = '1px solid #6fb6d4';
    });
    select.addEventListener('mouseleave', function () {
      this.style.border = '1px solid #222222';
    });
    let localStorage_Id_Title = await getChromeStorageData('saved_Favorite_selection_id_title_ursl');
    if (localStorage_Id_Title) {
      if (localStorage_Id_Title.length > 0) {
        let default_Id_Title = JSON.parse(localStorage_Id_Title);
        const localStorage_defaultOption = document.createElement('option');
        localStorage_defaultOption.value = default_Id_Title.id;
        localStorage_defaultOption.text = "上一次已选择收藏夹: " + default_Id_Title.title;
        let isRelated = false;
        for (let index = 0; index < foldersList.length; index++) {
          const element = foldersList[index];
          if (element.id === default_Id_Title.id) {
            isRelated = true;
            localStorage_defaultOption.text = "上一次已选择收藏夹: < " + element.original_title + ' >';
            break;
          }
        }
        if (!isRelated) {
          // 如果曾经已选文件夹不存在则提醒重选
          select.style.backgroundColor = '#ff0000';
          select.style.color = 'rgb(255, 255, 255)';
          localStorage_defaultOption.value = default_Id_Title.id;
          localStorage_defaultOption.text = "上一次选择的收藏夹<" + default_Id_Title.title + ">已不存在,请重新选择!";
        }
        // 设置当前选项 为首选默认显示状态
        localStorage_defaultOption.selected = true;
        select.appendChild(localStorage_defaultOption);
      } else {
        // 首次选择 添加默认显示选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = '请选择收藏夹...';
        defaultOption.selected = true;
        select.appendChild(defaultOption);
      }
    } else {
      // 首次选择 添加默认显示选项
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.text = '请选择收藏夹...';
      defaultOption.selected = true;
      select.appendChild(defaultOption);
    }
    // 根据收藏夹内容生成选项
    foldersList.forEach((folder) => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ id: folder.id, original_title: folder.original_title });
      option.text = folder.title;
      select.appendChild(option);
    });
    // 根据选择实时更新储存 选择的结果
    select.addEventListener('change', async () => {
      let selectedValue = JSON.parse(select.value);
      let selectedFolderId = selectedValue.id;
      let selectedFolderTitle = selectedValue.original_title;
      let urls = await getBookmarksInFolder(selectedFolderId);
      if (urls) {
        let element = ''
        urls.forEach(url => {
          let domain = new URL(url).hostname;
          element += domain + "\n"
        });
        if (confirm("请确认所选收藏夹是否正确" + "\n" + "↓ ↓ 收藏夹内标签 域名部分 ↓ ↓" + "\n" + element)) {
          chrome.storage.local.set({ 'saved_Favorite_selection_id_title_ursl': sanitizeInput(JSON.stringify({ id: selectedFolderId, title: selectedFolderTitle, urls: urls })) });
          TextOPFunc("已储存选择的 收藏夹: < " + selectedFolderTitle + " >");
        } else {
          TextOPFunc("已取消选择,未储存选择结果。");
        }
      } else {
        if (confirm("请确认所选收藏夹是否正确" + "\n" + "↓ ↓ 收藏夹内容 ↓ ↓" + "\n\n" + "~~~ 什么都没有 ~~~" + "\n\n" + "~~~ 如果确定后,请给这个收藏夹添加收藏标签 ~~~")) {
          chrome.storage.local.set({ 'saved_Favorite_selection_id_title_ursl': sanitizeInput(JSON.stringify({ id: selectedFolderId, title: selectedFolderTitle, urls: '' })) });
          TextOPFunc("已储存选择的 空收藏夹: < " + selectedFolderTitle + " >");
        } else {
          TextOPFunc("已取消选择,未储存选择结果。");
        }
      }
    });
    document.body.appendChild(select);
  } catch (error) {
    TextOPFunc("获取选定收藏夹标签内容出现错误: " + error.message + "\n" + " " + error.stack);
  }
}

// 使用DOMPurify过滤用户输入
function sanitizeInput(userInput) {
  const cleanInput = DOMPurify.sanitize(userInput);
  return cleanInput;
}

// 连接状态函数
function stateFunc(urlInput, keyInput, uuidInput, test_result) {
  try {
    if (urlInput !== "" && urlInput !== null && keyInput !== "" && keyInput !== null && uuidInput !== "" && uuidInput !== null && test_result) {
      document.getElementById("state_green_dot").style.display = "block";
      document.getElementById("state_red_dot").style.display = "none";
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#00FF00' });
      chrome.storage.local.set({ 'state_green_dot': "block" });
      chrome.storage.local.set({ 'state_red_dot': "none" });
      chrome.storage.local.set({ 'text_state': true });
      Test_failed_Disable_button_style(true);
    } else if (urlInput !== "" && urlInput !== null && keyInput !== "" && keyInput !== null && uuidInput !== "" && uuidInput !== null && !test_result) {
      document.getElementById("state_green_dot").style.display = "none";
      document.getElementById("state_red_dot").style.display = "block";
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      chrome.storage.local.set({ 'state_green_dot': "none" });
      chrome.storage.local.set({ 'state_red_dot': "block" });
      chrome.storage.local.set({ 'text_state': false });
      Test_failed_Disable_button_style(false);
      TextOPFunc("提示！请检查输入并修改错误!");
    } else {
      document.getElementById("state_green_dot").style.display = "none";
      document.getElementById("state_red_dot").style.display = "block";
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
      chrome.storage.local.set({ 'state_green_dot': "none" });
      chrome.storage.local.set({ 'state_red_dot': "block" });
      chrome.storage.local.set({ 'text_state': false });
      Test_failed_Disable_button_style(false);
      if (!urlInput) {
        TextOPFunc("请填写 云服务器地址!不能留空!");
      } else if (!uuidInput) {
        TextOPFunc("请填写 用户UUID!不能留空!");
      } else if (!keyInput) {
        TextOPFunc("请填写 端对端加密key!不能留空!");
      }
    }
  } catch (error) {
    TextOPFunc("错误,状态显示Error: " + "\n" + " " + error.message + "\n" + " " + error.stack);
  }
}

// 弹窗显示消息 
function pop_message(title, message) {
  let pop_message_data = {
    type: "basic",
    title: title,
    message: message,
    iconUrl: "icons/icon128.png"
  };
  chrome.notifications.create("", pop_message_data);
}

// 生成 16 位的随机字符串
async function generateRandomString() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 22; i++) {
    let randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }
  return randomString;
}

// 随机生成生成uuid key 并显示到插件页面
async function random_uuid() {
  document.getElementById('uuid').value = await generateRandomString();
}
async function random_key() {
  document.getElementById('key').value = await generateRandomString();
}

// 获取当前页面 远程 的Cookie 按钮 函数
async function geturlCookiesBtn() {
  const response = await downloadForServer();
  if (!response || response == 'uuid?') {
    return;
  } else {
    const decryptedText = await decrypt_func(response.encrypted);
    await domainToCookie(decryptedText);
  }
}

// 获取当前页面本地cookie并覆盖修改云端 单站点 数据
async function SingleCoverageCookies() {
  try {
    // 获取获取当前页面的cookie
    const domainCookieData = await getCurrentCookies();
    if (!domainCookieData) {
      return;
    } else {
      // 下载云数据
      const response = await downloadForServer();
      if (!response || response == 'uuid?') {
        return;
      }
      // 处理数据
      const CookieData = await decrypt_func(response.encrypted);
      const domainUrl = domainCookieData[0].domain.replace(/^\.+|\.+$/g, '').replace(/^\/+|\/+$/g, '');
      let isRelated = false;
      let upload_response = false;
      if (domainUrl && ('cookie_data' in CookieData)) {
        for (const domainKey in CookieData.cookie_data) {
          if (domainUrl.endsWith(domainKey)) {
            isRelated = true;
            CookieData.cookie_data[domainKey] = domainCookieData;
          }
        }
        if (isRelated) {
          upload_response = await uploadToServer(CookieData.cookie_data);
          if (upload_response) {
            TextOPFunc("当前站点的云端cookie值已上传覆盖更新和显示");
          } else {
            TextOPFunc("前站点的云端cookie值更新失败,请检查问题");
          }
        } else {
          if (confirm("当前站点 " + domainUrl + " 在云端没有储存Cookie数据,是否新增上传?")) {
            CookieData.cookie_data[domainUrl] = domainCookieData;
            upload_response = await uploadToServer(CookieData.cookie_data);
            if (upload_response) {
              TextOPFunc("当前站点 " + domainUrl + " 在云端储存的Cookie数据为空值,已上传更新和显示");
            } else {
              TextOPFunc("当前站点的云端cookie值更新失败,请检查问题");
            }
          } else {
            TextOPFunc("当前站点 " + domainUrl + " 在云端没有储存Cookie数据,已取消新增上传。");
          }
        }
      } else {
        TextOPFunc("错误,云端不存在任何cookie数据 或 云端数据格式错误 !! " + "\n" + " 请检查云服务器地址是否正确,或检查云服务器数据是否正常!");
        return;
      }
    }
  } catch (error) {
    TextOPFunc("错误,根据页面本地cookie覆盖修改云端 单站点 数据出错: ", error.message + "\n" + " " + error.stack);
  }
}


// 从远程下载的数据中获取当前站点的cookie值并显示
async function domainToCookie(CookieData) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentURL = new URL(tabs[0].url);
    const domainUrl = currentURL.hostname;
    let domaincookie = '';
    if (!CookieData) {
      return;
    } else if (domainUrl && ('cookie_data' in CookieData)) {
      for (const domainKey in CookieData.cookie_data) {
        if (domainUrl.endsWith(domainKey)) {
          const domainCookies = CookieData.cookie_data[domainKey];
          for (const cookie of domainCookies) {
            domaincookie += `${cookie.name}=${cookie.value};`;
          }
          break;
        }
      }
      if (domaincookie) {
        OPFunc(domaincookie.slice(0, -1));
        TextOPFunc("当前站点的云端cookie值已显示!");
      } else {
        TextOPFunc(" 当前站点 " + domainUrl + " 在云端没有储存Cookie数据");
      }
    } else {
      TextOPFunc("错误,对于当前域名:\"" + domainUrl + "\",远程服务器不存在对应cookie !! " + "\n" + " 请检查网页域名是否与服务器数据相符!");
    }
  });
}

// 根据cookieInput输入框内容覆盖修改当前页面的cookie
function overwriteCookies() {
  let cookieInput = sanitizeInput(document.getElementById("cookie_message_OutPut").value);
  if (!cookieInput || !cookieInput.includes("=")) {
    TextOPFunc("错误,请输入符合规则的cookie值(请谨慎操作此覆盖按钮!)");
    return;
  } else {
    let url = "";
    setUrlCookies(url, cookieInput);
    TextOPFunc("完成,输入的cookie值已覆盖到当前页面!");
  }
}

// 监听跳转刷新页面按钮,调用函数进行刷新跳转当前页面域名首页
function Refresh_Page() {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let tabId = tabs[0].id;
      let scriptInjection = {
        target: { tabId: tabId },
        func: function () {
          let url = window.location.protocol + '//' + window.location.hostname;
          return url;
        }
      };
      if (!(tabs[0].url.includes('extension'))) {
        chrome.scripting.executeScript(scriptInjection, function (results) {
          if (Array.isArray(results) && results.length > 0) {
            let url = results[0].result;
            chrome.tabs.update(tabId, { url: url });
            TextOPFunc("正在跳转当前页面的首页...");
          } else {
            TextOPFunc("错误代码1,检测到浏览器此页面无法刷新! " + "\n" + " 请手动刷新当前页面 或更换页面操作");
            return;
          }
        });
      } else {
        TextOPFunc("错误代码2,检测到浏览器此页面无法刷新! " + "\n" + " 请手动刷新当前页面 或更换页面操作");
        return;
      }
    });
  } catch (error) {
    TextOPFunc("错误代码3,检测到浏览器此页面无法刷新! " + "\n" + " 请手动刷新当前页面 或更换页面操作");
  }
}

// 获取并显示 云端储存 的所有 域名 列表
async function showAllDomain() {
  const response = await downloadForServer();
  if (!response || response == 'uuid?') {
    return;
  } else {
    const decryptedText = await decrypt_func(response.encrypted);
    let DomainValue = '';
    for (const key in decryptedText.cookie_data) {
      DomainValue += key + "\n";
    }
    OPFunc(DomainValue);
    TextOPFunc("云端储存cookie值的 所有域名 已显示!");
  }
}

// 根据 站点域名列表 获取对应站点本地cookie,并覆盖到云端对应站点cookies数据
async function AllDomainCoverageCookies() {
  try {
    TextOPFunc("开始根据域名列表本地cookie覆盖上传云端数据...");
    const domainData = sanitizeInput(document.getElementById('cookie_message_OutPut').value);
    let cleanedDomainData = domainData.trim();
    if (!cleanedDomainData) {
      TextOPFunc("错误,操作已停止,请输入正确格式域名清单,每行一个域名!");
      return;
    } else {
      TextOPFunc("开始处理清单中站点的cookie数据...");
      const response = await downloadForServer();
      if (response && response !== 'uuid?') {
        const CookieData = await decrypt_func(response.encrypted);
        if (!CookieData) {
          TextOPFunc("错误,云服务器不存在任何域名信息 !! " + "\n" + " 请自行检查云服务器数据信息!");
          return;
        } else if (cleanedDomainData.length > 3) {
          let arrayWithoutSpaces = cleanedDomainData.split('\n');
          // 去除数组内元素的空格
          let domainsArray = arrayWithoutSpaces.map(item => item.trim()).filter(item => item !== "");
          let result = {};
          let resultNull = [];
          let upload_response = false;
          let domainCookieData = [];
          for (let i = 0; i < domainsArray.length; i++) {
            let domaincookie;
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
                domaincookie = CookieData.cookie_data[domainKey];
                // 获取指定站点本地cookie
                domainCookieData = await getDomainCookie(domainKey);
                if (!domainCookieData) {
                  TextOPFunc("检测到 " + domain + " 在本地没有储存cookie值,此站点云端数据未做修改");
                } else {
                  CookieData.cookie_data[domainKey] = domainCookieData;
                  TextOPFunc("站点 " + domain + " 的cookie数据已暂存待上传");
                  result[domainKey] = [];
                }
                break;
              }
            }
            if (!isRelated) {
              resultNull.push(domain);
            }
          }
          if (Object.keys(result).length) {
            upload_response = await uploadToServer(CookieData.cookie_data);
            if (upload_response) {
              TextOPFunc("云端成功上传修改 " + Object.keys(result).length + " 个站点的cookie数据");
            } else {
              TextOPFunc("云端数据更新失败,请检查问题");
            }
          } else {
            TextOPFunc("提示,检测到云端cookie数据中不存在此 域名列表站点 的cookie数据,等待后续操作...");
          }
          // 处理云端不存在cookie数据的站点
          if (!Array.isArray(resultNull) || resultNull.length !== 0) {
            let NullDataDomain = "";
            for (let key of resultNull) {
              NullDataDomain += key + "\n";
            }
            TextOPFunc("提示,检测到输入的 域名列表 中在云端不存在cookie数据的站点域名:" + "\n" + NullDataDomain + "\n" + "是否新增此些站点的cookie数据到云端数据中?");
            if (confirm('是否新增此 ' + resultNull.length + ' 个站点的cookie数据储存到云端数据中?')) {
              for (let key of resultNull) {
                domainCookieData = await getDomainCookie(key);
                CookieData.cookie_data[key] = domainCookieData;
              }
              upload_response = await uploadToServer(CookieData.cookie_data);
              if (upload_response) {
                TextOPFunc("云端成功上传新增:" + "\n" + NullDataDomain + "--站点的cookie");
              } else {
                TextOPFunc("云端数据更新失败,请检查问题");
              }
            } else {
              TextOPFunc("已取消上传新增 " + "\n" + NullDataDomain + " 站点的cookie");
            }
          }
        }
      }
    }
  } catch (error) {
    TextOPFunc("错误,根据站点域名列表修改云端对应cookies出现 错误: " + "\n" + " " + error.message + "\n" + " " + error.stack);
  }
}

// 根据输入框 域名列表 获取云端数据并导入对应本地cookies
async function AllDomainInput() {
  const domainData = sanitizeInput(document.getElementById('cookie_message_OutPut').value);
  const response = await downloadForServer();
  if (!response) {
    return;
  } else {
    const CookieData = await decrypt_func(response.encrypted);
    await AllDomainCookiesInput(CookieData, domainData);
  }
}