cordova.define('cordova/plugin_list', function(require, exports, module) {
   var agent = navigator.userAgent;
module.exports = [
  {
    "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
    "id": "org.apache.cordova.inappbrowser.inappbrowser",
    "clobbers": [
    	//preserve original window.open for browser
        (agent.match(/iPad|Android/i)? "window.open": "")
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "org.apache.cordova.inappbrowser": "0.5.4-dev"
}
// BOTTOM OF METADATA
});