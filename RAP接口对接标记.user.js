// ==UserScript==
// @name         RAP接口对接标记
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  标记RAP接口是否已经对接，提高研发效率
// @author       june
// @match        http://rap.lastbs.com/*
// @icon         https://img.alicdn.com/tfs/TB1WESIN1L2gK0jSZFmXXc7iXXa-192-77.png
// @updateURL    https://june-64.github.io/monkey_shell/RAP接口对接标记.user.js
// @downloadURL  https://june-64.github.io/monkey_shell/RAP接口对接标记.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 存储接口对接状态的键名前缀
    const STORAGE_KEY_PREFIX = 'rap_interface_implemented_';

    // 状态图标映射
    const STATUS_ICONS = {
        pending: '❌',
        implemented: '✅',
        ignored: '⚪'
    };

    // 注入CSS
    function injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            .rap-status-selector {
                margin-left: 8px;
                display: inline-flex;
                align-items: center;
            }
            .rap-status-selector select {
                margin-left: 4px;
                padding: 2px 4px;
                border-radius: 3px;
                border: 1px solid #ccc;
                background-color: white;
            }
            .rap-status-icon {
                margin-right: 5px;
                font-size: 14px;
            }
            /* 接口列表项的样式 */
            ul.body > li.sortable[data-rap-status="implemented"] {
                background-color: #e6f7e6 !important;
            }
            ul.body > li.sortable[data-rap-status="pending"] {
                background-color: #fff0f0 !important;
            }
            ul.body > li.sortable[data-rap-status="ignored"] {
                background-color: #f5f5f5 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 添加和更新接口状态
    function processInterfaceList() {
        // 只处理接口列表，避免处理模块标签
        const interfaceItems = document.querySelectorAll('ul.body > li.sortable');

        interfaceItems.forEach(item => {
            const interfaceId = item.getAttribute('data-id');
            if (!interfaceId) return;

            const storageKey = STORAGE_KEY_PREFIX + interfaceId;
            const status = localStorage.getItem(storageKey) || 'pending';

            // 使用数据属性而不是类名来标记状态，减少与其他样式的冲突
            item.setAttribute('data-rap-status', status);

            // 如果已经添加了选择器就不再重复添加
            if (item.querySelector('.rap-status-selector')) return;

            // 添加状态选择器到工具栏
            const toolbar = item.querySelector('.toolbar');
            if (!toolbar) return;

            // 添加状态图标
            const nameDiv = item.querySelector('.name');
            if (nameDiv && !nameDiv.querySelector('.rap-status-icon')) {
                const icon = document.createElement('span');
                icon.className = 'rap-status-icon';
                icon.textContent = STATUS_ICONS[status];
                nameDiv.insertBefore(icon, nameDiv.firstChild);
            }

            // 添加下拉选择框
            const statusSelector = document.createElement('div');
            statusSelector.className = 'rap-status-selector';
            statusSelector.innerHTML = `
                <span>状态:</span>
                <select data-id="${interfaceId}">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>待对接</option>
                    <option value="implemented" ${status === 'implemented' ? 'selected' : ''}>已对接</option>
                    <option value="ignored" ${status === 'ignored' ? 'selected' : ''}>不需对接</option>
                </select>
            `;

            toolbar.insertBefore(statusSelector, toolbar.firstChild);

            // 添加事件监听器
            const select = statusSelector.querySelector('select');
            select.addEventListener('change', function() {
                const id = this.getAttribute('data-id');
                const newStatus = this.value;
                localStorage.setItem(STORAGE_KEY_PREFIX + id, newStatus);

                // 更新状态
                item.setAttribute('data-rap-status', newStatus);

                // 更新图标
                const icon = item.querySelector('.rap-status-icon');
                if (icon) {
                    icon.textContent = STATUS_ICONS[newStatus];
                }
            });
        });
    }

    // 简化的DOM变化监听
    function setupMutationObserver() {
        // 使用简单的节点添加检测，避免复杂的条件判断
        const observer = new MutationObserver(mutations => {
            let hasNewNodes = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                    break;
                }
            }

            if (hasNewNodes) {
                // 当DOM变化时处理接口列表
                processInterfaceList();
            }
        });

        // 只监听childList变化，减少不必要的回调
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化函数
    function init() {
        // 注入样式
        injectStyles();

        // 初始处理接口列表
        setTimeout(processInterfaceList, 1000);

        // 设置DOM变化监听
        setupMutationObserver();
    }

    // 启动
    init();
})();