!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=8)}([function(e,t){e.exports=require("path")},function(e,t){e.exports=require("fs")},function(e,t,r){"use strict";var n;try{n=r(5)}catch(e){n=null}var o=r(6);function i(){return s("app")}function a(){var e=i();return e?"name"in e?e.name:e.getName():null}function s(e){return n?n[e]?n[e]:n.remote?n.remote[e]:null:null}function c(){return"browser"===process.type&&n&&n.ipcMain?n.ipcMain:"renderer"===process.type&&n&&n.ipcRenderer?n.ipcRenderer:null}function u(){var e=i();return e?"version"in e?e.version:e.getVersion():null}function l(){var e=o.type().replace("_"," "),t=o.release();return"Darwin"===e&&(e="macOS",t="10."+(Number(o.release().split(".")[0])-4)),e+" "+t}e.exports={getName:a,getPath:function(e){var t=i();if(!t)return null;try{return t.getPath(e)}catch(e){return null}},getVersion:u,getVersions:function(){return{app:a()+" "+u(),electron:"Electron "+process.versions.electron,os:l()}},isDev:function(){var e=i();return!!e&&(!e.isPackaged||"1"===process.env.ELECTRON_IS_DEV)},isElectron:function(){return"browser"===process.type||"renderer"===process.type},isIpcChannelListened:function(e){var t=c();return!!t&&t.listenerCount(e)>0},loadRemoteModule:function(e){if("browser"===process.type)i().on("web-contents-created",(function(t,r){var n=r.executeJavaScript('try {require("'+e+'")} catch(e){}; void 0;');n&&"function"==typeof n.catch&&n.catch((function(){}))}));else if("renderer"===process.type)try{(function(){if(n&&n.remote)return n.remote;return null})().require(e)}catch(e){}},onIpc:function(e,t){var r=c();r&&r.on(e,t)},openUrl:function(e,t){t=t||console.error;var r=s("shell");if(!r)return;r.openExternal(e).catch(t)},sendIpc:function(e,t){"browser"===process.type?function(e,t){if(!n||!n.BrowserWindow)return;n.BrowserWindow.getAllWindows().forEach((function(r){r.webContents&&r.webContents.send(e,t)}))}(e,t):"renderer"===process.type&&function(e,t){var r=c();r&&r.send(e,t)}(e,t)},showErrorBox:function(e,t){var r=s("dialog");if(!r)return;r.showErrorBox(e,t)}}},function(e,t,r){"use strict";function n(e,t,r){for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&o(e[n],t,r)}function o(e,t,r){"function"==typeof e&&!1!==e.level&&i(r.levels,e.level,t.level)&&(t=function(e,t,r){if(!e||!e.length)return r;for(var n=0;n<e.length&&(r=e[n](r,t));n++);return r}(r.hooks,e,t))&&e(t)}function i(e,t,r){var n=e.indexOf(t),o=e.indexOf(r);return-1===o||-1===n||o<=n}e.exports={compareLevels:i,log:function(e,t){var r=e.transports,o={data:Array.prototype.slice.call(arguments,2),date:new Date,level:t.level,scope:t.scope?t.scope.toJSON():null,variables:e.variables};n(r,o,e)},runTransport:o,runTransports:n}},function(e,t,r){"use strict";var n=r(15),o=r(16),i=r(17);function a(e,t,r){return t.reduce((function(t,r){return"function"==typeof r?r(t,e):t}),r||e.data)}e.exports={applyAnsiStyles:o.applyAnsiStyles,concatFirstStringElements:i.concatFirstStringElements,customFormatterFactory:function(e,t,r){if("string"==typeof e)return function(n,o){return a(o,[i.templateVariables,i.templateScopeFactory(r),i.templateDate,i.templateText,t&&i.concatFirstStringElements],[e].concat(n))};if("function"==typeof e)return function(t,r){var n=Object.assign({},r,{data:t}),o=e(n,t);return[].concat(o)};return function(e){return[].concat(e)}},maxDepthFactory:n.maxDepthFactory,removeStyles:o.removeStyles,toJSON:n.toJSON,toStringFactory:n.toStringFactory,transform:a}},function(e,t){e.exports=require("electron")},function(e,t){e.exports=require("os")},function(e,t){e.exports=require("util")},function(e,t,r){(function(e){var t=r(5),n=r(9),o=r(1),i=r(10);i.info("Hello, log"),i.warn("Some problem appears");var a,s=t.app,c=t.BrowserWindow,u=r(0);function l(){process.env.ELECTRON_DISABLE_SECURITY_WARNINGS="true",a=new c({width:1300,height:900,webPreferences:{nodeIntegration:!0}}),i.info("crating window"),n?a.loadURL("http://localhost:4000"):(i.info(e,u.join(s.getAppPath(),"dist/index.html"),s.getAppPath()),o.readdir(s.getAppPath(),(function(e,t){e||t.forEach((function(e){i.info(e)}))})),a.loadURL("file://".concat(u.join(s.getAppPath(),"dist/index.html")))),a.webContents.openDevTools(),a.on("closed",(function(){a=null}))}s.on("ready",l),s.on("window-all-closed",(function(){"darwin"!==process.platform&&s.quit()})),s.on("activate",(function(){null===a&&l()}))}).call(this,"electron")},function(e,t,r){"use strict";const n=r(5);if("string"==typeof n)throw new TypeError("Not running in an Electron environment!");const o=n.app||n.remote.app,i="ELECTRON_IS_DEV"in process.env,a=1===parseInt(process.env.ELECTRON_IS_DEV,10);e.exports=i?a:!o.isPackaged},function(e,t,r){"use strict";var n=r(11),o=r(2),i=r(3).log,a=r(13),s=r(14),c=r(18),u=r(23),l=r(24);e.exports=function e(t){var r={catchErrors:function(e){var t=Object.assign({},{log:r.error,showDialog:"browser"===process.type},e||{});n(t)},create:e,functions:{},hooks:[],isDev:o.isDev(),levels:[],logId:t,variables:{processType:process.type}};return r.scope=a(r),r.transports={console:s(r),file:c(r),remote:l(r),ipc:u(r)},Object.defineProperty(r.levels,"add",{enumerable:!1,value:function(e,t){t=void 0===t?r.levels.length:t,r.levels.splice(t,0,e),r[e]=i.bind(null,r,{level:e}),r.functions[e]=r[e]}}),["error","warn","info","verbose","debug","silly"].forEach((function(e){r.levels.add(e)})),r.log=i.bind(null,r,{level:"info"}),r.functions.log=r.log,r}("default"),e.exports.default=e.exports},function(e,t,r){"use strict";var n=r(2),o=r(12),i=!1;e.exports=function(e){return i||(i=!0,"renderer"===process.type?(window.addEventListener("error",a),window.addEventListener("unhandledrejection",s)):(process.on("uncaughtException",t),process.on("unhandledRejection",r))),{stop:c};function t(t){try{if("function"==typeof e.onError){var r=n.getVersions();if(!1===e.onError(t,r,u))return}if(e.log(t),e.showDialog&&t.name.indexOf("UnhandledRejection")<0){var o=process.type||"main";n.showErrorBox("A JavaScript error occurred in the "+o+" process",t.stack)}}catch(e){console.error(t)}}function r(e){if(e instanceof Error){var r="UnhandledRejection "+e.name,n=Object.getPrototypeOf(e),o=Object.getOwnPropertyDescriptor(n,"name");return o&&o.writable||(e=new Error(e.message)),e.name=r,void t(e)}var i=new Error(JSON.stringify(e));i.name="UnhandledRejection",t(i)}function a(e){e.preventDefault(),t(e.error)}function s(e){e.preventDefault(),r(e.reason)}function c(){i=!1,"renderer"===process.type?(window.removeEventListener("error",a),window.removeEventListener("unhandledrejection",s)):(process.removeListener("uncaughtException",t),process.removeListener("unhandledRejection",r))}function u(t,r){var i=t+"?"+o.stringify(r);n.openUrl(i,e.log)}}},function(e,t){e.exports=require("querystring")},function(e,t,r){"use strict";var n=r(3).log;e.exports=function(e){return t.labelPadding=!0,t.defaultLabel="",t.maxLabelLength=0,t.getOptions=function(){return{defaultLabel:t.defaultLabel,labelLength:r()}},t;function t(r){var o={label:r,toJSON:function(){return{label:this.label}}};return e.levels.forEach((function(t){o[t]=n.bind(null,e,{level:t,scope:o})})),o.log=o.info,t.maxLabelLength=Math.max(t.maxLabelLength,r.length),o}function r(){return!0===t.labelPadding?t.maxLabelLength:!1===t.labelPadding?0:"number"==typeof t.labelPadding?t.labelPadding:0}}},function(e,t,r){"use strict";var n=r(4),o={context:console,error:console.error,warn:console.warn,info:console.info,verbose:console.verbose,debug:console.debug,silly:console.silly,log:console.log};e.exports=function(e){return t.level="silly",t.useStyles=process.env.FORCE_STYLES,t.format=i[process.type]||i.browser,t;function t(r){var n,i,c,u=e.scope.getOptions();n="renderer"===process.type||"worker"===process.type?a(r,t,u):s(r,t,u),i=r.level,c=n,o[i]?o[i].apply(o.context,c):o.log.apply(o.context,c)}},e.exports.transformRenderer=a,e.exports.transformMain=s;var i={browser:"%c{h}:{i}:{s}.{ms}{scope}%c "+("win32"===process.platform?">":"›")+" {text}",renderer:"{h}:{i}:{s}.{ms}{scope} › {text}",worker:"{h}:{i}:{s}.{ms}{scope} › {text}"};function a(e,t,r){return n.transform(e,[n.customFormatterFactory(t.format,!0,r)])}function s(e,t,r){var o,a=function(e,t){if(!0===e||!1===e)return e;var r="error"===t||"warn"===t?process.stderr:process.stdout;return r&&r.isTTY}(t.useStyles,e.level);return n.transform(e,[(o=t.format,function(e,t){return o!==i.browser?e:["color:"+c(t.level),"color:unset"].concat(e)}),n.customFormatterFactory(t.format,!1,r),a?n.applyAnsiStyles:n.removeStyles,n.concatFirstStringElements,n.maxDepthFactory(4),n.toJSON])}function c(e){switch(e){case"error":return"red";case"warn":return"yellow";case"info":return"cyan";default:return"unset"}}},function(e,t,r){"use strict";var n=r(7);function o(){var e=function(){if("undefined"!=typeof WeakSet)return new WeakSet;var e=[];return this.add=function(t){e.push(t)},this.has=function(t){return-1!==e.indexOf(t)},this}();return function(t,r){if("object"==typeof r&&null!==r){if(e.has(r))return;e.add(r)}return i(t,r)}}function i(e,t){return t instanceof Error?t.stack:t?"function"==typeof t.toJSON?t.toJSON():"function"==typeof t?"[function] "+t.toString():t:t}e.exports={maxDepthFactory:function(e){return e=e||6,function(t){return function e(t,r){if(!t)return t;if(r<1)return t.map?"[array]":"object"==typeof t?"[object]":t;if("function"==typeof t.map)return t.map((function(t){return e(t,r-1)}));if("object"!=typeof t)return t;if(t&&"function"==typeof t.toISOString)return t;if(null===t)return null;if(t instanceof Error)return t;var n={};for(var o in t)Object.prototype.hasOwnProperty.call(t,o)&&(n[o]=e(t[o],r-1));return n}(t,e)}},serialize:i,toJSON:function(e){return JSON.parse(JSON.stringify(e,o()))},toStringFactory:function(e){return e=e||5,function(t){var r=t.map((function(e){if(void 0!==e)return JSON.parse(JSON.stringify(e,o(),"  "))}));return n.formatWithOptions?(r.unshift({depth:e}),n.formatWithOptions.apply(n,r)):n.format.apply(n,r)}}}},function(e,t,r){"use strict";e.exports={applyAnsiStyles:function(e){return a(e,o,i)},removeStyles:function(e){return a(e,(function(){return""}))},transformStyles:a};var n={unset:"[0m",black:"[30m",red:"[31m",green:"[32m",yellow:"[33m",blue:"[34m",magenta:"[35m",cyan:"[36m",white:"[37m"};function o(e){var t=e.replace(/color:\s*(\w+).*/,"$1").toLowerCase();return n[t]||""}function i(e){return e+n.unset}function a(e,t,r){var n={};return e.reduce((function(e,o,i,a){if(n[i])return e;if("string"==typeof o){var s=i,c=!1;o=o.replace(/%[1cdfiOos]/g,(function(e){if(s+=1,"%c"!==e)return e;var r=a[s];return"string"==typeof r?(n[s]=!0,c=!0,t(r,o)):e})),c&&r&&(o=r(o))}return e.push(o),e}),[])}},function(e,t,r){"use strict";function n(e,t){return e.replace("{y}",String(t.getFullYear())).replace("{m}",i(t.getMonth()+1)).replace("{d}",i(t.getDate())).replace("{h}",i(t.getHours())).replace("{i}",i(t.getMinutes())).replace("{s}",i(t.getSeconds())).replace("{ms}",i(t.getMilliseconds(),3)).replace("{z}",o(t.getTimezoneOffset())).replace("{iso}",t.toISOString())}function o(e){var t=Math.abs(e);return(e>=0?"-":"+")+i(Math.floor(t/60))+":"+i(t%60)}function i(e,t){return t=t||2,(new Array(t+1).join("0")+e).substr(-t,t)}function a(e,t){return t=Math.max(t,e.length),(e+Array(t+1).join(" ")).substring(0,t)}e.exports={concatFirstStringElements:function(e){if("string"!=typeof e[0]||"string"!=typeof e[1])return e;if(e[0].match(/%[1cdfiOos]/))return e;return e[1]=e[0]+" "+e[1],e.shift(),e},formatDate:n,formatTimeZone:o,pad:i,padString:a,templateDate:function(e,t){var r=e[0];if("string"!=typeof r)return e;return e[0]=n(r,t.date),e},templateVariables:function(e,t){var r=e[0],n=t.variables;if("string"!=typeof r||!t.variables)return e;for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(r=r.replace("{"+o+"}",n[o]));return r=r.replace("{level}",t.level),e[0]=r,e},templateScopeFactory:function(e){var t=(e=e||{}).labelLength||0;return function(r,n){var o,i=r[0],s=n.scope&&n.scope.label;return s||(s=e.defaultLabel),o=""===s?t>0?a("",t+3):"":"string"==typeof s?a(" ("+s+")",t+3):"",r[0]=i.replace("{scope}",o),r}},templateText:function(e){var t=e[0];if("string"!=typeof t)return e;if(t.lastIndexOf("{text}")===t.length-6)return e[0]=t.replace(/\s?{text}/,""),""===e[0]&&e.shift(),e;var r=t.split("{text}"),n=[];""!==r[0]&&n.push(r[0]);n=n.concat(e.slice(1)),""!==r[1]&&n.push(r[1]);return n}}},function(e,t,r){"use strict";var n=r(1),o=r(0),i=r(7),a=r(4),s=r(19).FileRegistry,c=r(21);e.exports=function(e,t){var r=c.getPathVariables(process.platform),s=t||u;s.listenerCount("error")<1&&s.on("error",(function(e,t){p("Can't write to "+t,e)}));return l.archiveLog=function(e){var t=e.toString(),r=o.parse(t);try{n.renameSync(t,o.join(r.dir,r.name+".old"+r.ext))}catch(t){p("Could not rotate log",t);var i=Math.round(l.maxSize/4);e.crop(Math.min(i,262144))}},l.depth=5,l.fileName=function(){switch(process.type){case"renderer":return"renderer.log";case"worker":return"worker.log";default:return"main.log"}}(),l.format="[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}",l.getFile=f,l.level="silly",l.maxSize=1048576,l.resolvePath=function(e){return o.join(e.libraryDefaultDir,e.fileName)},l.sync=!0,l.writeOptions={flag:"a",mode:438,encoding:"utf8"},function(){var e=" is deprecated and will be removed in v5.",t=" property"+e;function r(){return f().path}Object.defineProperties(l,{bytesWritten:{get:i.deprecate((function(){return f().bytesWritten}),"bytesWritten"+t)},file:{get:i.deprecate(r,"file"+t),set:i.deprecate((function(e){l.resolvePath=function(){return e}}),"file"+t)},fileSize:{get:i.deprecate((function(){return f().size}),"file"+t)}}),l.clear=i.deprecate((function(){f().clear()}),"clear()"+e),l.findLogPath=i.deprecate(r,"findLogPath()"+e),l.init=i.deprecate((function(){}),"init()"+e)}(),l;function l(t){var r=f(t);l.maxSize>0&&r.size>l.maxSize&&(l.archiveLog(r),r.reset());var n=e.scope.getOptions(),o=a.transform(t,[a.removeStyles,a.customFormatterFactory(l.format,!1,n),a.concatFirstStringElements,a.toStringFactory(l.depth)]);r.writeLine(o)}function p(t,r){var n=["electron-log.transports.file: "+t];r&&n.push(r),e.transports.console({data:n,date:new Date,level:"warn"})}function f(e){var t=Object.assign({},r,{fileName:l.fileName}),n=l.resolvePath(t,e);return s.provide(n,l.writeOptions,!l.sync)}};var u=new s},function(e,t,r){"use strict";var n=r(20),o=r(1),i=r(6),a=r(0),s=r(7);function c(e,t,r){n.call(this),this.path=e,this.initialSize=void 0,this.bytesWritten=0,this.writeAsync=Boolean(r),this.asyncWriteQueue=[],this.writeOptions=t||{flag:"a",mode:438,encoding:"utf8"},Object.defineProperty(this,"size",{get:this.getSize.bind(this)})}function u(e){c.call(this,e)}function l(){n.call(this),this.store={},this.emitError=this.emitError.bind(this)}e.exports={File:c,FileRegistry:l,NullFile:u},s.inherits(c,n),c.prototype.clear=function(){try{return o.writeFileSync(this.path,"",{mode:this.writeOptions.mode,flag:"w"}),this.reset(),!0}catch(e){return"ENOENT"===e.code||(this.emit("error",e,this),!1)}},c.prototype.crop=function(e){try{var t=(r=this.path,n=e||4096,a=Buffer.alloc(n),s=o.statSync(r),c=Math.min(s.size,n),u=Math.max(0,s.size-n),l=o.openSync(r,"r"),p=o.readSync(l,a,0,c,u),o.closeSync(l),a.toString("utf8",0,p));this.clear(),this.writeLine("[log cropped]"+i.EOL+t)}catch(e){this.emit("error",new Error("Couldn't crop file "+this.path+". "+e.message),this)}var r,n,a,s,c,u,l,p},c.prototype.toString=function(){return this.path},c.prototype.reset=function(){this.initialSize=void 0,this.bytesWritten=0},c.prototype.writeLine=function(e){if(e+=i.EOL,this.writeAsync)return this.asyncWriteQueue.push(e),void this.nextAsyncWrite();try{o.writeFileSync(this.path,e,this.writeOptions),this.increaseBytesWrittenCounter(e)}catch(e){this.emit("error",new Error("Couldn't write to "+this.path+". "+e.message),this)}},c.prototype.getSize=function(){if(void 0===this.initialSize)try{var e=o.statSync(this.path);this.initialSize=e.size}catch(e){this.initialSize=0}return this.initialSize+this.bytesWritten},c.prototype.isNull=function(){return!1},c.prototype.increaseBytesWrittenCounter=function(e){this.bytesWritten+=Buffer.byteLength(e,this.writeOptions.encoding)},c.prototype.nextAsyncWrite=function(){var e=this;if(!(this.asyncWriteQueue.length<1)){var t=this.asyncWriteQueue.shift();o.writeFile(this.path,t,this.writeOptions,(function(r){r?e.emit("error",new Error("Couldn't write to "+e.path+". "+r.message),this):e.increaseBytesWrittenCounter(t),e.nextAsyncWrite()}))}},s.inherits(u,c),u.prototype.clear=function(){},u.prototype.crop=function(){},u.prototype.writeLine=function(){},u.prototype.getSize=function(){return 0},u.prototype.isNull=function(){return!0},s.inherits(l,n),l.prototype.provide=function(e,t,r){var n;try{if(e=a.resolve(e),this.store[e])return this.store[e];n=this.createFile(e,t,Boolean(r))}catch(t){n=new u(e),this.emitError(t,n)}return n.on("error",this.emitError),this.store[e]=n,n},l.prototype.createFile=function(e,t,r){return this.testFileWriting(e),new c(e,t,r)},l.prototype.emitError=function(e,t){this.emit("error",e,t)},l.prototype.testFileWriting=function(e){!function e(t){if(function(e){if(!process.versions)return!1;return Number(process.version.match(/^v(\d+\.\d+)/)[1].replace(/\.(\d)$/,".0$1"))>=e}(10.12))return o.mkdirSync(t,{recursive:!0}),!0;try{return o.mkdirSync(t),!0}catch(r){if("ENOENT"===r.code)return e(a.dirname(t))&&e(t);try{if(o.statSync(t).isDirectory())return!0;throw r}catch(e){throw e}}}(a.dirname(e)),o.writeFileSync(e,"",{flag:"a"})}},function(e,t){e.exports=require("events")},function(e,t,r){"use strict";var n=r(6),o=r(0),i=r(2),a=r(22);function s(e){var t=i.getPath("appData");if(t)return t;var r=c();switch(e){case"darwin":return o.join(r,"Library/Application Support");case"win32":return process.env.APPDATA||o.join(r,"AppData/Roaming");default:return process.env.XDG_CONFIG_HOME||o.join(r,".config")}}function c(){return n.homedir?n.homedir():process.env.HOME}function u(e,t){return"darwin"===e?o.join(c(),"Library/Logs",t):o.join(f(e,t),"logs")}function l(e){return"darwin"===e?o.join(c(),"Library/Logs","{appName}"):o.join(s(e),"{appName}","logs")}function p(){var e=i.getName()||"",t=i.getVersion();if("electron"===e.toLowerCase()&&(e="",t=""),e&&t)return{name:e,version:t};var r=a.readPackageJson();return e||(e=r.name),t||(t=r.version),{name:e,version:t}}function f(e,t){return i.getName()!==t?o.join(s(e),t):i.getPath("userData")||o.join(s(e),t)}e.exports={getAppData:s,getLibraryDefaultDir:u,getLibraryTemplate:l,getNameAndVersion:p,getPathVariables:function(e){var t=p(),r=t.name,o=t.version;return{appData:s(e),appName:r,appVersion:o,electronDefaultDir:i.getPath("logs"),home:c(),libraryDefaultDir:u(e,r),libraryTemplate:l(e),temp:i.getPath("temp")||n.tmpdir(),userData:f(e,r)}},getUserData:f}},function(e,t,r){"use strict";var n=r(1),o=r(0);function i(e){try{var t=a("package.json",e=o.join.apply(o,arguments));if(!t)return null;var r=JSON.parse(n.readFileSync(t,"utf8")),i=r.productName||r.name;if(!i||"electron"===i.toLowerCase())return null;if(r.productName||r.name)return{name:i,version:r.version}}catch(e){return null}}function a(e,t){for(var r=t;;){var i=o.parse(r),a=i.root,s=i.dir;if(n.existsSync(o.join(r,e)))return o.resolve(o.join(r,e));if(r===a)return null;r=s}}e.exports={readPackageJson:function(){return i(r.c[r.s]&&r.c[r.s].filename)||i(process.resourcesPath,"app.asar")||i(process.cwd())||{name:null,version:null}},tryReadJsonAt:i}},function(e,t,r){"use strict";var n=r(4),o=r(2),i=r(3);e.exports=function(e){if(t.eventId="__ELECTRON_LOG_IPC_"+e.logId+"__",t.level=!!e.isDev&&"silly",o.isIpcChannelListened(t.eventId))return function(){};return o.onIpc(t.eventId,(function(t,r){r.date=new Date(r.date),i.runTransport(e.transports.console,r,e)})),o.loadRemoteModule("electron-log"),o.isElectron()?t:null;function t(e){var r=Object.assign({},e,{data:n.transform(e,[n.toJSON,n.maxDepthFactory(3)])});o.sendIpc(t.eventId,r)}}},function(e,t,r){"use strict";var n=r(25),o=r(26),i=r(27),a=r(3),s=r(4);e.exports=function(e){return t.client={name:"electron-application"},t.depth=6,t.level=!1,t.requestOptions={},t.url=null,t.transformBody=function(e){return JSON.stringify(e)},t;function t(r){if(t.url){var c=t.transformBody({client:t.client,data:s.transform(r,[s.removeStyles,s.toJSON,s.maxDepthFactory(t.depth+1)]),date:r.date.getTime(),level:r.level,variables:r.variables});(function(e,t,r){var a=i.parse(e),s="https:"===a.protocol?o:n,c={hostname:a.hostname,port:a.port,path:a.path,method:"POST",headers:{"Content-Length":r.length,"Content-Type":"application/json"}};Object.assign(c,t);var u=s.request(c);return u.write(r),u.end(),u})(t.url,t.requestOptions,c).on("error",(function(r){var n={data:["electron-log.transports.remote: cannot send HTTP request to "+t.url,r],date:new Date,level:"warn"},o=[e.transports.console,e.transports.ipc,e.transports.file];a.runTransports(o,n,e)}))}}}},function(e,t){e.exports=require("http")},function(e,t){e.exports=require("https")},function(e,t){e.exports=require("url")}]);
//# sourceMappingURL=main.js.map