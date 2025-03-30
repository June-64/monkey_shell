// ==UserScript==
// @name         DLX测评自动答题
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  DLX测评自动答题
// @author       june
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 配置项
    const config = {
        // 下一步按钮的可能选择器，会按顺序尝试
        nextButtonSelectors: [
            'button:contains("下一题")',
            'input[value="下一题"]',
            'a:contains("下一题")',
            '.next-btn',
            '#next-button',
            'button.next',
            'button[id*="next"]',
            'button[class*="next"]',
            // 添加特殊的div按钮选择器
            'div.i_btn.large',
            'div.i_btn:contains("下一题")',
            'div[class*="btn"]:contains("下一题")',
            // 添加更多可能的下一步按钮选择器
            'button:contains("下一步")',
            'input[value="下一步"]',
            'a:contains("下一步")',
            '.el-button--primary',
            // 添加完成测评按钮选择器
            'button:contains("完成测评")',
            'input[value="完成测评"]',
            'a:contains("完成测评")',
            '.el-button:contains("完成测评")',
            'div.i_btn:contains("完成测评")',
            'div[class*="btn"]:contains("完成测评")'
        ],
        // 脚本执行间隔（毫秒）·
        interval: 100,
        // 是否启用日志
        enableLog: true
    };

    // 任务状态
    let isRunning = false;
    let intervalId = null;
    let controlButton = null;

    // 日志函数
    function log(message) {
        if (config.enableLog) {
            console.log(`[随机Radio选择器] ${message}`);
        }
    }

    // 获取页面上所有可见且可用的radio按钮 - 更新以支持Element UI
    function getAllRadios() {
        // 获取标准radio按钮
        const standardRadios = Array.from(document.querySelectorAll('input[type="radio"]:not(:disabled)'));

        // 获取Element UI风格的radio (label[role="radio"])
        const elementUIRadios = Array.from(document.querySelectorAll('label.el-radio'));

        // 合并两种类型的radio
        const allRadios = [...standardRadios, ...elementUIRadios];

        return allRadios.filter(radio => {
            const style = window.getComputedStyle(radio);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            return isVisible;
        });
    }

    // 获取radio元素的名称（分组依据）
    function getRadioName(radio) {
        // 如果是标准radio按钮
        if (radio.tagName === 'INPUT') {
            return radio.name || 'unnamed';
        }
        // 如果是Element UI的radio按钮
        else if (radio.classList.contains('el-radio')) {
            // 尝试从内部的input获取name
            const input = radio.querySelector('input[type="radio"]');
            if (input && input.name) {
                return input.name;
            }
            // 或者使用值作为分组依据
            else if (input && input.value) {
                return 'group-' + radio.closest('.el-radio-group')?.getAttribute('id') || 'el-radio-group';
            }
            return 'el-radio-group';
        }
        return 'unnamed';
    }

    // 随机选择一个radio按钮
    function selectRandomRadio() {
        const radios = getAllRadios();
        log(`找到 ${radios.length} 个可选的radio按钮`);

        if (radios.length === 0) {
            log('没有找到可用的radio按钮');
            return false;
        }

        // 按照选项组对radio进行分组
        const radioGroups = {};
        radios.forEach(radio => {
            const name = getRadioName(radio);
            if (!radioGroups[name]) {
                radioGroups[name] = [];
            }
            radioGroups[name].push(radio);
        });

        // 对每个组随机选择一个radio
        let selectedAny = false;
        for (const groupName in radioGroups) {
            const group = radioGroups[groupName];
            if (group.length > 0) {
                const randomIndex = Math.floor(Math.random() * group.length);
                const selectedRadio = group[randomIndex];

                // 根据元素类型选择点击方式
                if (selectedRadio.tagName === 'INPUT') {
                    // 标准radio按钮
                    if (!selectedRadio.checked) {
                        selectedRadio.checked = true;
                        selectedRadio.click(); // 触发可能的事件监听器
                        log(`已随机选择标准radio: ${groupName}[${randomIndex}]`);
                    } else {
                        log(`标准radio: ${groupName}[${randomIndex}] 已经被选中`);
                    }
                } else if (selectedRadio.classList.contains('el-radio')) {
                    // Element UI radio按钮 - 直接点击label
                    log(`点击Element UI radio: ${groupName}[${randomIndex}]`);
                    selectedRadio.click();
                }
                selectedAny = true;
            }
        }

        return selectedAny;
    }

    // 查找并点击下一步按钮
    function clickNextButton() {
        let nextButton = null;

        // 尝试所有可能的选择器
        for (const selector of config.nextButtonSelectors) {
            try {
                // 对于包含文本的选择器，需要特殊处理
                if (selector.includes(':contains')) {
                    const textToFind = selector.match(/:contains\("(.+?)"\)/)[1];
                    const possibleElements = Array.from(
                        document.querySelectorAll('button, input[type="button"], input[type="submit"], a, div[class*="btn"]')
                    );

                    nextButton = possibleElements.find(el =>
                        el.textContent.includes(textToFind) ||
                        el.value === textToFind
                    );
                } else {
                    nextButton = document.querySelector(selector);
                }

                if (nextButton) {
                    break;
                }
            } catch (e) {
                log(`选择器 ${selector} 异常: ${e.message}`);
            }
        }

        // 如果没找到，尝试更通用的方法查找带有"下一"字样的按钮
        if (!nextButton) {
            const possibleElements = Array.from(
                document.querySelectorAll('button, input[type="button"], input[type="submit"], a, .el-button, div[class*="btn"]')
            );

            nextButton = possibleElements.find(el =>
                (el.textContent && (el.textContent.includes('下一') || el.textContent.includes('下一题') || el.textContent.includes('下一步') || el.textContent.includes('完成测评'))) ||
                el.value === '下一步' ||
                el.value === '下一题' ||
                el.value === '完成测评'
            );
        }

        // 专门检查用户提供的特殊格式按钮
        if (!nextButton) {
            const specialButtons = Array.from(document.querySelectorAll('div.i_btn.large'));
            nextButton = specialButtons.find(el => el.textContent.includes('下一题'));
        }

        if (nextButton) {
            log('找到下一步按钮，点击它');
            nextButton.click();
            return true;
        } else {
            log('没有找到下一步按钮');
            return false;
        }
    }

    // 主函数：随机选择radio并点击下一步
    function processPage() {
        if (!isRunning) return;

        log('开始处理页面');
        const radioSelected = selectRandomRadio();

        if (radioSelected) {
            // 短暂延迟后点击下一步按钮
            setTimeout(() => {
                if (isRunning) {
                    clickNextButton();
                }
            }, 100);
        } else {
            // 如果没有找到可选的radio，可能是页面已经到了最后，尝试直接点击下一步
            setTimeout(() => {
                if (isRunning) {
                    clickNextButton();
                }
            }, 100);
        }
    }

    // 创建控制按钮 - 重写这部分以修复错误
    function createControlButton() {
        try {
            // 创建按钮元素
            controlButton = document.createElement('button');
            controlButton.innerText = '开始任务';
            controlButton.id = 'radio-selector-control-btn';

            // 设置按钮样式
            controlButton.style.position = 'fixed';
            controlButton.style.bottom = '20px';
            controlButton.style.right = '20px';
            controlButton.style.zIndex = '9999';
            controlButton.style.padding = '10px 15px';
            controlButton.style.backgroundColor = '#4CAF50';
            controlButton.style.color = 'white';
            controlButton.style.border = 'none';
            controlButton.style.borderRadius = '5px';
            controlButton.style.cursor = 'pointer';
            controlButton.style.fontSize = '14px';
            controlButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

            // 添加点击事件
            controlButton.addEventListener('click', toggleTask);

            // 添加到页面
            document.body.appendChild(controlButton);

            log('控制按钮已创建');
        } catch (error) {
            console.error('创建控制按钮时出错:', error);
        }
    }

    // 切换任务状态
    function toggleTask() {
        isRunning = !isRunning;

        if (isRunning) {
            // 开始任务
            log('任务开始');
            controlButton.innerText = '暂停任务';
            controlButton.style.backgroundColor = '#f44336'; // 红色

            // 立即执行一次，然后设置定时器
            processPage();
            intervalId = setInterval(processPage, config.interval);
        } else {
            // 暂停任务
            log('任务暂停');
            controlButton.innerText = '开始任务';
            controlButton.style.backgroundColor = '#4CAF50'; // 绿色

            // 清除定时器
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }
    }

    // 初始化脚本
    function initialize() {
        log('脚本初始化中');
        setTimeout(function() {
            try {
                createControlButton();
            } catch (err) {
                console.error('初始化时出错:', err);
            }
        }, 1000);
    }

    // 页面加载完成后初始化脚本
    if (document.readyState === 'complete') {
        initialize();
    } else {
        window.addEventListener('load', initialize);
    }
})();