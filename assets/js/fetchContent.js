var siteConfiguration = {
    title: "lebestnoob"
}

var Utils = {
    // Source - https://stackoverflow.com/a/67349803
    // Posted by dVVIIb, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-07-25, License - CC BY-SA 4.0
    getSize: function(size) {
        var l = document.createElement('div');
        l.style.visibility = 'hidden';
        l.style.boxSize = 'content-box';
        l.style.position = 'absolute';
        l.style.maxHeight = 'none';
        l.style.height = size;
        document.body.appendChild(l);
        size = l.clientHeight;
        l.parentNode.removeChild(l);
        return size;
    },

    // Source - https://stackoverflow.com/a/15983064
    // Posted by weroro, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-08-06, License - CC BY-SA 3.0
    isIE: function(){
        if(navigator.userAgent.indexOf("MSIE") == -1)
            return 12;

        if("documentMode" in document)
            return document.documentMode; 
        
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    }
}

window.onload = function() { 
    loadTemplate();
}

function loadTemplate() {
    fetchContent("/templates/assembly.json", function(content) {
        var templatesList;            
        try {
            templatesList = JSON.parse(content);
        } catch(e) {
            try {
                templatesList = (new Function("return " + content))();
            } catch(e) {
                templatesList = eval('(' + content + ')');
            }
        }

        var keys = [];
        for (var k in templatesList) {
            if (templatesList.hasOwnProperty(k))
                keys[keys.length] = k;
        }
        var remaining = keys.length;

        for (var l = 0; l < keys.length; l++) {   
            (function(currentKey) {
                fetchContent("/templates/" + currentKey, function(result) {
        
                    doTemplating(templatesList[currentKey], result)

                    remaining--;

                    if(remaining == 0) {
                        Router.init();  
                        return;
                    }
                });
            })(keys[l]);
        }
    });
}

function doTemplating(currentKey, result){
    var html = document.getElementById ? document.getElementById(currentKey.id) : document.all[currentKey.id];
    if (!html) 
        return alert("Element " + currentKey.id + " doesn't exit!");

    if (currentKey.append) {
        if (html.insertAdjacentHTML)
            html.insertAdjacentHTML("beforeend", result);
        else 
            html.innerHTML += result;
    } else {
        html.innerHTML = result;
        var scripts = html.getElementsByTagName("script");
        for(var j=0; j<scripts.length; j++) {
            eval(scripts[j].text)
        }
    }
}

function fetchContent(url, callback) {
    var req;
    
    try {
        req = new XMLHttpRequest();
    } catch(e) {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e1) {
            try {
                req = new ActiveXObject('Microsoft.XMLHTTP');
            } catch(e2) {
                return alert("XHR is not supported on your browser.");
            }
        }
    }

    req.open('GET', url, true);
    
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200)
                callback(req.responseText);
            else if (req.status === 404)
                window.location.href = "/404.html" + window.location.hash
        }
    }
    
    req.send();
}

function loadContent() {
    var path = window.location.pathname != "/" ? "404.html" : window.location.hash.substring(1, window.location.hash.length);
    var main = document.getElementById ? document.getElementById("main") : document.all["main"];

    if (window.loading)
        clearTimeout(window.loading);
    
    fetchContent("/pages/" + path, function(pageResult) {
        var result = pageResult;
        if (path.endsWith(".md"))
            result = mdtoHTML(pageResult)
    
        main.innerHTML = result;
        
        document.title = (main.getElementsByTagName("h1")[0].innerText || main.getElementsByTagName("h1")[0].textContent) || siteConfiguration.title;
        
        if (main.getElementsByTagName("p")[0]) {
            var metaElm  = document.createElement("meta");
            metaElm.name = "description";
            metaElm.content = main.getElementsByTagName("p")[0].innerText || main.getElementsByTagName("p")[0].textContent;
            
            var head = document.getElementById ? document.getElementById("head") : document.all["head"];
            head.appendChild(metaElm);
        }
        
        var scripts = main.getElementsByTagName("script");
        for(var i=0; i<scripts.length; i++) {
            eval(scripts[i].text)
        }
        
        document.title = document.title != siteConfiguration.title ? document.title + " - " + siteConfiguration.title : document.title;
        Animator(main).fadeIn({delay: 7});
    })

}


var Router = {
    updateHeader: function (currentHash) {
        var headerElm = document.getElementById ? document.getElementById("header") : document.all["header"];
        var headerHrefs = headerElm.children || headerElm.childNodes;

        var navcurrentHash = "/" + currentHash;
    
        if(window.location.pathname == "/") {
            for(var k=0; k<headerHrefs.length; k++) {
                if(headerHrefs[k].tagName == "A") {
                    if (headerHrefs[k].href.endsWith(navcurrentHash)) {
                        headerHrefs[k].style.textDecoration = "underline";
                    } else {
                        headerHrefs[k].style.textDecoration = "none";
                    }
                    if(headerHrefs[k].href.endsWith("#blog.html") && currentHash.startsWith("#posts")){
                        headerHrefs[k].style.textDecoration = "underline";
                    }
                }
            }
        }
    }, 

    updateHash: function () {
        var currentHash = window.location.hash || "#";
        this.updateHeader(currentHash);
    },

    changeRoute: function() {
        loadContent();
        this.updateHash();
    },

    init: function(){
        var self = this;
        self.changeRoute();

        if ("onhashchange" in window) 
            window.onhashchange = function() {
                self.changeRoute();
            }
        else {
            var lastHash = window.location.hash;
            setInterval(function() {
                if (window.location.hash != lastHash) {
                    lastHash = window.location.hash;
                    self.changeRoute();
                }
            }, 100);
        }
    }
}

function mdtoHTML(str) {
    // Regex from https://gist.github.com/elfefe/ef08e583e276e7617cd316ba2382fc40
    var headerRegex = /^(#{1,6})\s+(.+)$/gm;
    var boldRegex = /\*\*(.+?)\*\*|__(.+?)__/gm;
    var italicRegex = /\*(.+?)\*|_(.+?)_/gm;
    var strikeThroughRegex = /~~(.+?)~~/gm;
    var linkRegex = /\[(.*?)\]\((.*?)\s?(?:"(.*?)")?\)/gm;
    var imageRegex = /!\[(.*?)\]\((.*?)\s?(?:"(.*?)")?\)/gm;
    var codeBlockRegex = /^\`\`\`(?:\s*(\w+))?([\s\S]*?)^\`\`\`$/gm;
    var codeRegex = /`(.+?)`/gm;

    var blockQuoteRegex = /^>\s*(.+)$/gm; // single-level quotes only
    var unorderedListRegex = /^(\s*)[-+*]\s+(.+)$/gm;
    var orderedListRegex = /^(\s*)(\d)+\.\s+(.+)$/gm;
    
    var emphasisRegex = /\*\*\*(.+?)\*\*\*|___(.+?)___/gm;
    var paragraphRegex = /^([^#].*)|\n{2,}/g;
    var horizontalLineRegex = /\n?(?:-{3,}|\*{3,}|_{3,})\n/g;
    
    str = str.replace(emphasisRegex, function(match, p1){
        return "<em><strong>"+p1+"</strong></em>";
    })

    str = str.replace(horizontalLineRegex, function(match,p1,p2){
        return "<hr />";
    })

    str = str.replace(codeBlockRegex, function(match,p1,p2){
        return "<pre><code>" + p1 + p2 + "</code></pre>";
    })

    str = str.replace(blockQuoteRegex, function(match,p1) {
        if(match.substr(1, match.length).startsWith(">")) {
            var arr = match.split(">")
            var layer = 0
            var str = "";
            while(!arr[layer]){
                layer++;
            }
            for(var m = 0; m < layer; m++) {
               str += "<blockquote>"
            }
            
            str += "<blockquote><p>" + arr[layer] + "</p></blockquote>"

            for(var m = 0; m < layer; m++) {
                str += "</blockquote>"
            }
            
        }
        return str || "<blockquote><p>" + p1 + "</p></blockquote>";
    })

    str = str.replace(/<\/blockquote>\s<blockquote>/g, "")

    function nestedElements(target) {
        var child = (target == "ul" || target == "ol") ? "li" : "p";
        var depth = [];

        var regex;
        if (target == "ol") {
            regex = orderedListRegex;
        } else if (target == "ul") {
            regex = unorderedListRegex
        } else {
            regex = blockQuoteRegex;
        }
        
        var index = 0;
        var first = 0;
        str = str.replace(regex, function(match, p1, p2, p3) {
            
            if(target == "ol" && (match.startsWith("\n1.") || match.startsWith("1. ")))
                index++;

            depth[depth.length] = { depth: p1.length, content: typeof p3 === "string" ? p3 : p2, index:index };
            
            depth[0].depth = 0;
            var placeholder = "{REPLACEME"+target+index+"}\n";
            
            if(target == "ul" && str.indexOf(match + "\n\n"))
                index++;

            return placeholder;
        })

        for (var i = 0; i <= index; i++) {
            var currentDepth = -1;
            var ol="";
            
            // .filter();
            var currentGroup = [];
            for (var d = 0; d < depth.length; d++) {
                if (depth[d].index === i) {
                    currentGroup[currentGroup.length] = depth[d];
                }
            }
            
            for(var m = 0; m< currentGroup.length; m++){
                    while(currentDepth < currentGroup[m].depth) {
                        ol += "<"+target+">"
                        currentDepth++;
                    }

                    while(currentDepth > currentGroup[m].depth) {
                        ol += "</"+target+">"
                        currentDepth--;
                    }

                    ol += "<"+child+">" + currentGroup[m].content + "</"+child+">";
                }

            while (currentDepth >= 0){
                ol += "</"+target+">";
                currentDepth--;
            } 

            var regexp = new RegExp("{REPLACEME" + target + i + "}\n")
            var regexpg = new RegExp("{REPLACEME" + target + i + "}\n", "g")

            str = str.replace(regexp, ol);
            str = str.replace(regexpg, function (match, p1){
                return "";
            });
        }
    }

    nestedElements("ul")
    nestedElements("ol")

    var chunks = str.split(paragraphRegex);
    var processedArr = [];
    for(var l=0; l<chunks.length; l++){
        if(typeof chunks[l] == "undefined" || chunks[l] == ""){
            continue;
        }
        if(chunks[l].startsWith("#") || chunks[l].startsWith("<blockquote>") ) {
            processedArr[processedArr.length] = chunks[l];
            continue;
        }
        processedArr[processedArr.length] = "<p>" + chunks[l] + "</p>";
    }
    str = processedArr.join("\n\n");

     str = str.replace(headerRegex, function(match, p1, p2){
        return "\n<h"+p1.length+">"+p2+"</h"+p1.length+">";
    })
    
    // in line

    str = str.replace(boldRegex, function(match, p1){
        return "<strong>"+p1+"</strong>";
    })
    
    str = str.replace(italicRegex, function(match, p1){
        return "<em>"+p1+"</em>";
    })
    
    str = str.replace(strikeThroughRegex, function(match, p1){
        return "<s>"+p1+"</s>";
    })

    str = str.replace(imageRegex, function(match, p1, p2){
        return "<img src=\""+ p2 +"\" alt=\"" + p1 + "\">";
    })
    
    str = str.replace(linkRegex, function(match, p1, p2){
        return "<a href=\"" + p2 + "\">" + p1 + "</a>";
    })

    str = str.replace(codeRegex, function(match,p1,p2){
        return "<code>" + p1 + "</code>";
    })

    return str;
}

function Animator(element) {
    if(!element || (typeof element != "object" && element.nodeType !== 1))
        return alert("Animator(), Input is not an HTML Element!");

    if(!(this instanceof Animator))
        return new Animator(element);

    this.element = element;
};

Animator.prototype.fadeIn = function(arg, callback){
    // IE < 8 does not support opacity on non-image elements
     if(Utils.isIE() < 8)
        return;
   
    if (typeof arg === "function") {
        callback = arg;
        arg = {};
    }
    
    var params = {
        rate: arg && arg.rate ? arg.rate : 0.06,
        delay: arg && arg.delay ? arg.delay : 10
    }
    var element = this.element;

    element.style.opacity = 0;
    element.style.filter = 'alpha(opacity=0)';
    // Source - https://stackoverflow.com/a/6121270
    // Posted by Ibu, modified by community and lebestnoob. See post 'Timeline' for change history
    // Retrieved 2026-07-24, License - CC BY-SA 3.0
    var op = 0.01;  // initial opacity
    var timer = setInterval(function () {
        if (op >= 1){
            op = 1;
            clearInterval(timer);
            typeof callback === "function" ? callback.call(element) : null;
        }
        
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * params.rate;
    }, params.delay);
}

// callback is never reached if timeout is not specified
Animator.prototype.cycleFonts = function(arg, callback) {
    if (typeof arg === "function") {
        callback = arg;
        arg = {};
    }

    var params = {"list": arg && arg.list ? arg.list : ["Arial, Helvetica, sans-serif", "Arial Black, Gadget, sans-serif", "Comic Sans MS, cursive", "Courier New, monospace", "Georgia, serif", "Impact, Charcoal, sans-serif", "Lucida Console, Monaco, monospace", "Lucida Sans Unicode, Lucida Grande, sans-serif", "Palatino Linotype, Book Antiqua, Palatino, serif", "Tahoma, Geneva, sans-serif", "Times New Roman, Times, serif", "Trebuchet MS, sans-serif", "Verdana, Geneva, sans-serif", "Symbol, Symbol", "MS Sans Serif, Geneva, sans-serif", "MS Serif, New York, serif"], timeout: arg && arg.timeout ? arg.timeout : undefined };
    var fontFamilies = params.list;
    if (params.list instanceof Array && params.list.length > 0)
        fontFamilies = params.list;

    
    var element = this.element;
    var randomPick = Math.floor(Math.random()*fontFamilies.length);

    var originalState;
    if (typeof getComputedStyle !== "undefined")
        originalState = getComputedStyle(element).fontFamily;
    else {
        originalState = element.currentStyle["fontFamily"]
    }
    
    var currentFont = fontFamilies[randomPick];
    var change = setInterval(function(){
        var font = fontFamilies[randomPick];
        randomPick = Math.floor(Math.random()*fontFamilies.length);
        while(font == currentFont) {
            randomPick = Math.floor(Math.random()*fontFamilies.length);
            font = fontFamilies[randomPick];
        }
        currentFont = font;
        element.style.fontFamily = font;
    }, 250);

    if (params.timeout && typeof params.timeout === "number") {
        setTimeout(function(){
            clearInterval(change);
            element.style.fontFamily = originalState;
            typeof callback === "function" ? callback.call(element) : null;
        }, params.timeout);
    }
}

// callback is never reached if timeout is not specified
Animator.prototype.cycleDecorations = function(arg, callback){
    if (typeof arg === "function") {
        callback = arg;
        arg = {};
    }
    
    var params = {"list": arg && arg.list ? arg.list : ["underline", "overline", "line-through", "blink", "none"], timeout: arg && arg.timeout ? arg.timeout : undefined };
    var textDecorations = params.list;
    if (params.list instanceof Array && params.list.length > 0)
        textDecorations = params.list;
    
    var element = this.element;
    var randomPick = Math.floor(Math.random()*textDecorations.length);
    
    var originalState;
    if (typeof getComputedStyle !== "undefined")
        originalState = getComputedStyle(element).textDecoration;
    else {
        originalState = element.currentStyle["textDecoration"]
    }
    
    var change = setInterval(function(){
        randomPick = Math.floor(Math.random()*textDecorations.length);
        element.style.textDecoration = textDecorations[randomPick];
    }, 250);

    if (params.timeout && typeof params.timeout === "number") {
        setTimeout(function(){
            clearInterval(change);
            element.style.textDecoration = originalState;
            typeof callback === "function" ? callback.call(element) : null;
        }, params.timeout);
    }
}

Animator.prototype.scaleDown = function(arg, callback){
    /* 
        IE < 8 does not support opacity on non-image elements
        This is a necessary for the scaling animation to look okay
    */
    if(Utils.isIE() < 8)
        return;
    
    if (typeof arg === "function") {
        callback = arg;
        arg = {};
    }
    
    var params = {
        rate: arg && arg.rate ? arg.rate : 0.06,
        delay: arg && arg.delay ? arg.delay : 10,
        multiplier: arg && arg.multiplier ? arg.multiplier : 4
    }
    
    var element = this.element;
    var originalSize;
    if (typeof getComputedStyle !== "undefined")
        originalSize = getComputedStyle(element).fontSize;
    else {
        originalSize = element.currentStyle["fontSize"]
    }
    originalSize = Utils.getSize(originalSize);

    var size = originalSize * params.multiplier; 

    var timer = setInterval(function () {
        if (size <= originalSize){
            op = originalSize;
            clearInterval(timer);
            typeof callback === "function" ? callback.call(element) : null;
        }
        
        element.style.fontSize = size + "px";
        size -= Math.round(size * params.rate);
    }, params.delay);
}

// Polyfills
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, strtLength){
        strtLength = (strtLength === undefined || strtLength > this.length)? this.length : strtLength;  	
        return this.substr(strtLength - searchString.length, strtLength) === searchString;
  };
}