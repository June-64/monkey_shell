// ==UserScript==
// @name         抖音主页视频下载
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  拦截请求并下载抖音视频，显示界面选择下载
// @author       June
// @match        https://www.douyin.com/*
// @icon         https://p3-pc-weboff.byteimg.com/tos-cn-i-9r5gewecjs/logo-horizontal.svg
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    let videoList = [];
    let count=0

    // 获取当前时间作为标题
    function fileName() {
        const now = new Date();
        return `video_${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
    }

    // 插入控制面板
    function insertControlPanel() {
        const panelContainer = document.createElement("div");
        panelContainer.id = "panelContainer";
        panelContainer.style.position = "fixed";
        panelContainer.style.bottom = "10px";
        panelContainer.style.right = "10px";
        panelContainer.style.zIndex = 1000;
        panelContainer.style.maxHeight = "50vh";
        panelContainer.style.width = "300px";
        panelContainer.style.overflowY = "auto";
        panelContainer.style.backgroundColor = "white";
        panelContainer.style.border = "1px solid #ccc";
        panelContainer.style.borderRadius = "5px";
        panelContainer.style.display = "none";

        const toggleButton = document.createElement("button");
        toggleButton.innerHTML = "展开";
        toggleButton.style.margin = "10px";
        toggleButton.style.position = "fixed";
        toggleButton.style.bottom = "10px";
        toggleButton.style.right = "10px";
        toggleButton.style.zIndex = 1001;
        toggleButton.style.backgroundColor = "#007bff";
        toggleButton.style.color = "white";
        toggleButton.style.border = "none";
        toggleButton.style.borderRadius = "5px";
        toggleButton.style.padding = "10px";
        toggleButton.style.cursor = "pointer";
        toggleButton.addEventListener("click", () => {
            const panel = document.getElementById("controlPanel");
            const isHidden = panel.style.display === "none";
            panel.style.display = isHidden ? "block" : "none";
            panelContainer.style.display = isHidden ? "block" : "none";
            toggleButton.innerHTML = isHidden ? "收起" : "展开";
        });

        const panel = document.createElement("div");
        panel.id = "controlPanel";
        panel.style.display = "none";
        panel.style.padding = "10px";
        panel.style.paddingTop = "50px"; // Space for fixed buttons
        panel.style.boxSizing = "border-box";
        panel.style.overflowY = "auto";
        panel.style.maxHeight = "calc(50vh - 60px)"; // Subtract space for buttons and padding

        const buttonContainer = document.createElement("div");
        buttonContainer.style.position = "absolute";
        buttonContainer.style.top = "0";
        buttonContainer.style.right = "10px";
        buttonContainer.style.zIndex = 1001;
        buttonContainer.style.backgroundColor = "white";
        buttonContainer.style.width = "280px";
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "space-between";
        buttonContainer.style.padding = "5px";
        buttonContainer.style.borderTop = "1px solid #ccc";

        const downloadAllButton = document.createElement("button");
        downloadAllButton.innerHTML = "下载全部";
        downloadAllButton.style.flex = "1";
        downloadAllButton.style.marginRight = "5px";
        downloadAllButton.style.backgroundColor = "#28a745";
        downloadAllButton.style.color = "white";
        downloadAllButton.style.border = "none";
        downloadAllButton.style.borderRadius = "5px";
        downloadAllButton.style.padding = "10px";
        downloadAllButton.style.cursor = "pointer";
        downloadAllButton.addEventListener("click", downloadAll);

        const downloadSelectedButton = document.createElement("button");
        downloadSelectedButton.innerHTML = "下载选中";
        downloadSelectedButton.style.flex = "1";
        downloadSelectedButton.style.marginLeft = "5px";
        downloadSelectedButton.style.backgroundColor = "#ffc107";
        downloadSelectedButton.style.color = "white";
        downloadSelectedButton.style.border = "none";
        downloadSelectedButton.style.borderRadius = "5px";
        downloadSelectedButton.style.padding = "10px";
        downloadSelectedButton.style.cursor = "pointer";
        downloadSelectedButton.addEventListener("click", downloadSelected);

        buttonContainer.appendChild(downloadAllButton);
        buttonContainer.appendChild(downloadSelectedButton);

        panelContainer.appendChild(panel);
        panelContainer.appendChild(buttonContainer);
        document.body.appendChild(panelContainer);
        document.body.appendChild(toggleButton);
    }

    // 插入视频信息
    function insertVideoInfo(title, url) {
        const panel = document.getElementById("controlPanel");

        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.marginBottom = "10px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.marginRight = "10px";

        const link = document.createElement("a");
        if(!title)
            title = fileName();
        title = ++count + "_" + title;
        link.href = url;
        link.innerText = title;
        link.target = "_blank";
        link.style.flex = "1";

        container.appendChild(checkbox);
        container.appendChild(link);

        panel.appendChild(container);

        videoList.push({checkbox, title: title, url});
    }

    // 下载所有视频
    function downloadAll() {
        videoList.forEach(video => downloadVideo(video.title, video.url));
    }

    // 下载选中的视频
    function downloadSelected() {
        videoList.forEach(video => {
            if (video.checkbox.checked) {
                downloadVideo(video.title, video.url);
            }
        });
    }

    // 使用 XMLHttpRequest 下载视频
    function downloadVideo(title, url) {
        // 确保 URL 使用 HTTPS
        if (!url.startsWith('https://')) {
            url = url.replace('http://', 'https://');
        }

        console.log("下载视频", title, url);
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";
        xhr.onload = function () {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.style.display = "none";
                a.href = downloadUrl;
                a.download = title + ".mp4";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                console.log("Download completed");
            } else {
                console.error("Download error:", xhr.statusText);
            }
        };
        xhr.onerror = function () {
            console.error("Download error:", xhr.statusText);
        };
        xhr.send();
    }

    // 保存原始的 XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;

    // 创建一个新的 XMLHttpRequest
    function newXHR() {
        const xhr = new originalXHR();
        // 重写 open 方法
        const originalOpen = xhr.open;
        xhr.open = function (method, url, async, user, password) {
            this.addEventListener("readystatechange", function () {
                if (
                    this.readyState === 4 &&
                    this.status === 200 &&
                    this.responseURL.includes("/aweme/v1/web/aweme/post/")
                ) {
                    console.log("Intercepted request to:", this.responseURL);
                    let response = JSON.parse(this.responseText);
                    console.log(response, "newXHR");
                    parseAndDownload(response);
                }
            }, false);
            originalOpen.call(this, method, url, async, user, password);
        };

        return xhr;
    }

    // 解析响应并显示视频信息
    function parseAndDownload(response) {
        if (response && response.aweme_list && response.aweme_list.length > 0) {
            response.aweme_list.forEach(aweme => {
                let videoUrl = aweme.video.play_addr.url_list[0];
                let title = aweme.preview_title;
                if (videoUrl) {
                    console.log('Video URL:', title, videoUrl);
                    insertVideoInfo(title, videoUrl);
                }
            });
        }
    }

    // 插入控制面板
    window.addEventListener("load", insertControlPanel);

    // 替换全局的 XMLHttpRequest
    window.XMLHttpRequest = newXHR;
})();
