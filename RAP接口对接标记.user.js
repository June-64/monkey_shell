// ==UserScript==
// @name         RAP接口对接标记
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  标记RAP接口是否已经对接，提高研发效率
// @author       june
// @match        http://rap.lastbs.com/*
// @icon         data:image/jpeg;base64,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
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