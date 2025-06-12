// ==UserScript==
// @name         网页自动化流程管理
// @namespace    https://june-64.github.io/monkey_shell/
// @version      6.2
// @description  一个功能强大的网页自动化工具，支持多方案、步骤类型、持久化存储和高级流程控制。
// @author       june
// @homepageURL  https://june-64.github.io/monkey_shell/
// @updateURL    https://raw.githubusercontent.com/June-64/monkey_shell/main/auto-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/June-64/monkey_shell/main/auto-clicker.user.js
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/npm/flatpickr
// @require      https://npmcdn.com/flatpickr/dist/l10n/zh.js
// @resource     flatpickr_css https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css
// @resource     flatpickr_dark_css https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // --- Guard against running in iframes ---
  if (window.self !== window.top) {
    console.log('网页自动化流程管理: Detected iframe, aborting script execution.');
    return;
  }

  const SCRIPT_ID = "auto-clicker-pro-v3";
  // --- Guard against multiple script instances ---
  if (document.getElementById(`${SCRIPT_ID}-panel`)) {
    console.log("网页自动化流程管理: Script already running. Aborting duplicate instance.");
    return;
  }

  // 注入 flatpickr 的样式
  const flatpickrCss = GM_getResourceText("flatpickr_css");
  const flatpickrDarkCss = GM_getResourceText("flatpickr_dark_css");
  GM_addStyle(flatpickrCss);
  GM_addStyle(flatpickrDarkCss);
  // 确保日历在我们的面板之上
  GM_addStyle(`.flatpickr-calendar { z-index: 100001 !important; }`);

  // --- 全局变量和状态 ---
  let scenarios = {};
  let activeScenarioName = null;
  let isSelecting = false;
  let selectionCallback = null; // 用于选择元素后的回调
  let highlightElement = null;
  let countdownIntervalId = null;
  let wasDragged = false;

  // --- 初始化 ---
  createPanel();
  initFlatpickr();

  // --- UI界面创建 ---
  function createPanel() {
    const panel = document.createElement("div");
    panel.id = `${SCRIPT_ID}-panel`;
    document.body.appendChild(panel);

    panel.innerHTML = `
            <div class="ac-header"><span class="ac-title">流程管理 v6.2</span><span class="ac-toggle-btn" title="最小化面板">—</span></div>
            <div class="ac-body">
                <div class="ac-section ac-scenario-manager">
                    <label>当前方案:</label>
                    <div id="ac-scenario-display" class="ac-scenario-controls"><select id="ac-scenario-select"></select><button id="ac-add-scenario-btn" title="新建方案">+</button><button id="ac-delete-scenario-btn" title="删除当前方案">-</button></div>
                    <div id="ac-scenario-creator" class="ac-scenario-controls" style="display: none;"><input type="text" id="ac-new-scenario-name" placeholder="输入新方案名称..."><button id="ac-save-scenario-btn" title="保存">✓</button><button id="ac-cancel-scenario-btn" title="取消">✗</button></div>
                </div>

                <div class="ac-section ac-steps-container">
                    <div class="ac-collapsible-header" data-section-key="steps">
                        <h3>操作步骤</h3>
                        <div class="ac-header-controls">
                            <div class="ac-add-step-buttons">
                                <button id="ac-add-click-btn" class="ac-btn ac-btn-icon" title="添加点击步骤">🖱️</button>
                                <button id="ac-add-input-btn" class="ac-btn ac-btn-icon" title="添加输入步骤">⌨️</button>
                                <button id="ac-add-wait-btn" class="ac-btn ac-btn-icon" title="添加等待步骤">⏱️</button>
                            </div>
                            <span class="ac-collapse-icon">▲</span>
                        </div>
                    </div>
                    <div class="ac-collapsible-content">
                        <ul id="ac-steps-list"></ul>
                    </div>
                </div>

                <div class="ac-section ac-timer-section">
                    <div class="ac-collapsible-header" data-section-key="timer">
                        <h3>定时任务</h3>
                        <div class="ac-header-controls">
                            <span class="ac-collapse-icon">▲</span>
                        </div>
                    </div>
                    <div class="ac-collapsible-content">
                        <div id="ac-timer-status">未设置</div>
                        <input type="text" id="ac-timer-input" placeholder="点击选择执行时间...">
                        <div class="ac-timer-buttons"><button id="ac-set-timer-btn" class="ac-btn ac-btn-secondary">设置</button><button id="ac-pause-resume-btn" class="ac-btn ac-btn-warning" disabled>暂停</button><button id="ac-cancel-timer-btn" class="ac-btn ac-btn-danger" disabled>取消</button></div>
                    </div>
                </div>

                <div class="ac-section"><button id="ac-run-btn" class="ac-btn ac-btn-main">立即执行当前方案</button></div>
            </div>
        `;

    const minimap = document.createElement("div");
    minimap.id = `${SCRIPT_ID}-minimap`;
    minimap.title = "展开流程管理面板";
    minimap.innerHTML = `⚙️`;
    document.body.appendChild(minimap);

    applyStyles();
    attachEventListeners();
    initCollapsibleSections();
    loadScenarios();
    initPositioningAndDraggability();

    // --- Add Menu Command for Position Reset ---
    GM_registerMenuCommand("重置面板位置", resetPanelPosition);

    const isCollapsed = GM_getValue("isPanelCollapsed", true);
    panel.style.display = isCollapsed ? "none" : "block";
    minimap.style.display = isCollapsed ? "flex" : "none";
  }

  // --- 样式定义 (部分调整) ---
  function applyStyles() {
    GM_addStyle(`
            #${SCRIPT_ID}-panel, #${SCRIPT_ID}-minimap { position: fixed; z-index: 99999; }
            #${SCRIPT_ID}-panel { width: 340px; background-color: #2c3e50; color: #ecf0f1; border-radius: 12px; font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .ac-body { padding: 20px; display: flex; flex-direction: column; gap: 15px; }
            .ac-add-step-buttons { display: flex; gap: 8px; }
            #ac-steps-list { list-style-type: none; padding: 0; margin: 0; max-height: 250px; overflow-y: auto; }
            #ac-steps-list::-webkit-scrollbar { width: 8px; }
            #ac-steps-list::-webkit-scrollbar-track { background: #2c3e50; }
            #ac-steps-list::-webkit-scrollbar-thumb { background-color: #56708b; border-radius: 4px; }
            #ac-steps-list::-webkit-scrollbar-thumb:hover { background-color: #6c88a9; }
            #ac-steps-list li { padding: 8px 12px; border-bottom: 1px solid #4a627a; display: flex; align-items: center; transition: background-color 0.2s; cursor: grab; }
            #ac-steps-list li:hover { background-color: #34495e; }
            #ac-steps-list li .step-icon { width: 30px; font-size: 18px; text-align: center; }
            #ac-steps-list li .step-details { flex-grow: 1; overflow: hidden; }
            #ac-steps-list li .step-details .step-type { font-weight: bold; color: #3498db; }
            #ac-steps-list li .step-details .step-param { font-size: 0.9em; color: #bdc3c7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
            .ac-delete-step-btn { background: none; border: none; cursor: pointer; font-size: 16px; opacity: 0.7; transition: opacity 0.2s; margin-left: auto; padding-left: 10px; }
            /* Modal for Step Editor & Add Step */
            .ac-modal-content label { margin-top: 15px; display: block; }
            .ac-modal-content input, .ac-modal-content textarea { width: 100%; background-color: #34495e; color: #ecf0f1; border: 1px solid #4a627a; padding: 8px; border-radius: 5px; box-sizing: border-box; margin-top: 5px; }
            .ac-modal-content .input-group { display: flex; align-items: center; gap: 8px; }
            .ac-modal-content .input-group button { width: auto; flex-shrink: 0; }
            
            .ac-header {
                padding: 12px 20px; background-color: #34495e; cursor: grab;
                border-top-left-radius: 12px; border-top-right-radius: 12px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .ac-header:active { cursor: grabbing; }
            .ac-title { font-size: 18px; font-weight: 600; }
            .ac-toggle-btn { cursor: pointer; font-size: 20px; line-height: 1; padding: 5px; border-radius: 50%; transition: background-color 0.2s; }
            .ac-toggle-btn:hover { background-color: rgba(255,255,255,0.1); }
            .ac-section { border-top: 1px solid #4a627a; padding-top: 20px; }
            .ac-section:first-child { border-top: none; padding-top: 0; }
            .ac-collapsible-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; margin-bottom: 10px; }
            .ac-collapsible-header h3 { margin: 0; font-size: 16px; color: #bdc3c7; }
            .ac-header-controls { display: flex; align-items: center; gap: 15px; }
            .ac-collapse-icon { font-size: 14px; transition: transform 0.3s ease; transform-origin: center; user-select: none; }
            .ac-section.collapsed .ac-collapsible-content { display: none; }
            .ac-section.collapsed .ac-collapsible-header { margin-bottom: 0; }
            .ac-section.collapsed .ac-collapse-icon { transform: rotate(-90deg); }
            label { display: block; margin-bottom: 8px; font-size: 14px; color: #bdc3c7; }
            
            /* Scenario Manager */
            .ac-scenario-controls { display: flex; gap: 8px; }
            #ac-scenario-select { flex-grow: 1; background-color: #34495e; color: #ecf0f1; border: 1px solid #4a627a; padding: 8px; border-radius: 5px; }
            #ac-scenario-select:focus { outline: none; border-color: #3498db; }
            .ac-scenario-controls button { width: 35px; height: 35px; background-color: #56708b; color: #ecf0f1; border: none; border-radius: 5px; font-size: 20px; cursor: pointer; transition: background-color 0.2s; }
            .ac-scenario-controls button:hover { background-color: #6c88a9; }
            #ac-new-scenario-name { flex-grow: 1; background-color: #34495e; color: #ecf0f1; border: 1px solid #4a627a; padding: 0 10px; border-radius: 5px; font-size: 14px; }
            #ac-save-scenario-btn { background-color: #27ae60; }
            #ac-cancel-scenario-btn { background-color: #c0392b; }
            
            /* Buttons */
            .ac-btn { width: 100%; padding: 12px; border: none; border-radius: 5px; font-size: 15px; cursor: pointer; transition: background-color 0.2s, opacity 0.2s, transform 0.1s; font-weight: 500;}
            .ac-btn:active { transform: scale(0.98); }
            .ac-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .ac-btn-primary { background-color: #27ae60; color: white; } /* Green */
            .ac-btn-primary:hover:not(:disabled) { background-color: #2ecc71; }
            .ac-btn.ac-btn-icon { width: 35px; height: 35px; padding: 0; font-size: 18px; background-color: #56708b; }
            .ac-btn.ac-btn-icon:hover:not(:disabled) { background-color: #6c88a9; }
            #ac-select-btn.selecting { background-color: #e67e22; } /* Orange */
            .ac-btn-main { background-color: #3498db; color: white; } /* Blue */
            .ac-btn-main:hover:not(:disabled) { background-color: #5dade2; }
            .ac-btn-secondary { background-color: #8e44ad; color: white; } /* Purple */
            .ac-btn-warning { background-color: #f39c12; color: white; } /* Yellow */
            .ac-btn-danger { background-color: #c0392b; color: white; } /* Red */
            .ac-btn-success { background-color: #27ae60; color: white; } /* Green, for modals */
            
            /* Drag and Drop styles */
            #ac-steps-list li.dragging { opacity: 0.5; background: #56708b; }
            #ac-steps-list li.drag-over { border-top: 2px solid #3498db; }

            /* Highlights */
            .ac-highlight { outline: 3px dashed #e67e22 !important; background-color: rgba(230, 126, 34, 0.1) !important; cursor: pointer !important; }
            .ac-hover-highlight { outline: 3px solid #3498db !important; background-color: rgba(52, 152, 219, 0.15) !important; }

            /* Minimap Icon */
            #${SCRIPT_ID}-minimap {
                width: 50px; height: 50px;
                background-color: #34495e; color: #ecf0f1; border-radius: 50%;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                cursor: pointer; display: flex; justify-content: center;
                align-items: center; font-size: 24px; transition: transform 0.2s ease;
            }
            #${SCRIPT_ID}-minimap:hover { transform: scale(1.1) rotate(45deg); }

            /* Custom Modal */
            .ac-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0,0,0,0.6); z-index: 100002;
                display: flex; justify-content: center; align-items: center;
                opacity: 0; transition: opacity 0.2s ease-in-out;
            }
            .ac-modal-overlay.visible { opacity: 1; }
            .ac-modal {
                background-color: #2c3e50; padding: 25px; border-radius: 10px;
                box-shadow: 0 5px 25px rgba(0,0,0,0.4);
                width: 90%; max-width: 400px;
                transform: scale(0.9); transition: transform 0.2s ease-in-out;
            }
            .ac-modal-overlay.visible .ac-modal { transform: scale(1); }
            .ac-modal-title { margin: 0 0 15px 0; font-size: 20px; color: #ecf0f1; }
            .ac-modal-message { margin: 0 0 25px 0; font-size: 16px; color: #bdc3c7; line-height: 1.6; }
            .ac-modal-footer { display: flex; justify-content: flex-end; gap: 10px; }

            /* Timer Section */
            #ac-timer-input { width: 100%; background-color: #34495e; color: #ecf0f1; border: 1px solid #4a627a; padding: 8px; border-radius: 5px; box-sizing: border-box; margin-bottom: 10px; }
            .ac-timer-buttons { display: flex; gap: 8px; }
            #ac-timer-status {
                background-color: #34495e;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                text-align: center;
                font-size: 15px;
                color: #ecf0f1;
                transition: background-color 0.3s;
            }
            #ac-timer-status.paused {
                background-color: #f39c12;
                color: #2c3e50;
                font-weight: 600;
            }
            body.ac-is-dragging {
                user-select: none !important;
            }
        `);
  }

  // --- 事件绑定 (部分调整) ---
  function attachEventListeners() {
    console.log("Attaching listeners..."); // Debugging line

    // UI Controls
    document
      .querySelector(`#${SCRIPT_ID}-panel .ac-toggle-btn`)
      .addEventListener("click", togglePanel);
    document
      .getElementById(`${SCRIPT_ID}-minimap`)
      .addEventListener("click", togglePanel);
    document
      .getElementById("ac-scenario-select")
      .addEventListener("change", switchScenario);
    document
      .getElementById("ac-add-scenario-btn")
      .addEventListener("click", showScenarioCreator);
    document
      .getElementById("ac-save-scenario-btn")
      .addEventListener("click", saveNewScenario);
    document
      .getElementById("ac-cancel-scenario-btn")
      .addEventListener("click", hideScenarioCreator);
    document
      .getElementById("ac-delete-scenario-btn")
      .addEventListener("click", deleteScenario);
    
    // Add Step buttons (event delegation)
    document.querySelector('.ac-add-step-buttons').addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;

      let type;
      switch(button.id) {
        case 'ac-add-click-btn': type = 'click'; break;
        case 'ac-add-input-btn': type = 'inputText'; break;
        case 'ac-add-wait-btn': type = 'wait'; break;
        default: return;
      }
      addStep(type);
    });

    document.getElementById('ac-steps-list').addEventListener('click', handleStepListClick);
    document.getElementById('ac-run-btn').addEventListener('click', executeSteps);

    // Timer Controls
    document
      .getElementById("ac-set-timer-btn")
      .addEventListener("click", setTimer);
    document
      .getElementById("ac-pause-resume-btn")
      .addEventListener("click", pauseResumeTimer);
    document
      .getElementById("ac-cancel-timer-btn")
      .addEventListener("click", cancelTimer);

    // Drag and Drop for steps
    const stepsList = document.getElementById("ac-steps-list");
    let draggedItem = null;

    stepsList.addEventListener("dragstart", (e) => {
      draggedItem = e.target;
      // Timeout to allow the browser to render the drag image
      setTimeout(() => e.target.classList.add("dragging"), 0);
    });

    stepsList.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(stepsList, e.clientY);
      const currentOver = stepsList.querySelector(".drag-over");
      if (currentOver) currentOver.classList.remove("drag-over");

      if (afterElement == null) {
        // Not inserting, maybe add a class to the list itself
      } else {
        afterElement.classList.add("drag-over");
      }
    });

    stepsList.addEventListener("drop", (e) => {
      e.preventDefault();
      const fromIndex = parseInt(draggedItem.dataset.index, 10);
      const targetElement = e.target.closest("li");

      if (!targetElement && !stepsList.contains(e.target)) return; // Dropped outside list

      const allItems = [...stepsList.querySelectorAll("li:not(.dragging)")];
      let toIndex = allItems.indexOf(targetElement);

      // If dropped on the placeholder or in the second half of an element, adjust index
      const afterElement = getDragAfterElement(stepsList, e.clientY);
      if (afterElement) {
        toIndex = Array.from(stepsList.children).indexOf(afterElement);
      } else {
        toIndex = scenarios[activeScenarioName].steps.length;
      }
      if (fromIndex < toIndex) {
        toIndex--;
      }

      // Reorder data
      const [movedStep] = scenarios[activeScenarioName].steps.splice(
        fromIndex,
        1
      );
      scenarios[activeScenarioName].steps.splice(toIndex, 0, movedStep);

      saveScenarios();
      renderSteps(); // Re-render to reflect new order
    });

    stepsList.addEventListener("dragend", (e) => {
      if (draggedItem) {
        draggedItem.classList.remove("dragging");
        const currentOver = stepsList.querySelector(".drag-over");
        if (currentOver) currentOver.classList.remove("drag-over");
        draggedItem = null;
      }
    });
  }

  // --- 数据模型 ---
  function createStep(type) {
    return {
      id: `step_${Date.now()}_${Math.random()}`,
      type: type,
      // Default values
      selector: "",
      inputValue: "",
      waitTime: 1,
      // ... other future properties
    };
  }

  function loadScenarios() {
    let savedScenarios = JSON.parse(GM_getValue("scenarios", "{}"));
    // Migration from simple string array to object array
    Object.values(savedScenarios).forEach((scenario) => {
      if (scenario.steps.length > 0 && typeof scenario.steps[0] === "string") {
        scenario.steps = scenario.steps.map((selector) => ({
          id: `step_${Date.now()}_${Math.random()}`,
          type: "click",
          selector: selector,
          inputValue: "",
          waitTime: 1,
        }));
      }
    });

    scenarios = savedScenarios;
    if (Object.keys(scenarios).length === 0) {
      scenarios = { 默认方案: { steps: [], timer: null } };
    }
    activeScenarioName = GM_getValue(
      "activeScenarioName",
      Object.keys(scenarios)[0]
    );
    if (!scenarios[activeScenarioName])
      activeScenarioName = Object.keys(scenarios)[0];

    renderScenariosDropdown();
    renderSteps();
    updateTimerUI();
  }

  function saveScenarios() {
    GM_setValue("scenarios", JSON.stringify(scenarios));
    GM_setValue("activeScenarioName", activeScenarioName);
  }

  function showScenarioCreator() {
    document.getElementById("ac-scenario-display").style.display = "none";
    document.getElementById("ac-scenario-creator").style.display = "flex";
    document.getElementById("ac-new-scenario-name").focus();
  }

  function hideScenarioCreator() {
    document.getElementById("ac-scenario-creator").style.display = "none";
    document.getElementById("ac-scenario-display").style.display = "flex";
    document.getElementById("ac-new-scenario-name").value = "";
  }

  function saveNewScenario() {
    const input = document.getElementById("ac-new-scenario-name");
    const name = input.value.trim();

    if (name && !scenarios[name]) {
      scenarios[name] = { steps: [], timer: null };
      activeScenarioName = name;
      saveScenarios();
      renderScenariosDropdown();
      renderSteps();
      updateTimerUI();
      hideScenarioCreator();
    } else if (!name) {
      showNotification("方案名称不能为空！", "error");
    } else {
      showNotification("该方案名称已存在！", "error");
    }
  }

  function deleteScenario() {
    if (Object.keys(scenarios).length <= 1) {
      showModal({ title: "操作失败", message: "不能删除最后一个方案。" });
      return;
    }

    showModal({
      title: "确认删除",
      message: `您确定要删除方案 "${activeScenarioName}" 吗？此操作无法撤销。`,
      buttons: [
        { text: "取消", type: "secondary" },
        {
          text: "确认删除",
          type: "danger",
          onClick: (modal, closeModal) => {
            const deletedScenarioName = activeScenarioName;
            delete scenarios[activeScenarioName];
            activeScenarioName = Object.keys(scenarios)[0];
            saveScenarios();
            renderScenariosDropdown();
            renderSteps();
            updateTimerUI();
            showNotification(
              `方案 "${deletedScenarioName}" 已被删除。`,
              "info"
            );
            closeModal();
          },
        },
      ],
    });
  }

  function switchScenario(e) {
    activeScenarioName = e.target.value;
    GM_setValue("activeScenarioName", activeScenarioName);
    renderSteps();
    updateTimerUI();
  }

  function renderScenariosDropdown() {
    const select = document.getElementById("ac-scenario-select");
    select.innerHTML = "";
    Object.keys(scenarios).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = activeScenarioName;
  }

  // --- 核心UI渲染与交互 ---

  function renderSteps() {
    const list = document.getElementById("ac-steps-list");
    list.innerHTML = "";
    if (!activeScenarioName || !scenarios[activeScenarioName] || scenarios[activeScenarioName].steps.length === 0) {
        list.innerHTML = '<li><span class="step-details" style="text-align: center; width: 100%; color: #7f8c8d;">暂无步骤，请添加操作</span></li>';
        return;
    }

    scenarios[activeScenarioName].steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      li.draggable = true;
      
      let icon, typeText, paramText, fullDetails;

      const stepNameOrDefault = escapeHtml(step.name || '');

      switch (step.type) {
        case 'click': 
          icon = '🖱️'; 
          typeText = '点击'; 
          paramText = stepNameOrDefault || `点击 #${index + 1}`;
          fullDetails = `目标: ${step.selector}`; 
          break;
        case 'inputText': 
          icon = '⌨️'; 
          typeText = '输入'; 
          paramText = stepNameOrDefault || `输入 #${index + 1}`;
          fullDetails = `输入 "${escapeHtml(step.inputValue)}" 到 ${step.selector}`; 
          break;
        case 'wait': 
          icon = '⏱️'; 
          typeText = '等待'; 
          paramText = stepNameOrDefault || `${step.waitTime} 秒`;
          fullDetails = `等待 ${step.waitTime} 秒`; 
          break;
        default:
          icon = '❓'; 
          typeText = '未知'; 
          paramText = stepNameOrDefault; 
          fullDetails = '未知操作'; 
          break;
      }

      li.innerHTML = `
        <div class="step-icon">${icon}</div>
        <div class="step-details">
            <div class="step-type">${typeText}</div>
            <div class="step-param" title="${fullDetails}">${paramText}</div>
        </div>
        <button class="ac-delete-step-btn" title="删除">❌</button>
      `;
      
      if (step.type === 'click' || step.type === 'inputText') {
        li.addEventListener('mouseenter', () => {
          try {
            const element = document.querySelector(step.selector);
            if (element) {
              element.classList.add('ac-hover-highlight');
            }
          } catch (e) {
            console.warn(`无法找到或高亮元素 (selector: ${step.selector}):`, e.message);
          }
        });

        li.addEventListener('mouseleave', () => {
          try {
            const element = document.querySelector(step.selector);
            if (element) {
              element.classList.remove('ac-hover-highlight');
            }
          } catch (e) { /* no-op */ }
        });
      }

      list.appendChild(li);
    });
  }

  function handleStepListClick(e) {
    const target = e.target;
    const li = target.closest("li");
    if (!li) return;

    const index = parseInt(li.dataset.index, 10);

    if (target.classList.contains("ac-delete-step-btn")) {
      // --- NEW: Remove highlight before deleting ---
      const step = scenarios[activeScenarioName].steps[index];
      if (step && step.selector) {
        try {
          const element = document.querySelector(step.selector);
          if (element) {
            element.classList.remove('ac-hover-highlight');
          }
        } catch (err) {
            console.warn(`Error removing highlight for selector "${step.selector}":`, err.message);
        }
      }

      scenarios[activeScenarioName].steps.splice(index, 1);
      saveScenarios();
      renderSteps();
    } else {
      // Click on step itself opens editor
      showStepEditor(scenarios[activeScenarioName].steps[index]);
    }
  }

  function addStep(type) {
    if (type === "wait") {
      showModal({
        title: "添加等待步骤",
        message: `<div class="ac-modal-content">
                      <label>步骤名称 (可选):</label>
                      <input type="text" id="step-editor-name" placeholder="例如: 等待页面加载">
                      <label>等待时间 (秒):</label>
                      <input type="number" id="step-editor-waitTime" value="1" min="0.1" step="0.1">
                  </div>`,
        buttons: [
          {
            text: "添加",
            type: "success",
            onClick: (modal, close) => {
              const waitTime = parseFloat(modal.querySelector("#step-editor-waitTime").value) || 1;
              const name = modal.querySelector("#step-editor-name").value.trim();
              const newStep = createStep("wait");
              newStep.waitTime = waitTime;
              newStep.name = name;
              scenarios[activeScenarioName].steps.push(newStep);
              saveScenarios();
              renderSteps();
              close();
            },
          },
          { text: "取消", type: "secondary", onClick: (modal, close) => close() },
        ],
      });
    } else {
      // For 'click' and 'inputText'
      startSelection((selector) => {
        const newStep = createStep(type);
        newStep.selector = selector;

        if (type === "inputText") {
          showModal({
            title: "添加输入步骤",
            message: `<div class="ac-modal-content">
                          <label>步骤名称 (可选):</label>
                          <input type="text" id="step-editor-name" placeholder="例如: 输入用户名">
                          <label>文本内容:</label>
                          <textarea id="step-editor-inputValue"></textarea>
                      </div>`,
            buttons: [
              {
                text: "添加",
                type: "success",
                onClick: (modal, close) => {
                  newStep.inputValue = modal.querySelector("#step-editor-inputValue").value;
                  newStep.name = modal.querySelector("#step-editor-name").value.trim();
                  scenarios[activeScenarioName].steps.push(newStep);
                  saveScenarios();
                  renderSteps();
                  close();
                },
              },
              { text: "取消", type: "secondary", onClick: (modal, close) => close() },
            ],
          });
        } else { // For 'click'
          showModal({
              title: "添加点击步骤",
              message: `<div class="ac-modal-content">
                            <label>步骤名称 (可选):</label>
                            <input type="text" id="step-editor-name" placeholder="例如: 点击登录按钮">
                            <p class="ac-modal-message" style="margin-top: 10px; font-size: 0.9em; color: #bdc3c7;">已选元素: <code style="background: #34495e; padding: 2px 4px; border-radius: 3px;">${escapeHtml(selector)}</code></p>
                        </div>`,
              buttons: [
                  {
                      text: "添加",
                      type: "success",
                      onClick: (modal, close) => {
                          newStep.name = modal.querySelector("#step-editor-name").value.trim();
                          scenarios[activeScenarioName].steps.push(newStep);
                          saveScenarios();
                          renderSteps();
                          close();
                      }
                  },
                  { text: "取消", type: "secondary", onClick: (m, c) => c() }
              ]
          });
        }
      });
    }
  }

  function showStepEditor(step) {
    if (!step) return;

    let contentHTML = `<div class="ac-modal-content">
                       <label>步骤名称:</label>
                       <input type="text" id="step-editor-name" value="${escapeHtml(step.name || '')}">`;
    let reselectNeeded = false;

    // Common fields
    if (step.type === "click" || step.type === "inputText") {
      reselectNeeded = true;
      contentHTML += `
                <label>目标元素选择器:</label>
                <div class="input-group">
                    <input type="text" id="step-editor-selector" value="${escapeHtml(step.selector)}">
                    <button id="step-editor-reselect" class="ac-btn ac-btn-warning">重新选择</button>
                </div>
            `;
    }

    // Type-specific fields
    switch (step.type) {
      case "inputText":
        contentHTML += `<label>要输入的文本:</label><textarea id="step-editor-inputValue">${escapeHtml(step.inputValue)}</textarea>`;
        break;
      case "wait":
        contentHTML += `<label>等待时间 (秒):</label><input type="number" id="step-editor-waitTime" value="${step.waitTime}" min="0.1" step="0.1">`;
        break;
    }
    contentHTML += "</div>";

    showModal({
      title: `编辑操作: ${step.type}`,
      message: contentHTML,
      buttons: [{ text: "保存", type: "success", isHtml: true }],
      onRender: (modal) => {
        const save = () => {
          // Save name
          step.name = modal.querySelector("#step-editor-name").value.trim();

          // Save common fields
          const selectorInput = modal.querySelector("#step-editor-selector");
          if (selectorInput) step.selector = selectorInput.value;

          // Save type-specific fields
          switch (step.type) {
            case "inputText":
              step.inputValue = modal.querySelector("#step-editor-inputValue").value;
              break;
            case "wait":
              step.waitTime = parseFloat(modal.querySelector("#step-editor-waitTime").value) || 1;
              break;
          }
          saveScenarios();
          renderSteps();
        };

        // Attach save logic to the button
        const saveButton = modal.querySelector(".ac-btn-success");
        saveButton.addEventListener("click", save);

        // Attach re-select logic
        if (reselectNeeded) {
          const reselectButton = modal.querySelector("#step-editor-reselect");
          reselectButton.addEventListener("click", () => {
            const currentModal = reselectButton.closest(".ac-modal-overlay");
            currentModal.style.display = "none"; // Temporarily hide modal

            startSelection((selector) => {
              modal.querySelector("#step-editor-selector").value = selector;
              currentModal.style.display = "flex"; // Show modal again
            });
          });
        }
      },
    });
  }

  // --- 选择器与执行引擎 (重构) ---

  function startSelection(callback) {
    isSelecting = true;
    selectionCallback = callback;
    showNotification("请在页面上点击一个元素...", "info");
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("click", onElementSelect, true);
    document.addEventListener("keydown", onEscKey);
  }

  function stopSelection() {
    isSelecting = false;
    selectionCallback = null;
    if (highlightElement) highlightElement.classList.remove("ac-highlight");
    document.removeEventListener("mouseover", onMouseOver);
    document.removeEventListener("click", onElementSelect, true);
    document.removeEventListener("keydown", onEscKey);
  }

  function onElementSelect(e) {
    if (!isSelecting) return;
    const panel = document.getElementById(`${SCRIPT_ID}-panel`);
    if (
      panel &&
      (panel.contains(e.target) || e.target.closest(".ac-modal-overlay"))
    )
      return;

    e.preventDefault();
    e.stopPropagation();

    const selector = getCssSelector(e.target);
    if (selectionCallback) {
      selectionCallback(selector);
    }
    stopSelection();
  }

  async function executeSteps() {
    const steps = scenarios[activeScenarioName]?.steps;
    if (!steps || steps.length === 0) {
      showNotification("当前方案没有步骤。", "error");
      return;
    }

    showNotification(`开始执行方案: "${activeScenarioName}"`, "success");

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepLi = document.querySelector(
        `#ac-steps-list li[data-index='${i}']`
      );
      if (stepLi) stepLi.style.backgroundColor = "#4a627a"; // Highlight current step in UI

      try {
        await executeSingleStep(step);
      } catch (error) {
        showNotification(`步骤 ${i + 1} 失败: ${error.message}`, "error");
        if (stepLi) stepLi.style.backgroundColor = ""; // Remove highlight on failure
        return; // Stop execution
      }

      if (stepLi) stepLi.style.backgroundColor = ""; // Remove highlight on success
    }

    showNotification("方案执行完毕。", "success");
  }

  function executeSingleStep(step) {
    return new Promise((resolve, reject) => {
      const el = step.selector ? document.querySelector(step.selector) : null;
      if ((step.type === "click" || step.type === "inputText") && !el) {
        return reject(new Error(`未找到元素 (${step.selector})`));
      }

      switch (step.type) {
        case "click":
          el.click();
          setTimeout(resolve, 500); // Small delay to allow UI to update
          break;
        case "inputText":
          el.value = step.inputValue;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          setTimeout(resolve, 500);
          break;
        case "wait":
          setTimeout(resolve, step.waitTime * 1000);
          break;
        default:
          reject(new Error("未知的操作类型"));
      }
    });
  }

  // --- 辅助函数 ---
  function togglePanel() {
    // A quick drag should not trigger a toggle. Check wasDragged flag.
    if (wasDragged) {
        wasDragged = false; // Reset for the next real click
        return;
    }
    const panel = document.getElementById(`${SCRIPT_ID}-panel`);
    const minimap = document.getElementById(`${SCRIPT_ID}-minimap`);
    const isCollapsed = panel.style.display === "none";

    if (isCollapsed) {
      panel.style.display = "block";
      minimap.style.display = "none";
    } else {
      if (isSelecting) {
        stopSelection();
      }
      panel.style.display = "none";
      minimap.style.display = "flex";
    }
    GM_setValue("isPanelCollapsed", !isCollapsed);
  }

  function onMouseOver(e) {
    if (!isSelecting) return;
    if (highlightElement) highlightElement.classList.remove("ac-highlight");
    const panel = document.getElementById(`${SCRIPT_ID}-panel`);
    if (panel && panel.contains(e.target)) {
      highlightElement = null;
      return;
    }
    highlightElement = e.target;
    highlightElement.classList.add("ac-highlight");
  }

  function onEscKey(e) {
    if (e.key === "Escape") stopSelection();
  }

  function showNotification(message, type = "info") {
    const notif = document.createElement("div");
    notif.textContent = message;
    notif.style.cssText = `position:fixed; top:20px; right:20px; padding:15px 25px; background-color:#34495e; color:white; border-radius:8px; z-index:100001; border-left: 5px solid ${
      type === "success" ? "#2ecc71" : type === "error" ? "#e74c3c" : "#3498db"
    }; box-shadow: 0 5px 15px rgba(0,0,0,0.2); transition: all 0.3s ease; opacity:0; transform: translateX(20px);`;
    document.body.appendChild(notif);
    setTimeout(() => {
      notif.style.opacity = "1";
      notif.style.transform = "translateX(0)";
    }, 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      notif.style.transform = "translateX(20px)";
      setTimeout(() => notif.remove(), 300);
    }, 4000);
  }

  function resetPanelPosition() {
    // Setting to undefined effectively deletes the key, so the default will be used on next load.
    GM_setValue("panelPosition", undefined); 
    showNotification('面板位置已重置，页面即将刷新...', 'success');
    setTimeout(() => window.location.reload(), 1500);
  }

  function initPositioningAndDraggability() {
    const panel = document.getElementById(`${SCRIPT_ID}-panel`);
    const minimap = document.getElementById(`${SCRIPT_ID}-minimap`);
    const header = panel.querySelector(".ac-header");

    const defaultValue = { top: "100px", right: "20px" };
    let position;

    try {
        let storedPos = GM_getValue("panelPosition");
        if (typeof storedPos === 'string' && storedPos.trim().startsWith('{')) {
            position = JSON.parse(storedPos);
        } else if (typeof storedPos === 'object' && storedPos !== null) {
            position = storedPos; // Use the object directly if that's what's stored
        } else {
            position = defaultValue; // Use default for undefined, null, or other types
        }
        
        // Final validation to ensure the object is usable
        if (typeof position.top !== 'string' || typeof position.right !== 'string') {
            throw new Error("Position object is missing 'top' or 'right' properties.");
        }
    } catch (e) {
        console.warn(`网页自动化流程管理: 加载面板位置失败，将重置为默认值。错误: ${e.message}`);
        position = defaultValue;
    }

    const applyPosition = (pos) => {
      panel.style.top = pos.top;
      panel.style.right = pos.right;
      panel.style.left = "auto"; // Ensure left is not set
      minimap.style.top = pos.top;
      minimap.style.right = pos.right;
      minimap.style.left = "auto"; // Ensure left is not set
    };
    applyPosition(position);

    let isDragging = false;
    let dragTarget = null;
    let offsetX, offsetY;

    const onDragStart = (e) => {
      // Only drag with the left mouse button
      if (e.button !== 0) return;

      if (e.target.classList.contains("ac-toggle-btn")) {
        wasDragged = false;
        return;
      }

      wasDragged = false;
      isDragging = true;
      dragTarget = e.currentTarget === header ? panel : minimap;
      const rect = dragTarget.getBoundingClientRect();
      // Calculate offset from the *right* edge
      offsetX = rect.right - e.clientX;
      offsetY = e.clientY - rect.top;
      
      document.body.classList.add('ac-is-dragging'); // Prevent text selection
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", onDragEnd, { once: true });
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      wasDragged = true;
      e.preventDefault();

      // Calculate raw new positions
      let newY = e.clientY - offsetY;
      let newRight = window.innerWidth - e.clientX - offsetX;

      // Boundary checks
      const rect = dragTarget.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      if (newY < 0) newY = 0; // Top boundary
      if (newY + rect.height > winHeight) newY = winHeight - rect.height; // Bottom boundary

      if (newRight < 0) newRight = 0; // Right boundary
      if (newRight + rect.width > winWidth) newRight = winWidth - rect.width; // Left boundary

      const newPosition = { top: `${newY}px`, right: `${newRight}px` };
      applyPosition(newPosition);
    };

    const onDragEnd = () => {
      document.body.classList.remove('ac-is-dragging'); // Re-enable text selection
      isDragging = false;
      dragTarget = null;
      document.removeEventListener("mousemove", onDrag);

      const finalPosition = { top: panel.style.top, right: panel.style.right };
      GM_setValue("panelPosition", JSON.stringify(finalPosition));
    };

    header.addEventListener("mousedown", onDragStart);
    minimap.addEventListener("mousedown", onDragStart);
  }

  function getCssSelector(el) {
    if (!(el instanceof Element)) return;
    let path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
      let selector = el.nodeName.toLowerCase();
      if (el.id) {
        selector += "#" + el.id;
        path.unshift(selector);
        break;
      } else {
        let sib = el,
          nth = 1;
        while ((sib = sib.previousElementSibling)) {
          if (sib.nodeName.toLowerCase() == selector) nth++;
        }
        if (nth != 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      el = el.parentNode;
    }
    return path.join(" > ");
  }

  function formatTime(ms) {
    if (ms <= 0) return "00:00:00";
    let totalSeconds = Math.round(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    totalSeconds %= 3600;
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  function showModal({
    title,
    message,
    buttons = [{ text: "好的", type: "main" }],
    onRender,
  }) {
    const overlay = document.createElement("div");
    overlay.className = "ac-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "ac-modal";

    const closeModal = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    let buttonsHTML = "";
    buttons.forEach((btn, index) => {
      buttonsHTML += `<button class="ac-btn ac-btn-${
        btn.type || "main"
      }" data-index="${index}">${btn.text}</button>`;
    });

    modal.innerHTML = `
            <h3 class="ac-modal-title">${title}</h3>
            <div class="ac-modal-message">${
              typeof message === "string" ? message : ""
            }</div>
            <div class="ac-modal-footer">${buttonsHTML}</div>
        `;

    if (typeof message !== "string" && message instanceof HTMLElement) {
      modal.querySelector(".ac-modal-message").innerHTML = ""; // Clear placeholder
      modal.querySelector(".ac-modal-message").appendChild(message);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.addEventListener("click", (e) => {
      const buttonEl = e.target.closest("button");
      if (buttonEl) {
        const btnIndex = buttonEl.dataset.index;
        if (btnIndex) {
          const buttonInfo = buttons[btnIndex];
          if (buttonInfo && buttonInfo.onClick) {
            buttonInfo.onClick(modal, closeModal);
          } else {
            closeModal(); // Default action for buttons without onClick
          }
        }
        // Stop the click from bubbling up and potentially triggering underlying elements
        e.stopPropagation();
        e.preventDefault();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    if (onRender) onRender(modal);

    // Make it visible with transition
    requestAnimationFrame(() => overlay.classList.add("visible"));
  }

  // --- 初始化 ---
  function initFlatpickr() {
    flatpickr("#ac-timer-input", {
      enableTime: true,
      enableSeconds: true,
      dateFormat: "Y-m-d H:i:S",
      time_24hr: true,
      locale: "zh",
    });
  }

  // --- 定时器功能 ---
  function setTimer() {
    const timeStr = document.getElementById("ac-timer-input").value;
    if (!timeStr) {
      showNotification("请选择一个时间。", "error");
      return;
    }
    const targetTime = new Date(timeStr).getTime();
    if (isNaN(targetTime) || targetTime <= Date.now()) {
      showNotification("请选择一个未来的时间。", "error");
      return;
    }

    scenarios[activeScenarioName].timer = {
      targetTime: targetTime,
      isPaused: false,
      remainingTime: null,
      timeoutId: setTimeout(executeSteps, targetTime - Date.now()),
    };
    saveScenarios();
    updateTimerUI();
  }

  function pauseResumeTimer() {
    let timer = scenarios[activeScenarioName].timer;
    if (!timer) return;

    if (timer.isPaused) {
      // Resume
      timer.isPaused = false;
      timer.timeoutId = setTimeout(executeSteps, timer.remainingTime);
      timer.targetTime = Date.now() + timer.remainingTime;
    } else {
      // Pause
      timer.isPaused = true;
      clearTimeout(timer.timeoutId);
      timer.remainingTime = timer.targetTime - Date.now();
    }
    saveScenarios();
    updateTimerUI();
  }

  function cancelTimer() {
    let timer = scenarios[activeScenarioName].timer;
    if (timer && timer.timeoutId) clearTimeout(timer.timeoutId);
    scenarios[activeScenarioName].timer = null;
    saveScenarios();
    updateTimerUI();
  }

  function updateTimerUI() {
    if (countdownIntervalId) clearInterval(countdownIntervalId);

    const timer = activeScenarioName
      ? scenarios[activeScenarioName].timer
      : null;
    const statusEl = document.getElementById("ac-timer-status");
    const pauseBtn = document.getElementById("ac-pause-resume-btn");
    const cancelBtn = document.getElementById("ac-cancel-timer-btn");

    if (!timer) {
      statusEl.textContent = "未设置";
      statusEl.classList.remove("paused");
      pauseBtn.disabled = true;
      cancelBtn.disabled = true;
      return;
    }

    pauseBtn.disabled = false;
    cancelBtn.disabled = false;

    if (timer.isPaused) {
      statusEl.textContent = "任务已暂停";
      statusEl.classList.add("paused");
      pauseBtn.textContent = "恢复";
    } else {
      pauseBtn.textContent = "暂停";
      statusEl.classList.remove("paused");

      const update = () => {
        const remaining = timer.targetTime - Date.now();
        if (remaining <= 0) {
          statusEl.textContent = "时间到!";
          clearInterval(countdownIntervalId);
          // Automatically clear timer object after execution
          setTimeout(() => {
            if (
              scenarios[activeScenarioName]?.timer?.targetTime ===
              timer.targetTime
            ) {
              scenarios[activeScenarioName].timer = null;
              saveScenarios();
              updateTimerUI();
            }
          }, 500);
        } else {
          statusEl.textContent = `将在 ${formatTime(remaining)} 后执行`;
        }
      };
      countdownIntervalId = setInterval(update, 1000);
      update();
    }
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
  }

  function initCollapsibleSections() {
      const states = GM_getValue('collapsibleStates', {}); // Default to empty object

      document.querySelectorAll(`#${SCRIPT_ID}-panel .ac-collapsible-header`).forEach(header => {
          const section = header.closest('.ac-section');
          const sectionKey = header.dataset.sectionKey;

          // Apply saved state
          if (states[sectionKey] === true) {
              section.classList.add('collapsed');
          }

          // Add click listener
          header.addEventListener('click', (e) => {
              if (e.target.closest('button, a, input')) {
                  return;
              }
              e.preventDefault();
              section.classList.toggle('collapsed');
              
              // Save state
              const isCollapsed = section.classList.contains('collapsed');
              const currentStates = GM_getValue('collapsibleStates', {});
              currentStates[sectionKey] = isCollapsed;
              GM_setValue('collapsibleStates', currentStates);
          });
      });
  }
})();
