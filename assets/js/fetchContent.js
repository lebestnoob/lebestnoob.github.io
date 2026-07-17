var siteConfiguration = {
    title: "lebestnoob"
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
        document.title = (main.getElementsByTagName("h1")[0].innerText || main.getElementsByTagName("p")[0].textContent) || siteConfiguration.title;

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
    }

)}


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
    var unorderedListRegex = /^\s*[-+*]\s+(.+)$/gm;
    var orderedListRegex = /^\s*\d+\.\s+(.+)$/gm;
    
    var emphasisRegex = /\*\*\*(.+?)\*\*\*|___(.+?)___/gm;
    var paragraphRegex = /^([^#].*)|\n{2,}/g;
    var horizontalLineRegex = /\n?(?:-{3,}|\*{3,}|_{3,})\n/g;
    
    var final = str;
    
    final = final.replace(emphasisRegex, function(match, p1){
        return "<em><strong>"+p1+"</strong></em>";
    })

    final = final.replace(horizontalLineRegex, function(match,p1,p2){
        return "<hr />";
    })

    final = final.replace(codeBlockRegex, function(match,p1,p2){
        return "<pre><code>" + p1 + p2 + "</code></pre>";
    })

    final = final.replace(blockQuoteRegex, function(match,p1) {
        if(match.substr(1, match.length).startsWith(">")) {
            var arr = match.split(">")
            var layer = 0
            var str = "";
            console.log(match, arr)
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

    final = final.replace(/<\/blockquote>\n<blockquote>/g, "")

    final = final.replace(unorderedListRegex, function(match, p1) {
         if(match.startsWith(" ") || match.startsWith("&#9;")) {
            var arr = match.split(" ") || match.split("&#9;");
            var layer = 0
            var str = "";
            while(!arr[layer]){
                layer++;
            }

            for(var m = 0; m < layer; m++) {
               str += "<ul>"
            }
            
            str += "<ul><li>" + p1 + "</li></ul>";
            
            for(var m = 0; m < layer; m++) {
                str += "</ul>"
            }

        }
        return str || "<ul><li>" + p1 + "</li></ul>";
    })
    final = final.replace(/<\/li><\/ul>\n<ul><li>/g, "</li><li>")

    var orderRegex;
    final = final.replace(orderedListRegex, function(match, p1) {
        if(match.startsWith(" ") || match.startsWith("&#9;")) {
            var arr = match.split(" ") || match.split("&#9;");
            var layer = 0;
            var str = "";
            var orderedFixRegex = "</li>";
            while(!arr[layer]){
                layer++;
            }

            for(var m = 0; m < layer; m++) {
               str += "<ol>"
               orderedFixRegex += "</ol>";
            }
            
            str += "<ol><li>" + p1 + "</li></ol>";
            orderedFixRegex += "\n";
            
            for(var m = 0; m < layer; m++) {
                str += "</ol>"
                orderedFixRegex += "<ol>";
            }
            orderedFixRegex += "<li>";
            orderRegex = new RegExp(orderedFixRegex, "g")
        }
        
        return str || "<ol><li>" + p1 + "</li></ol>";
    })

    final = final.replace(/<\/li><\/ol>\n<ol><ol><li>/g, "</li>\n<ol><li>")
    final = final.replace(/<\/li><\/ol><\/ol>\n<ol><li>/g, "</li></ol>\n<li>")
    final = final.replace(orderRegex, "</li><li>");

    final = final.replace(/<\/li><\/ol>\n<ol><li>/g, "</li><li>")

    final = final.replace(headerRegex, function(match, p1, p2){
        return "<h"+p1.length+">"+p2+"</h"+p1.length+">";
    })

    var chunks = final.split(paragraphRegex);
    var processedArr = [];
    for(var l=0; l<chunks.length; l++){
        if(typeof chunks[l] == "undefined" || chunks[l] == ""){
            continue;
        }
        if(chunks[l].startsWith("<h") || chunks[l].startsWith("<blockquote>") ) {
            processedArr[processedArr.length] = chunks[l];
            continue;
        }
        processedArr[processedArr.length] = "<p>" + chunks[l] + "</p>";
    }
    final = processedArr.join("\n\n");
    
    // in line

    final = final.replace(boldRegex, function(match, p1){
        return "<strong>"+p1+"</strong>";
    })
    
    final = final.replace(italicRegex, function(match, p1){
        return "<em>"+p1+"</em>";
    })
    
    final = final.replace(strikeThroughRegex, function(match, p1){
        return "<s>"+p1+"</s>";
    })

    final = final.replace(imageRegex, function(match, p1, p2){
        return "<img src=\""+ p2 +"\" alt=\"" + p1 + "\">";
    })
    
    final = final.replace(linkRegex, function(match, p1, p2){
        return "<a href=\"" + p2 + "\">" + p1 + "</a>";
    })

    final = final.replace(codeRegex, function(match,p1,p2){
        return "<code>" + p1 + "</code>";
    })

    return final;
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
