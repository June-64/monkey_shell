// ==UserScript==
// @name         高考数据拦截器（2025版）
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  拦截2025年高考数据API请求并提供下载功能（只拦截2025年数据）
// @author       june
// @match        https://www.gaokao.cn/*
// @match        https://static-data.gaokao.cn/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// ==/UserScript==

(function() {
    'use strict';

    let isIntercepting = true; // 默认开启拦截
    let lastCapturedData = null;
    let originalFetch = window.fetch;
    let originalXMLHttpRequest = window.XMLHttpRequest;
    let interceptCount = 0;
    let interceptHistory = []; // 拦截历史记录

    // 创建拦截器控制面板
    function createInterceptorPanel() {
        const panel = document.createElement('div');
        panel.id = 'gaokao-interceptor-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff;
            border: 2px solid #007cba;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            width: 320px;
            max-height: 80vh;
            overflow-y: auto;
            word-wrap: break-word;
            word-break: break-all;
        `;

        panel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #007cba; font-size: 16px;">高考数据拦截器（2025版）</h3>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <div style="margin-bottom: 8px;">
                    <strong>当前选择:</strong>
                </div>
                <div id="current-selection" style="font-size: 14px; color: #666; word-wrap: break-word;">
                    点击页面选项后显示
                </div>
            </div>

            <div id="intercept-status" style="margin-bottom: 15px; padding: 8px; border-radius: 4px; background: #e8f5e8; text-align: center; font-size: 12px; word-wrap: break-word; color: #2e7d32;">
                🔄 拦截器已启动（仅2025年）
            </div>

            <div style="margin-bottom: 15px; padding: 8px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffeaa7;">
                <div style="font-size: 12px; color: #856404; margin-bottom: 5px;">
                    <strong>调试信息:</strong>
                </div>
                <div style="font-size: 11px; color: #6c757d;">
                    请求次数: <span id="intercept-count">0</span>
                </div>
                <div id="last-request" style="font-size: 10px; color: #6c757d; margin-top: 3px; word-wrap: break-word; line-height: 1.2;">
                    等待请求...
                </div>
            </div>

            <button id="show-history" style="width: 100%; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; margin-bottom: 10px;">
                查看拦截历史 (<span id="history-count">0</span>)
            </button>

            <div id="status" style="margin-top: 10px; padding: 8px; border-radius: 4px; display: none; word-wrap: break-word; font-size: 12px;"></div>
            <button id="close-panel" style="position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
        `;

        document.body.appendChild(panel);
        bindPanelEvents();
        updateCurrentSelection();
        return panel;
    }

    // 绑定面板事件
    function bindPanelEvents() {
        document.getElementById('show-history').addEventListener('click', showInterceptHistory);
        document.getElementById('close-panel').addEventListener('click', () => {
            document.getElementById('gaokao-interceptor-panel').remove();
        });
    }

    // 获取当前页面选择的条件
    function getCurrentSelections() {
        try {
            // 方法1: 查找active类
            const activeItems = document.querySelectorAll('.tag_item.active');
            
            if (activeItems.length >= 3) {
                const selections = {
                    region: activeItems[0]?.textContent?.trim() || '未知地区',
                    year: activeItems[1]?.textContent?.trim() || '未知年份',
                    type: activeItems[2]?.textContent?.trim() || '未知类别'
                };
                return selections;
            }
            
            // 方法2: 查找橙色高亮
            const allItems = document.querySelectorAll('.tag_item');
            let currentRegion = '未知地区';
            let currentYear = '未知年份';
            let currentType = '未知类别';
            
            allItems.forEach((item) => {
                const text = item.textContent.trim();
                const style = window.getComputedStyle(item);
                const isHighlighted = style.color === 'rgb(255, 102, 0)' || 
                                    item.style.color === '#ff6600' || 
                                    style.backgroundColor === 'rgb(255, 102, 0)' || 
                                    item.classList.contains('active');
                
                if (isHighlighted) {
                    // 判断是哪种类型的选项
                    if (['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', 
                         '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', 
                         '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州', 
                         '云南', '陕西', '甘肃', '青海', '宁夏'].includes(text)) {
                        currentRegion = text;
                    } else if (['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016'].includes(text)) {
                        currentYear = text;
                                         } else if (['物理类', '历史类', '理科', '文科'].includes(text)) {
                        currentType = text;
                    }
                }
            });
            
            return {
                region: currentRegion,
                year: currentYear,
                type: currentType
            };
            
        } catch (error) {
            console.error('[拦截器] 获取当前选择失败:', error);
            return {
                region: '未知地区',
                year: '未知年份',
                type: '未知类别'
            };
        }
    }

    // 更新当前选择显示
    function updateCurrentSelection() {
        const selectionDiv = document.getElementById('current-selection');
        if (selectionDiv) {
            const current = getCurrentSelections();
            selectionDiv.innerHTML = `
                <div style="color: #007cba; font-weight: bold; margin-bottom: 5px;">${current.region} ${current.year} ${current.type}</div>
                <div style="font-size: 11px; color: #666; line-height: 1.3;">文件名: ${current.region}${current.year}${current.type}一分一段表.xlsx</div>
            `;
        }
    }

    // 监听页面变化，更新当前选择
    function observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                    shouldUpdate = true;
                }
            });
            if (shouldUpdate) {
                setTimeout(updateCurrentSelection, 100);
            }
        });

        const conditionElement = document.querySelector('.condition') || document.body;
        observer.observe(conditionElement, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    // 更新最后请求信息
    function updateLastRequest(url, success = false) {
        const lastRequestDiv = document.getElementById('last-request');
        if (lastRequestDiv) {
            const shortUrl = url.length > 50 ? url.substring(0, 50) + '...' : url;
            const status = success ? '✅' : '⚪';
            lastRequestDiv.textContent = `${status} ${shortUrl}`;
        }
    }

    // 处理拦截到的数据
    function handleInterceptedData(data, url) {
        console.log('[拦截器] 处理拦截数据，URL:', url);
        console.log('[拦截器] 数据data:', data);
        
        if (data.code === '0000') {
            lastCapturedData = data;
            const current = getCurrentSelections();
            console.log('[拦截器] 当前选择:', current);
            
            // 保存到历史记录
            const historyItem = {
                timestamp: new Date().toLocaleString(),
                url: url,
                data: data,
                selection: { ...current },
                filename: `${current.region}${current.year}${current.type}一分一段表.xlsx`
            };
            
            // 检查是否已存在相同的记录（避免重复）
            const exists = interceptHistory.some(item => 
                item.selection.region === current.region && 
                item.selection.year === current.year && 
                item.selection.type === current.type
            );
            
            if (!exists) {
                interceptHistory.unshift(historyItem); // 添加到开头
                updateHistoryCount();
                console.log('[拦截器] 已保存到历史记录:', historyItem.filename);
            } else {
                console.log('[拦截器] 记录已存在，跳过保存');
            }
            
            // 输出原始数据信息
            if (data.data && data.data.list) {
                console.log('[拦截器] 原始数据条目数:', Object.keys(data.data.list).length);
                const firstKey = Object.keys(data.data.list)[0];
                const firstItem = data.data.list[firstKey];
                console.log('[拦截器] 第一条数据样例:', firstItem);
            }
            
            // showInterceptNotification(current);
            updateInterceptStatus(`✅ 已拦截: ${current.region} ${current.year} ${current.type}`, 'success');
            

        } else {
            console.warn('[拦截器] API返回错误码:', data.code, data.message);
        }
    }

    // 设置网络拦截 - 每次都重新设置，确保拦截有效
    function setupNetworkInterception() {
        console.log('[拦截器] 设置网络拦截');
        
        // 重新设置 fetch 拦截
        window.fetch = function(...args) {
            const url = args[0];
            
            if (isIntercepting) {
                console.log('[拦截器] 检测到fetch请求:', url);
                updateInterceptCount();
                updateLastRequest(url);
            }
            
            return originalFetch.apply(this, args).then(response => {
                if (isIntercepting && typeof url === 'string' && url.includes('lists.json') && url.includes('/2.0/section') && url.includes('/2025/') && response.ok) {
                    console.log('[拦截器] ✅ 匹配到目标API (2025年):', url);
                    updateLastRequest(url, true);
                    
                    // 克隆响应并处理数据
                    response.clone().json().then(data => {
                        handleInterceptedData(data, url);
                    }).catch(error => {
                        console.error('[拦截器] 解析fetch数据失败:', error);
                    });
                }
                return response;
            }).catch(error => {
                console.error('[拦截器] fetch请求失败:', error);
                throw error;
            });
        };

        // 重新设置 XMLHttpRequest 拦截
        window.XMLHttpRequest = function() {
            const xhr = new originalXMLHttpRequest();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(method, url, ...args) {
                this._interceptor_url = url;
                
                if (isIntercepting && typeof url === 'string') {
                    console.log('[拦截器] 检测到XHR请求:', url);
                    updateInterceptCount();
                    updateLastRequest(url);
                }
                
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            xhr.send = function(...args) {
                if (isIntercepting && this._interceptor_url && this._interceptor_url.includes('lists.json') && this._interceptor_url.includes('/2.0/section') && this._interceptor_url.includes('/2025/')) {
                    console.log('[拦截器] ✅ 匹配到XHR目标API (2025年):', this._interceptor_url);
                    updateLastRequest(this._interceptor_url, true);
                    
                    const originalOnreadystatechange = this.onreadystatechange;
                    
                    this.onreadystatechange = function() {
                        if (this.readyState === 4 && this.status === 200) {
                            try {
                                const data = JSON.parse(this.responseText);
                                handleInterceptedData(data, this._interceptor_url);
                            } catch (error) {
                                console.error('[拦截器] 解析XHR数据失败:', error);
                            }
                        }
                        
                        if (originalOnreadystatechange) {
                            originalOnreadystatechange.apply(this, arguments);
                        }
                    };
                }
                
                return originalSend.apply(this, args);
            };
            
            return xhr;
        };
        
        console.log('[拦截器] 网络拦截设置完成');
    }

    // 更新拦截计数
    function updateInterceptCount() {
        interceptCount++;
        const countElement = document.getElementById('intercept-count');
        if (countElement) {
            countElement.textContent = interceptCount;
        }
    }

    // 更新历史记录计数
    function updateHistoryCount() {
        const countElement = document.getElementById('history-count');
        if (countElement) {
            countElement.textContent = interceptHistory.length;
        }
    }

    // 显示拦截历史
    function showInterceptHistory() {
        if (interceptHistory.length === 0) {
            showStatus('暂无拦截历史记录', 'warning');
            return;
        }

        // 创建历史记录弹窗
        const historyModal = document.createElement('div');
        historyModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        `;

        const historyContent = document.createElement('div');
        historyContent.style.cssText = `
            background: #fff;
            border-radius: 8px;
            padding: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

        let historyHTML = `
            <h3 style="margin: 0 0 20px 0; color: #007cba; text-align: center;">拦截历史记录 (${interceptHistory.length}条)</h3>
        `;

        interceptHistory.forEach((item, index) => {
            const dataCount = item.data.data && item.data.data.list ? Object.keys(item.data.data.list).length : 0;
            historyHTML += `
                <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: #007cba; margin-bottom: 5px;">
                                ${item.selection.region} ${item.selection.year} ${item.selection.type}
                            </div>
                            <div style="font-size: 12px; color: #666;">
                                拦截时间: ${item.timestamp} | 数据条目: ${dataCount}条
                            </div>
                        </div>
                        <button class="download-history-btn" data-index="${index}" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            下载
                        </button>
                    </div>
                    <div style="font-size: 11px; color: #999; word-break: break-all;">
                        ${item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url}
                    </div>
                </div>
            `;
        });

        historyHTML += `
            <div style="text-align: center; margin-top: 20px;">
                <button id="close-history" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                    关闭
                </button>
                <button id="clear-history" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    清空历史
                </button>
            </div>
        `;

        historyContent.innerHTML = historyHTML;
        historyModal.appendChild(historyContent);
        document.body.appendChild(historyModal);

        // 绑定事件
        document.getElementById('close-history').addEventListener('click', () => {
            document.body.removeChild(historyModal);
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                interceptHistory = [];
                updateHistoryCount();
                document.body.removeChild(historyModal);
                showStatus('历史记录已清空', 'success');
            }
        });

        // 绑定下载按钮事件
        const downloadBtns = historyContent.querySelectorAll('.download-history-btn');
        downloadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const historyItem = interceptHistory[index];
                if (historyItem) {
                    downloadData(historyItem.data, historyItem.selection);
                }
            });
        });

        // 点击遮罩关闭
        historyModal.addEventListener('click', (e) => {
            if (e.target === historyModal) {
                document.body.removeChild(historyModal);
            }
        });
    }

    // 显示拦截通知
    function showInterceptNotification(current) {
        // 创建通知框
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10001;
            font-family: Arial, sans-serif;
            text-align: center;
            min-width: 300px;
        `;

        notification.innerHTML = `
            <div style="margin-bottom: 15px;">
                <div style="color: #28a745; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
                    🎯 拦截到数据！
                </div>
                <div style="color: #333; font-size: 14px;">
                    ${current.region} ${current.year} ${current.type}
                </div>
                <div style="color: #666; font-size: 12px; margin-top: 5px;">
                    文件名: ${current.region}${current.year}${current.type}一分一段表.xlsx
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="download-now" style="flex: 1; padding: 10px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    立即下载
                </button>
                <button id="cancel-download" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    取消
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // 绑定按钮事件
        document.getElementById('download-now').addEventListener('click', () => {
            downloadData(lastCapturedData, current);
            document.body.removeChild(notification);
        });

        document.getElementById('cancel-download').addEventListener('click', () => {
            document.body.removeChild(notification);
        });

        // 5秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }



    // 下载数据（简化版，不做复杂的去重处理）
    function downloadData(apiData, selectionInfo) {
        try {
            console.log('[拦截器] 开始处理下载数据...');
            
            if (!apiData.data || !apiData.data.list) {
                throw new Error('数据格式错误：缺少data.list字段');
            }

            const listData = apiData.data.list;
            const extractedData = [];

            console.log('[拦截器] 原始数据条目数:', Object.keys(listData).length);

            // 直接提取数据，不做复杂处理
            for (const scoreKey in listData) {
                const item = listData[scoreKey];
                if (item && typeof item === 'object') {
                    extractedData.push({
                        '分数': item.score || '',
                        '本段人数': item.num || '',
                        '累计人数': item.total || ''
                    });
                }
            }

            console.log('[拦截器] 提取数据条目数:', extractedData.length);

            if (extractedData.length === 0) {
                throw new Error('没有提取到有效数据');
            }

            // 按累计人数排序
            extractedData.sort((a, b) => {
                const totalA = parseInt(a['累计人数']) || 0;
                const totalB = parseInt(b['累计人数']) || 0;
                return totalA - totalB;
            });

            // 生成Excel文件
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(extractedData);

            // 设置列宽
            const colWidths = [
                { wch: 15 }, // 分数
                { wch: 12 }, // 本段人数
                { wch: 12 }  // 累计人数
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, '一分一段表');

            // 生成文件名
            const filename = `${selectionInfo.region}${selectionInfo.year}${selectionInfo.type}一分一段表.xlsx`;

            // 下载文件
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showStatus(`✅ 下载成功: ${filename} (${extractedData.length}条)`, 'success');
            console.log(`[拦截器] ✅ 下载成功: ${filename}，共 ${extractedData.length} 条记录`);
            
            // 输出数据验证信息
            console.log('[拦截器] 数据验证:');
            console.log('- 最低分数段:', extractedData[0]['分数']);
            console.log('- 最高分数段:', extractedData[extractedData.length - 1]['分数']);
            console.log('- 最小累计人数:', extractedData[0]['累计人数']);
            console.log('- 最大累计人数:', extractedData[extractedData.length - 1]['累计人数']);

        } catch (error) {
            console.error('[拦截器] 下载失败:', error);
            showStatus(`❌ 下载失败: ${error.message}`, 'error');
        }
    }

    // 更新拦截状态
    function updateInterceptStatus(message, type = 'info') {
        const statusDiv = document.getElementById('intercept-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            
            const colors = {
                'info': '#e3f2fd',
                'success': '#e8f5e8',
                'error': '#ffebee',
                'warning': '#fff3e0'
            };
            
            statusDiv.style.backgroundColor = colors[type] || colors.info;
            statusDiv.style.color = type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : type === 'warning' ? '#f57c00' : '#1565c0';
        }
    }

    // 显示状态
    function showStatus(message, type = 'info') {
        const status = document.getElementById('status');
        if (status) {
            status.style.display = 'block';
            status.textContent = message;
            
            const colors = {
                'info': '#e3f2fd',
                'success': '#e8f5e8',
                'error': '#ffebee',
                'warning': '#fff3e0'
            };
            
            status.style.backgroundColor = colors[type] || colors.info;
            status.style.color = type === 'error' ? '#c62828' : type === 'success' ? '#2e7d32' : type === 'warning' ? '#f57c00' : '#1565c0';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            if (!document.getElementById('gaokao-interceptor-panel')) {
                createInterceptorPanel();
                observePageChanges();
            }
        }
    });

    // 初始化
    function init() {
        // 保存原始函数
        originalFetch = window.fetch;
        originalXMLHttpRequest = window.XMLHttpRequest;
        
        // 立即设置网络拦截
        setupNetworkInterception();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    createInterceptorPanel();
                    observePageChanges();
                }, 1000);
            });
        } else {
            setTimeout(() => {
                createInterceptorPanel();
                observePageChanges();
            }, 1000);
        }
    }

    init();
    console.log('[拦截器] 🚀 高考数据拦截器（2025版）已加载，只拦截2025年数据！快捷键: Ctrl+Shift+I');

})(); 