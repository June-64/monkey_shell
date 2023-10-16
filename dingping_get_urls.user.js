// ==UserScript==
// @name         dianPing get search details page urls
// @namespace    https://github.com/June-64/monkey_shell
// @version      1.3
// @description  通过搜索获取大众点评每个城市的item详情url
// @author       june
// @match        *://*.dianping.com/search/keyword/*
// @grant        dianping
// ==/UserScript==

(function () {
    "use strict";
    var btnBox = document.createElement("div");
    btnBox.style.position = "fixed";
    btnBox.style.bottom = "35px";
    btnBox.style.right = "10px";
    btnBox.style.zIndex = "9999";
  
    var button = document.createElement("button");
    button.innerHTML = "下载";
    button.style.fontSize = "16px";
    button.style.border = "1px solid black";
    button.style.backgroundColor = "white";
    btnBox.appendChild(button);
  
    var clearBtn = document.createElement("button");
    clearBtn.innerHTML = "清空";
    clearBtn.style.fontSize = "16px";
    clearBtn.style.border = "1px solid black";
    clearBtn.style.backgroundColor = "white";
    clearBtn.style.marginLeft = "10px";
    btnBox.appendChild(clearBtn);
    document.body.appendChild(btnBox);
  
    clearBtn.addEventListener("click", () => {
      localStorage.removeItem("urls");
      toast("清空成功");
    });
    button.addEventListener("click", () => {
      download();
    });
    function toast(msg) {
      var toast = document.createElement("div");
      toast.style.position = "fixed";
      toast.style.bottom = "10%";
      toast.style.right = "50%";
      toast.style.color = "#fff";
      toast.style.transform = "translate(50%, 10%)";
      toast.style.background = "rgba(0,0,0,0.7)";
      toast.style.borderRadius = "5px";
      toast.style.padding = "10px";
      toast.style.display = "none";
      toast.style.zIndex = "9999";
      toast.innerHTML = msg;
      document.body.appendChild(toast);
      toast.style.display = "block";
      setTimeout(function () {
        toast.style.display = "none";
      }, 2000);
    }
  
    var address = Number(location.href.match(/keyword\/(\d+)/)[1]);
  
    function getUrls() {
      const urls = [];
      const aList = document.querySelectorAll("li>.pic>a");
      aList.forEach((item) => urls.push(item.href));
      let urlsText = localStorage.getItem("urls") || "[]";
      urlsText = JSON.parse(urlsText);
      urlsText = urlsText.concat(urls);
      urlsText = Array.from(new Set(urlsText));
      toast("当前urls:" + String(urlsText.length));
      localStorage.setItem("urls", JSON.stringify(urlsText));
      const nextLink = document.querySelector(".next");
      // 获取3000-8000之间的随机数
      let randomNum = Math.floor(Math.random() * 5001) + 3000;
  
      let rejectText = document.querySelector("center>h1");
      if (rejectText !== null) {
        toast("当前页被拒绝");
        return;
      }
  
      if (nextLink !== null) {
        setTimeout(() => {
          nextLink.click();
        }, randomNum);
      } else {
        var url = location.href;
        if (!url.includes("keyword")) {
          return;
        }
        address += 1;
        var newUrl = url
          .replace(/keyword\/\d+/, `keyword/${address}`)
          .replace(/p\d+/, "p1");
        setTimeout(() => {
          location.href = newUrl;
        }, randomNum);
      }
    }
  
    function download() {
      const urlsText = localStorage.getItem("urls");
      // Create a download link for the JSON file
      const downloadLink = document.createElement("a");
      downloadLink.href =
        "data:text/json;charset=utf-8," + encodeURIComponent(urlsText);
      downloadLink.download = "urls.txt";
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      // Click the download link to download the JSON file
      downloadLink.click();
    }
    getUrls();
  })();
  