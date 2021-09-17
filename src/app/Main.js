/*
  Copyright 2017 Esri

  Licensed under the Apache License, Version 2.0 (the "License");

  you may not use this file except in compliance with the License.

  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software

  distributed under the License is distributed on an "AS IS" BASIS,

  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

  See the License for the specific language governing permissions and

  limitations under the License.​
*/

define([
  "dojo/_base/declare",
  "ApplicationBase/ApplicationBase",
  "ApplicationBase/support/itemUtils",
  "ApplicationBase/support/domHelper",
  "esri/widgets/Fullscreen"
], function (
  declare,
  ApplicationBase,
  itemUtils,
  domHelper,
  Fullscreen
) {
  return declare(null, {

    constructor: function () {
      this.CSS = {
        loading: "configurable-application--loading"
      };
      this.base = null;
    },

    clickScreenshotButton: function(view){
      view.takeScreenshot({format: "png" }).then(this.downloadImage.bind(this))
    },

    getFileName: function(){
      var filename = prompt("Enter file name", "map-screenshot.png");
      if (!filename.endsWith(".png")){
          filename += ".png"
      }
      return filename;
    },

    downloadImage: function(screenshot) {

      //Prompt for file name ...
      filename = this.getFileName();

      console.log("Download Image");
      dataUrl = screenshot.dataUrl;
      // the download is handled differently in Microsoft browsers
      // because the download attribute for <a> elements is not supported
      if (!window.navigator.msSaveOrOpenBlob) {
        // in browsers that support the download attribute
        // a link is created and a programmatic click will trigger the download
        const element = document.createElement("a");
        element.setAttribute("href", dataUrl);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        // for MS browsers convert dataUrl to Blob
        const byteString = atob(dataUrl.split(",")[1]);
        const mimeString = dataUrl
          .split(",")[0]
          .split(":")[1]
          .split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });

        // download file
        window.navigator.msSaveOrOpenBlob(blob, filename);
      }
    },

    init: function (base) {
      if (!base) {
        console.error("ApplicationBase is not defined");
        return;
      }
      domHelper.setPageLocale(base.locale);
      domHelper.setPageDirection(base.direction);

      this.base = base;
      var config = base.config,
        results = base.results;
      var find = config.find,
        marker = config.marker;
      var webMapItems = results.webMapItems;
      var validWebMapItems = webMapItems.map(function (response) {
        return response.value;
      });
      var firstItem = validWebMapItems[0];
      if (!firstItem) {
        console.error("Could not load an item to display");
        return;
      }

      var portalItem = this.base.results.applicationItem.value;
      var appProxies = (portalItem && portalItem.applicationProxies) ? portalItem.applicationProxies : null;
      var viewContainerNode = document.getElementById("viewContainer");
      var defaultViewProperties = itemUtils.getConfigViewProperties(config);

      
      var clickScreenshotButton = this.clickScreenshotButton;
      var currentContext = this;
      validWebMapItems.forEach(function (item) {

        var viewNode = document.createElement("div");
        viewContainerNode.appendChild(viewNode);

        var viewProperties = defaultViewProperties;
        viewProperties.container = viewNode;
        itemUtils.createMapFromItem({
            item: item,
            appProxies: appProxies
          })
          .then(function (map) {
            viewProperties.map = map;

            let mapView =  itemUtils.createView(viewProperties)
              .then(function (view) {
                
                // Add the screenshot button as widget to the map view
                var screenshotBtn = document.getElementById("screenshotBtn");
                view.ui.add(screenshotBtn, 'top-left');
                screenshotBtn.onclick = clickScreenshotButton.bind(currentContext, view);
                
                // Add the full-screen widget to the map view
                view.ui.add(
                  new Fullscreen({
                    view: view
                  }),
                  "top-right"
                );

                return itemUtils.findQuery(find, view)
                  .then(function () {
                    return itemUtils.goToMarker(marker, view);
                  });
              });    
              
              console.log("Application loaded ...")
          }).catch(function(err){
            console.error("Issue loading web map: ", err)
          });
      });
      document.body.classList.remove(this.CSS.loading);

    }

  });

});
