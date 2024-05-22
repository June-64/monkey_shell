// ==UserScript==
// @name         拦截并导出小红书搜索请求
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  拦截并导出小红书搜索请求的数据，并实时预览，支持启用和禁用拦截，清空数据功能和Toast消息
// @author       June
// @match        *://*.xiaohongshu.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let idList = [];
    let isPreviewVisible = false; // 默认是收起的
    let isInterceptionEnabled = false; // 默认暂停拦截
    let inputValue = ""; // 过滤条件

    // 创建并插入按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '50px';
    buttonContainer.style.left = '10px';
    buttonContainer.style.zIndex = '1000';
    buttonContainer.style.backgroundColor = 'white';
    buttonContainer.style.border = '1px solid black';
    buttonContainer.style.padding = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'row'; // 修改为水平排列
    buttonContainer.style.gap = '5px';
    document.body.appendChild(buttonContainer);

    // 创建并插入输入框
    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.placeholder = '输入类型过滤';
    buttonContainer.appendChild(inputBox);

    // 创建并插入设置按钮
    const setButton = document.createElement('button');
    setButton.innerText = '设置';
    buttonContainer.appendChild(setButton);

    // 创建并插入导出按钮
    const exportButton = document.createElement('button');
    exportButton.innerText = '导出';
    buttonContainer.appendChild(exportButton);

    // 创建并插入收起/展开按钮
    const toggleButton = document.createElement('button');
    toggleButton.innerText = '展开';
    buttonContainer.appendChild(toggleButton);

    // 创建并插入开始/暂停按钮
    const interceptionButton = document.createElement('button');
    interceptionButton.innerText = '拦截';
    buttonContainer.appendChild(interceptionButton);

    // 创建并插入清空数据按钮
    const clearButton = document.createElement('button');
    clearButton.innerText = '清空';
    buttonContainer.appendChild(clearButton);

    // 创建并插入数据预览区域
    const dataPreview = document.createElement('div');
    dataPreview.style.position = 'fixed';
    dataPreview.style.bottom = '90px'; // 调整这个值以避免与按钮容器重叠
    dataPreview.style.left = '10px';
    dataPreview.style.width = '300px';
    dataPreview.style.height = '400px';
    dataPreview.style.overflowY = 'scroll';
    dataPreview.style.backgroundColor = 'white';
    dataPreview.style.border = '1px solid black';
    dataPreview.style.zIndex = '1000';
    dataPreview.style.padding = '10px';
    dataPreview.style.display = 'none'; // 默认隐藏
    document.body.appendChild(dataPreview);

    // 创建并插入 Toast 容器
    const toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '10px';
    toastContainer.style.left = '50%';
    toastContainer.style.transform = 'translateX(-50%)';
    toastContainer.style.zIndex = '1000';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.alignItems = 'center';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);

    // 显示 Toast 消息函数
    function showToast(message) {
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style.backgroundColor = 'black';
        toast.style.color = 'white';
        toast.style.padding = '10px';
        toast.style.borderRadius = '5px';
        toast.style.opacity = '1';
        toast.style.transition = 'opacity 0.5s';

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toastContainer.removeChild(toast), 500);
        }, 3000);
    }

    // 导出数据函数
    function exportData(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('数据已导出');
    }

    // 更新数据预览
    function updateDataPreview() {
        dataPreview.innerHTML = `<pre>${JSON.stringify(idList, null, 2)}</pre>`;
    }

    // 收起/展开按钮点击事件
    toggleButton.addEventListener('click', function() {
        isPreviewVisible = !isPreviewVisible;
        if (isPreviewVisible) {
            dataPreview.style.display = 'block';
            toggleButton.innerText = '收起';
            showToast('预览已展开');
        } else {
            dataPreview.style.display = 'none';
            toggleButton.innerText = '展开';
            showToast('预览已收起');
        }
    });

    // 开始/暂停按钮点击事件
    interceptionButton.addEventListener('click', function() {
        isInterceptionEnabled = !isInterceptionEnabled;
        interceptionButton.innerText = isInterceptionEnabled ? '暂停' : '拦截';
        showToast(isInterceptionEnabled ? '拦截已启用' : '拦截已暂停');
    });

    // 清空数据按钮点击事件
    clearButton.addEventListener('click', function() {
        idList = [];
        updateDataPreview();
        showToast('数据已清空');
    });

    // 设置按钮点击事件
    setButton.addEventListener('click', function() {
        inputValue = inputBox.value.trim();
        showToast(`过滤条件已设置为: ${inputValue}`);
    });

    // 保存原始的 XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;

    // 创建一个新的 XMLHttpRequest
    function newXHR() {
        const xhr = new originalXHR();

        xhr.addEventListener('readystatechange', function() {
            if (xhr.readyState === 4 && xhr.status === 200 && xhr.responseURL.includes('/api/sns/web/v1/search/notes')) {
                if (isInterceptionEnabled) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const ids = response.data.items.map(i => {
                            if (i.note_card.type === inputValue) return i.id;
                        }).filter(Boolean);

                        // 使用 Set 去重
                        const uniqueIds = new Set([...idList, ...ids]);
                        idList = [...uniqueIds];

                        console.log('Intercepted response:', response);
                        updateDataPreview();
                        showToast('捕获到新的数据');
                    } catch (e) {
                        console.error('Error parsing JSON response:', e);
                    }
                }
            }
        });

        return xhr;
    }

    // 替换全局的 XMLHttpRequest
    window.XMLHttpRequest = newXHR;

    // 导出按钮点击事件
    exportButton.addEventListener('click', function() {
        exportData(idList);
    });

    // 如果需要恢复原始的 XMLHttpRequest，可以使用以下代码：
    // window.XMLHttpRequest = originalXHR; 
})();
