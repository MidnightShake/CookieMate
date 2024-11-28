# CookieMate
这是一个兼容chrome内核的浏览器插件 Cookie伴侣。搭配CookieCloud服务器端，实现单站点或批量站点的Cookie快捷复制、修改上传储存。

# 实现功能：
1、在站点界面 可右键直接复制站点当前的cookie数据到剪贴板。
2、搭配CookieCloud服务器端 在站点界面 可右键快捷 自动下载对应云端cookie数据并覆盖到本地、跳转到当前站点域名首页。
3、搭配CookieCloud服务器端，可操作cookie数据的修改：
- 3.1 测试CookieCloud服务器端的连接性；
- 3.2 获取当前浏览器标签页面 在当前浏览器的cookie数据并显示出来；
- 3.3 获取当前浏览器标签页面站点 在CookieCloud服务器端储存的cookie数据并显示出来；
- 3.4 输入框输入指定格式的cookie数据，覆盖到当前浏览器的站点cookie数据；
- 3.5 快捷跳转到当前站点首页（比如修改站点在浏览器的cookie数据后，快速跳转到当前站点首页，以验证cookie修改效果）；
- 3.6 列表显示出在 CookieCloud服务器端 已储存数据的 所有站点域名；
- 3.7 根据输入的域名列表 从CookieCloud服务器端 下载对应站点的cookie数据 并覆盖到本地浏览器中；
- 3.8 把当前页面站点的cookie数据 上传覆盖到 CookieCloud服务器端 （仅会修改当前站点域名的数据，其他站点数据保持不变）；
- 3.9 根据输入的站点域名列表，把本地浏览器储存的对应站点cookie数据 上传覆盖到 CookieCloud服务器端（仅会修改指定的域名列表的数据，其他站点数据保持不变）；
- 
4、设定自动定时任务，设定需要监测的浏览器收藏夹、cookie数据检测关键词，自动保持本地浏览器与CookieCloud服务器端的cookie数据有效一致。
- 自动监测选定的收藏夹中的站点 的cookie数据与CookieCloud服务器端中对应站点域名的cookie数据，或根据设定的cookie数据关键词，自动判别有效cookie数据，实现监测站点的cookie数据 自动上传至云端CookieCloud服务器端中，或从云端CookieCloud服务器端中下载覆盖到当前浏览器，自动保持本地浏览器与CookieCloud服务器端的cookie数据有效一致。
> 提醒：所选定的浏览器收藏夹，不会监测此收藏夹其中的子收藏夹。
