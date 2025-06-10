// ==UserScript==
// @name         德立信高考-账号管理
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  通过Github Gist远程管理德立信账号，并提供便捷的切换功能。
// @author       YourName
// @homepageURL  https://june-64.github.io/monkey_shell/
// @match        https://www.dlxgk.com/*
// @match        https://gk.delesson.cn/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    // --- 配置区域 ---
    const CONFIG = {
        gistId: '1d935118904ccdf1b512af432052eac2',

        // --- 更新设置 ---
        // 脚本的GitHub raw链接，用于检查更新
        scriptUrl: 'https://raw.githubusercontent.com/June-64/monkey_shell/main/DLX_account_manage.user.js',
        // 检查更新的频率 (毫秒)
        updateCheckInterval: 24 * 60 * 60 * 1000, // 24 小时

        // 用于触发登录流程的选择器
        loggedInContainerSelector: '.my-login',
        loginPromptSelector: 'div.avatar:not(.my-login) span.name',
        loginPromptText: '立即登录',
        logoutButtonSelector: '.arco-dropdown-option-content',
        logoutButtonText: '退出登录',

        // 登录弹窗内部的选择器
        loginModalSelector: '.arco-modal-body',
        passwordTabSelector: '.tabs-title span',
        passwordTabText: '密码登录',
        usernameSelector: 'input[placeholder="请输入手机号"]',
        passwordSelector: 'input[placeholder="请输入密码"]',
        agreementSelector: '.pact .desc',
        agreementImageSelector: '.pact img',
        uncheckedAgreementSrc: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAABLZJREFUWEfVmFFoW2UUx//n3jTdg7AONpjYh4oDO1DccIMWV/BBYeBkDBxWFNwwYZaJvXHFuaTgFZt2k25Jh6PORNaBssoEHU4ouAdhhRbWscoGy0PBCgUHKywDweXm5h73JbvpvcnN8vWmlXrfQs53zu8759zvnv9HWOMPrXE++AbUE6NtTUrTXmJ0ANwOUBuAFrFhZiwS4Q6YM6zQZN7KX9IjPfN+krEsQF3XA8ENrW/Dwgcg7FhOQAamFXAylw1c0vWDD2TXSgMeT6Rfs4AkCFtknXvbcYaZ+mKR0C8yfuoC6vq5dU0thVECDsg4lLVhYCyfVXvqZfOxgAOnzj+lUP4nz3IymwB+Y4Uuc75w3QQyet+hRQGof3Fmc0ANtpGKl4ixG0Sv1MjmbC6H1z87Gl6otbGagEU4JT8JQDT/0sNsMtG3eQtx/aPQnEzGhhKjbRYFjhJIVGFdxZr5XI67akF6AoqyBlvMKYC2uZ1xRlGU7k8+fO93GbBKm3ji621EdAGgdvemMWPcV7u8yu0JGE+mz3n03ISRze3X9cN/+4Gz15Q2X/gRwG5XYR72ZEwLHaz0XQVYfFsJlysMJ4ysuq9eQ8uC14Rk7Kl8u12Aj0p7w10CzhjZwPaVglvK5Jkngi3Ba65YjDnj/sJWXdfFC1h8XIBDydSbDBq3/2TggapQh9+eq5fRoZHUi2xhGkSBsi3hQLQ3dL4GYHqKIT5dpYfBX8W0cE+9QI38X9XvjJloJLSzClAcBUxNfziDGZx/2u83VBZaP5XeEiS+7cyiM265xPGRdC8xkmXHzFeikfCrsoEasRtMpH51HuZM0GK9oRFXDw4mUhdB9IajvH0xLXyykcCya6uSA4xHtdBbbsBk+iaA52ynVoE7+4+Ep2WDNGI3MHx2lxJQry754NmoFt7uAown0neJsNE2Mozck/rHh+80Elh2rT58dmMwoN51nB7ZmBbaUJlBdjqMaqG6k44sgIzdYDLtGb8MUctAxvlK2MgA3rNHdhHQMAub7PFpJQAe50OMZ8Fg81/lEjMvxiLhTe4eTKZukGN6scxCV3/fITFurfozcDLVoag05Qh0K6qFnq/swQsAusu7cJxFq00YT6aOEGi4HIf5h2gkvN+dwbV+UAsZGXR+6phNg2mr7NTsN8v1PrGuo2Qwkb7m1B9C2HgNkX5hvNbFk6lRAr3vOAOnY1qo0/7tBhxJvwvGmKMXTFLQcaw3fH0loWxfx09/84JlsfhalXUKgbuPaeHvPQGLwnx962239hUDq7Gz0VG/coOyw/H/a+S3d1lbNDWuS3RdjPrNF32LJgFZTP/6wtVqwd6Y7Cz1nDVeJTvBs0Y20CktOwXkpydSrc3NJEYgl3AXOgXgsTybJ2Sn7c9Pjz2jWGY/Mb/j0h+lki1fuNulLkHi52oB/8iC+QoTJgjqpGH886c9nhXHJ1V9lhXsIIv3PLwiedkDTIiemZzB+3xdfdiQa/ryyHk0lAQ9D1f3zzJPSMYcA9qKXb85w4tsNreYewHSnPJUCpExAwVfGvcWvnMK83prfU/NxRsrcQVs8S4QtTNjs0MyZAGeByjDhOn/7Aq43m5X43/fGVwNGC+f/wJUGjlHENc7twAAAABJRU5ErkJggg==',
        loginButtonSelector: 'button.form-btn[type="submit"]',
    };
    // --- 配置区域结束 ---

    let accounts = [];
    const PANEL_ID = 'dlx-account-manager-panel';

    // 注入CSS样式
    function addStyles() {
        GM_addStyle(`
            #${PANEL_ID} {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 280px;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                z-index: 10000;
                font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
                transform: translateX(120%);
                opacity: 0;
            }
            #${PANEL_ID}.show {
                transform: translateX(0);
                opacity: 1;
            }
            #${PANEL_ID} .header {
                padding: 14px 16px;
                border-bottom: 1px solid #e9e9e9;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #${PANEL_ID} .header .title {
                font-weight: 600;
                color: #333;
                font-size: 16px;
            }
            #${PANEL_ID} .header .actions {
                display: flex;
                align-items: center;
            }
            #${PANEL_ID} .header .icon-btn {
                cursor: pointer;
                font-size: 22px;
                color: #999;
                font-weight: bold;
                margin-left: 12px;
                transition: color 0.2s;
                line-height: 1;
            }
            #${PANEL_ID} .header .icon-btn:hover {
                color: #333;
            }
            #${PANEL_ID} .header .icon-btn.update-available {
                color: #28a745;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            #${PANEL_ID} .search-wrapper {
                padding: 8px 16px;
                border-bottom: 1px solid #e9e9e9;
            }
            #${PANEL_ID} .search-wrapper input {
                width: 100%;
                padding: 8px 16px;
                border: 1px solid #e0e0e0;
                border-radius: 20px;
                box-sizing: border-box;
                font-size: 14px;
                outline: none;
                background-color: #f5f5f5;
                transition: all 0.2s ease;
            }
            #${PANEL_ID} .search-wrapper input:focus {
                background-color: #fff;
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0,123,255,.1);
            }
            #${PANEL_ID} .content {
                padding: 8px 0;
                max-height: 400px;
                overflow-y: auto;
            }
            #${PANEL_ID} .account-list .item {
                padding: 14px 20px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 15px;
                color: #444;
                display: flex;
                align-items: center;
            }
            #${PANEL_ID} .account-list .item:not(:last-child) {
                border-bottom: 1px solid #f0f0f0;
            }
            #${PANEL_ID} .account-list .item:hover {
                background-color: #f5f5f5;
            }
            #${PANEL_ID} .account-list .placeholder {
                padding: 20px;
                color: #888;
                text-align: center;
                font-size: 14px;
            }
            #${PANEL_ID}-toggle-button {
                position: fixed;
                top: 80px;
                right: 25px;
                width: 48px;
                height: 48px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 24px;
                transition: transform 0.2s ease, opacity 0.3s ease;
            }
            #${PANEL_ID}-toggle-button:hover {
                transform: scale(1.1);
            }
        `);
    }

    // 创建UI
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div class="header">
                <span class="title">账号切换</span>
                <div class="actions">
                     <span id="refresh-accounts-btn" class="icon-btn" title="刷新列表">&#x21bb;</span>
                     <span class="close-btn icon-btn" title="关闭面板">&times;</span>
                </div>
            </div>
            <div class="search-wrapper">
                <input type="text" id="account-search-input" placeholder="🔍 搜索账号...">
            </div>
            <div class="content">
                <div class="account-list"></div>
            </div>
        `;
        document.body.appendChild(panel);

        const toggleButton = document.createElement('button');
        toggleButton.id = `${PANEL_ID}-toggle-button`;
        toggleButton.innerHTML = '&#128100;'; // User icon
        toggleButton.title = '打开账号管理器';
        document.body.appendChild(toggleButton);

        // 事件监听
        toggleButton.addEventListener('click', togglePanel);
        panel.querySelector('.close-btn').addEventListener('click', hidePanel);
        panel.querySelector('#refresh-accounts-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent drag from starting
            refreshAccounts();
        });
        panel.querySelector('#account-search-input').addEventListener('input', renderAccounts);
        makeDraggable(panel);
    }

    // 渲染账号列表
    function renderAccounts() {
        const listContainer = document.querySelector(`#${PANEL_ID} .account-list`);
        const searchInput = document.getElementById('account-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

        if (!listContainer) return;

        const hasChinese = /[\u4e00-\u9fa5]/.test(searchTerm);

        const filteredAccounts = hasChinese
            ? accounts.filter(acc => acc.name.toLowerCase().includes(searchTerm))
            : accounts;

        listContainer.innerHTML = '';
        if (filteredAccounts.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            if (searchTerm) {
                placeholder.textContent = '未找到匹配的账号';
            } else {
                placeholder.textContent = !CONFIG.gistId
                    ? '请在脚本中配置Gist ID'
                    : 'Gist中无账号, 或加载失败';
            }
            listContainer.appendChild(placeholder);
            return;
        }

        filteredAccounts.forEach(acc => {
            const originalIndex = accounts.findIndex(originalAcc => originalAcc === acc);
            if (originalIndex === -1) return; // Safety check

            const item = document.createElement('div');
            item.className = 'item';
            item.textContent = acc.name;
            item.dataset.index = originalIndex;
            item.addEventListener('click', handleLogin);
            listContainer.appendChild(item);
        });
    }

    async function fetchAccounts() {
        if (!CONFIG.gistId) {
            accounts = [];
            console.error("Gist ID 未在脚本中配置。");
            return Promise.reject("Gist ID not configured");
        }

        const gistApiUrl = `https://api.github.com/gists/${CONFIG.gistId}`;

        try {
            // 步骤 1: 从GitHub API获取Gist的元数据
            const gistData = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: gistApiUrl,
                    responseType: 'json',
                    headers: { "Accept": "application/vnd.github.v3+json" },
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 400) {
                            resolve(response.response);
                        } else {
                            reject(`获取Gist元数据失败: ${response.statusText}`);
                        }
                    },
                    onerror: (error) => reject('网络错误: 无法连接GitHub API')
                });
            });

            // 步骤 2: 从元数据中找到第一个文件的 raw_url
            const files = gistData.files;
            if (!files || Object.keys(files).length === 0) {
                throw new Error('Gist为空或没有文件。');
            }
            const firstFilename = Object.keys(files)[0];
            const rawUrl = files[firstFilename].raw_url;

            if (!rawUrl) {
                throw new Error('无法在Gist API响应中找到raw_url。');
            }

            // 步骤 3: 使用获取到的 raw_url 下载账号文件
            await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: rawUrl,
                    responseType: 'json',
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 400) {
                            if (Array.isArray(response.response)) {
                                accounts = response.response;
                                console.log('账号列表加载成功:', accounts);
                                resolve();
                            } else {
                                reject('Gist文件内容不是有效的JSON数组。');
                            }
                        } else {
                            reject(`下载Gist内容失败: ${response.statusText}`);
                        }
                    },
                    onerror: (error) => reject('网络错误: 下载Gist内容时发生错误。')
                });
            });

        } catch (error) {
            accounts = []; //
            console.error("从Gist加载账号失败:", error);
            throw error; // Propagate error to be caught by refreshAccounts
        }
    }

    async function refreshAccounts() {
        const listContainer = document.querySelector(`#${PANEL_ID} .account-list`);
        const searchInput = document.getElementById('account-search-input');

        if(searchInput) searchInput.value = '';

        if(listContainer) {
            listContainer.innerHTML = `<div class="placeholder">正在从Gist加载...</div>`;
        }

        try {
            await fetchAccounts();
        } catch (error) {
            alert(`加载账号失败: ${error}`);
        }
        renderAccounts(); // 重新渲染列表，无论成功或失败
    }


    // --- 辅助函数 ---
    function findElementByText(selector, text, root = document) {
        return Array.from(root.querySelectorAll(selector)).find(el => el.textContent.trim().includes(text));
    }

    function waitForElement(selector, timeout = 3000, root = document) {
        return new Promise((resolve) => {
            const intervalTime = 100;
            const endTime = Date.now() + timeout;

            const timer = setInterval(() => {
                const element = root.querySelector(selector);
                if (element) {
                    clearInterval(timer);
                    resolve(element);
                } else if (Date.now() > endTime) {
                    clearInterval(timer);
                    resolve(null);
                }
            }, intervalTime);
        });
    }

    async function triggerLoginModal() {
        const loggedInContainer = document.querySelector(CONFIG.loggedInContainerSelector);

        if (loggedInContainer) {
            console.log('已登录，将先执行退出操作。');
            loggedInContainer.click(); // 打开下拉菜单

            // 下拉菜单是动态添加到body的，所以需要全局等待
            const logoutButton = await waitForElement(CONFIG.logoutButtonSelector, 2000);
            if (logoutButton && logoutButton.textContent.includes(CONFIG.logoutButtonText)) {
                logoutButton.click();
            } else {
                // 如果等待超时，再尝试立即查找一次
                const immediateLogoutBtn = findElementByText(CONFIG.logoutButtonSelector, CONFIG.logoutButtonText);
                if (immediateLogoutBtn) {
                    immediateLogoutBtn.click();
                } else {
                    throw new Error(`未找到"${CONFIG.logoutButtonText}"按钮。`);
                }
            }
        }

        console.log(`正在查找"${CONFIG.loginPromptText}"按钮...`);
        const loginPromptButton = await waitForElement(CONFIG.loginPromptSelector, 5000);

        if (loginPromptButton && loginPromptButton.textContent.includes(CONFIG.loginPromptText)) {
            console.log('找到"立即登录"按钮，正在点击...');
            loginPromptButton.click();
        } else {
            // 如果登录弹窗已经存在，则无需再次点击
            if (document.querySelector(CONFIG.loginModalSelector)) {
                console.log('登录框已可见，跳过点击"立即登录"。');
                return;
            }
            throw new Error(`未找到"${CONFIG.loginPromptText}"按钮。`);
        }
    }


    async function handleLogin(e) {
        const index = e.currentTarget.dataset.index;
        const account = accounts[index];
        if (!account) return;

        hidePanel();

        try {
            await triggerLoginModal();
            console.log('登录框已触发，等待其出现...');
            await new Promise(r => setTimeout(r, 200)); // 等待弹窗动画

            const loginModal = await waitForElement(CONFIG.loginModalSelector, 5000);
            if (!loginModal) {
                throw new Error('登录框未能按时出现。');
            }
            console.log('登录框已出现。');
            await new Promise(r => setTimeout(r, 200));

            // 1. 点击"密码登录"标签页
            const passwordTab = findElementByText(CONFIG.passwordTabSelector, CONFIG.passwordTabText, loginModal);
            if (passwordTab && !passwordTab.classList.contains('active')) {
                console.log('切换到密码登录...');
                passwordTab.click();
                await new Promise(r => setTimeout(r, 200)); // 等待UI切换
            } else if (!passwordTab) {
                 throw new Error(`无法找到 "${CONFIG.passwordTabText}" 标签页。`);
            }

            // 2. 在弹窗内查找表单元素
            const usernameEl = loginModal.querySelector(CONFIG.usernameSelector);
            const passwordEl = loginModal.querySelector(CONFIG.passwordSelector);
            const agreementEl = loginModal.querySelector(CONFIG.agreementSelector);
            const loginBtn = loginModal.querySelector(CONFIG.loginButtonSelector);
            const agreementImg = loginModal.querySelector(CONFIG.agreementImageSelector);


            // 3. 检查所有元素是否都已找到
            const missingElements = [];
            if (!usernameEl) missingElements.push(`用户名输入框 (${CONFIG.usernameSelector})`);
            if (!passwordEl) missingElements.push(`密码输入框 (${CONFIG.passwordSelector})`);
            if (!agreementEl) missingElements.push(`协议勾选框 (${CONFIG.agreementSelector})`);
            if (!loginBtn) missingElements.push(`登录按钮 (${CONFIG.loginButtonSelector})`);

            if (missingElements.length > 0) {
                throw new Error("无法在登录框中找到以下元素：\n- " + missingElements.join('\n- '));
            }

            console.log('所有登录表单元素已找到。');

            console.log(agreementImg.src);
            
            // 4. 执行操作
            if ( agreementImg.src === CONFIG.uncheckedAgreementSrc) {
                console.log('协议未勾选，正在点击...');
                agreementEl.click();
            } else {
                console.log('协议已勾选，跳过点击。');
            }

            console.log('填充用户名和密码...');
            const inputEvent = new Event('input', { bubbles: true, composed: true });
            usernameEl.value = account.username;
            usernameEl.dispatchEvent(inputEvent);

            passwordEl.value = account.password;
            passwordEl.dispatchEvent(inputEvent);


            console.log('点击登录...');
            loginBtn.click();

        } catch (error) {
            console.error('登录流程失败:', error);
            alert(`登录流程失败: ${error.message}`);
            showPanel();
        }
    }
    
    // UI控制
    function showPanel() {
        const panel = document.getElementById(PANEL_ID);
        const toggleButton = document.getElementById(`${PANEL_ID}-toggle-button`);
        if (panel) panel.classList.add('show');
        if (toggleButton) toggleButton.style.display = 'none';
    }

    function hidePanel() {
        const panel = document.getElementById(PANEL_ID);
        const toggleButton = document.getElementById(`${PANEL_ID}-toggle-button`);
        if (panel) panel.classList.remove('show');
        if (toggleButton) toggleButton.style.display = 'flex';
    }

    function togglePanel() {
        const panel = document.getElementById(PANEL_ID);
        if (panel && panel.classList.contains('show')) {
            hidePanel();
        } else {
            showPanel();
        }
    }
    
    // 拖动功能
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = element.querySelector(".header");

        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // --- 更新检查 ---
    function isNewerVersion(remote, local) {
        const remoteParts = remote.split('.').map(Number);
        const localParts = local.split('.').map(Number);
        const len = Math.max(remoteParts.length, localParts.length);

        for (let i = 0; i < len; i++) {
            const r = remoteParts[i] || 0;
            const l = localParts[i] || 0;
            if (r > l) return true;
            if (r < l) return false;
        }
        return false;
    }

    function showUpdateNotification() {
        const headerActions = document.querySelector(`#${PANEL_ID} .header .actions`);
        if (!headerActions || headerActions.querySelector('.update-available')) {
            return; // Already exists
        }

        const updateLink = document.createElement('a');
        const userFriendlyUrl = CONFIG.scriptUrl
            .replace('raw.githubusercontent.com', 'github.com')
            .replace('/main/', '/blob/main/');
        updateLink.href = userFriendlyUrl;
        updateLink.target = '_blank';
        updateLink.className = 'icon-btn update-available';
        updateLink.title = '有新版本可用！点击前往更新';
        updateLink.innerHTML = '&#128229;'; // Download icon

        headerActions.insertBefore(updateLink, headerActions.firstChild);
    }

    async function checkForUpdates() {
        const lastCheck = await GM_getValue('lastUpdateCheck', 0);
        if (Date.now() - lastCheck < CONFIG.updateCheckInterval) {
            console.log('Update check: skipped, too soon.');
            return;
        }

        console.log('Checking for script updates...');
        try {
            const remoteScript = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: CONFIG.scriptUrl,
                    onload: response => {
                        if (response.status >= 200 && response.status < 400) {
                            resolve(response.responseText);
                        } else {
                            reject(`Failed to fetch script, status: ${response.status}`);
                        }
                    },
                    onerror: error => reject(error)
                });
            });

            const remoteVersionMatch = remoteScript.match(/@version\s+([\d.]+)/);
            if (!remoteVersionMatch) {
                console.error('Update check: Could not find version in remote script.');
                return;
            }

            const remoteVersion = remoteVersionMatch[1];
            const localVersion = GM_info.script.version;

            console.log(`Update check: Local version ${localVersion}, Remote version ${remoteVersion}`);

            if (isNewerVersion(remoteVersion, localVersion)) {
                console.log('A new version of the script is available!');
                showUpdateNotification();
            }

            await GM_setValue('lastUpdateCheck', Date.now());

        } catch (error) {
            console.error('Error checking for script updates:', error);
        }
    }

    // 初始化
    function init() {
        addStyles();
        createPanel();
        refreshAccounts();
        checkForUpdates();
        
        // 添加一个菜单命令来打开面板
        GM_registerMenuCommand("账号管理", togglePanel);
    }

    // 等待页面加载完成
    window.addEventListener('load', init, false);

})();
