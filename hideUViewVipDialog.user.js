// ==UserScript==
    // @name         uview隐藏会员弹窗
    // @namespace    http://tampermonkey.net/
    // @version      0.2
    // @description  隐藏uview网站上的会员广告弹窗
    // @author       june
    // @match        *://*.uiadmin.net/*
    // @match        *://uiadmin.net/*
    // @grant        GM_xmlhttpRequest
    // @run-at       document-start
    // ==/UserScript==

    (function() {
        'use strict';

        // 拦截并修改 fetch 请求
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = args[0];
            if (typeof url === 'string' && url.includes('/api/v1/wxapp/ad/add')) {
                console.log('[会员弹窗脚本] 拦截到 API 请求');

                // 创建一个模拟响应
                const mockResponse = {
                    code: 200,
                    msg: "成功",
                    data: {
                        id: "",
                        isVip: true,
                        base64: ""
                    },
                    env: "prod"
                };

                // 返回模拟的响应
                return Promise.resolve(new Response(JSON.stringify(mockResponse), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }

            // 对于其他请求，使用原始的 fetch
            return originalFetch.apply(this, args);
        };

        // 拦截并修改 XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const originalXhrSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function() {
            this._url = arguments[1];
            return originalXhrOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            if (this._url && this._url.includes('/api/v1/wxapp/ad/add')) {
                console.log('[会员弹窗脚本] 拦截到 XHR 请求');

                const xhr = this;
                const originalOnReadyStateChange = xhr.onreadystatechange;

                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        Object.defineProperty(xhr, 'response', {
                            writable: true,
                            value: JSON.stringify({
                                code: 200,
                                msg: "成功",
                                data: {
                                    id: "",
                                    isVip: true,
                                    base64: ""
                                },
                                env: "prod"
                            })
                        });

                        Object.defineProperty(xhr, 'responseText', {
                            writable: true,
                            value: JSON.stringify({
                                code: 200,
                                msg: "成功",
                                data: {
                                    id: "",
                                    isVip: true,
                                    base64: ""
                                },
                                env: "prod"
                            })
                        });
                    }

                    if (originalOnReadyStateChange) {
                        originalOnReadyStateChange.apply(this, arguments);
                    }
                };
            }

            return originalXhrSend.apply(this, arguments);
        };

        // CSS 样式隐藏弹窗
        const style = document.createElement('style');
        style.textContent = `
        #vip-box.novip, .el-dialog__wrapper.novip {
            display: none !important;
        }
    `;
        document.head.appendChild(style);

        // DOM 加载后执行
        window.addEventListener('DOMContentLoaded', function() {
            // 直接移除弹窗
            const removeDialog = () => {
                const vipBox = document.getElementById('vip-box');
                if (vipBox) {
                    console.log('[会员弹窗脚本] 隐藏弹窗元素');
                    vipBox.style.display = 'none';
                    vipBox.classList.add('hidden-by-script');
                }

                // 移除所有带有 novip 类的弹窗
                document.querySelectorAll('.novip').forEach(el => {
                    el.style.display = 'none';
                    el.classList.add('hidden-by-script');
                });
            };

            // 立即执行一次
            removeDialog();

            // 定期检查并移除弹窗
            setInterval(removeDialog, 1000);
        });

        console.log('[会员弹窗脚本] 已加载');
    })();