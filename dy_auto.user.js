// ==UserScript==
// @name         douyin auto scroll
// @namespace    https://github.com/June-64/monkey_shell
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.douyin.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const Toast = (message, duration) => {
        // Create the toast element
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.left = "50%";
        toast.style.transform = "translateX(-50%)";
        toast.style.backgroundColor = "black";
        toast.style.color = "white";
        toast.style.padding = "10px";
        toast.style.borderRadius = "5px";
        toast.style.zIndex = "9999";
        toast.style.textAlign = "center";
        document.body.appendChild(toast);

        // Remove the toast after the specified duration
        setTimeout(function () {
            toast.parentNode.removeChild(toast);
        }, duration);

        // Remove the toast when it's clicked
        toast.addEventListener("click", function () {
            toast.parentNode.removeChild(toast);
        });
    };
    // 记录上一次的播放进度
    var progressBefore = 0
    function getProgress() {
        const progressBtn = document.querySelector(".xgplayer-playing:not(.xgplayer-pause) .xgplayer-progress-btn");
        console.log(progressBtn);
        if (!progressBtn) {
            document.querySelector(".xgplayer-playswitch-next").click()
            return
        }
        //拿到当前播放进度
        let point = progressBtn.style.left
        point = Number.parseFloat(point.replace("%", ''))
        console.log(point, progressBefore);
        // 如果当前的播放进度小于上一次的播放进度,说明当前视频已经播放完了
        if (point < progressBefore) {
            // 播放下一个
            document.querySelector(".xgplayer-playswitch-next").click()
            progressBefore = 0
            return
        }
        // 将当前的进度保存
        progressBefore = point
    }
    setInterval(() => {
        getProgress()
    }, 1000);


    // Your code here...
})();