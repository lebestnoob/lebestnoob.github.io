window.onload = function() {
        
    fetchContent("/templates/assembly.json", function(content) {
            var templatesList;            
            try {
                templatesList = JSON.parse(content);
            } catch(e) {
                templatesList = eval('(' + content + ')');
            }

            var keys = [];
            for (var k in templatesList) {
                if (templatesList.hasOwnProperty(k)) { 
                    keys.push(k);
                 }
            }
            var remaining = keys.length;

            for (var l = 0; l < keys.length; l++) {   
                    (function(currentKey) {
                        fetchContent("/templates/" + currentKey, function(result) {
                            var html = document.getElementById(templatesList[currentKey].id);
                            
                            if (templatesList[currentKey].append) {
                                html.insertAdjacentHTML("beforeend", result);
                            } else {
                                html.innerHTML = result;
                                var scripts = html.getElementsByTagName("script");
                                for(var j=0; j<scripts.length; j++) {
                                    eval(scripts[j].text)
                                }
                            }
                            remaining--;

                            if(remaining == 0) {
                                initRouter();  
                            }
                        });
                    })(keys[l]);
            }
            
        });

}

function fetchContent(url, callback) {
    var req;
    
    try {
     req = new XMLHttpRequest();
    } catch(e) {
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch(e1) {
            req = new ActiveXObject('Microsoft.XMLHTTP');
        }
    }

    req.open('GET', url, true);
    
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
                callback(req.responseText);
            } else {
                if (req.status === 404) {
                    window.location.href = "/404.html" + window.location.hash
                }
            }
        }
    }
    
    req.send();
}

function loadContent() {
    var path = window.location.pathname != "/" ? "404.html" : window.location.hash.substring(1, window.location.hash.length);
    var main = document.getElementById("main");

    if (window.loading) {
        clearTimeout(window.loading);
    }
    
    fetchContent("/pages/" + path, function(pageResult) {
        var result = pageResult;
        if (path.endsWith(".md")) {
            result = mdtoHTML(pageResult)
        }
        
        main.innerHTML = result;
        document.title = main.getElementsByTagName("h1")[0].innerText || "lebestnoob";

        if (main.getElementsByTagName("p")[0]) {
            document.getElementById("head").insertAdjacentHTML("beforeend", "<meta name=\"description\" content=\"" + main.getElementsByTagName("p")[0].innerText + "\">");
        }
        
        var scripts = main.getElementsByTagName("script");
        for(var i=0; i<scripts.length; i++) {
            eval(scripts[i].text)
        }

        document.title = document.title != "lebestnoob" ? document.title + " - lebestnoob" : document.title;
    }

)}

function updateHeader(currentHash) {
    var headerHrefs = document.getElementById("header").children;
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
}

function updateHash() {
    var currentHash = window.location.hash || "#";
    updateHeader(currentHash);
}

function initRouter() {
        function changeRoute() {
            loadContent();
            updateHash();
        }
        changeRoute();
        if ("onhashchange" in window) {
            window.onhashchange = function() {
                changeRoute();
            };
        } else {
            setInterval(function() {
                var lastHash = window.location.hash;
                if (window.location.hash != lastHash) {
                    lastHash = window.location.hash;
                    changeRoute();
                }
            }, 100);
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

    
    var paragraphRegex = /^([^#].*)|\n{2,}/g;
    
    var final = str;
    
    final = final.replace(codeBlockRegex, function(match,p1,p2){
        return "<pre><code>" + p1 + p2 + "</code></pre>";
    })

    final = final.replace(blockQuoteRegex, function(match,p1) {
        return "<blockquote>" + p1 + "</blockquote>";
    })

    final = final.replace(unorderedListRegex, function(match, p1) {
        return "<ul><li>" + p1 + "</li></ul>";
    })
    final = final.replaceAll("</li></ul>\n<ul><li>", "</li><li>")


    final = final.replace(orderedListRegex, function(match, p1) {
        return "<ol><li>" + p1 + "</li></ol>";
    })
    final = final.replaceAll("</li></ol>\n<ol><li>", "</li><li>")

    var chunks = final.split(paragraphRegex);
    var processedArr = [];
    for(var l=0; l<chunks.length; l++){
        if(chunks[l]==undefined){
            continue;
        }
        if(chunks[l].startsWith("#") || chunks[l].startsWith("`")) {
            processedArr.push(chunks[l]);
            continue;
        }
        processedArr.push("<p>" + chunks[l] + "</p>");
    }
    final = processedArr.join("\n\n");
    
    final = final.replace(headerRegex, function(match, p1, p2){
        return "<h"+p1.length+">"+p2+"</h"+p1.length+">";
    })
    
    final = final.replace(boldRegex, function(match, p1){
        return "<b>"+p1+"</b>";
    })
    
    final = final.replace(italicRegex, function(match, p1){
        return "<i>"+p1+"</i>";
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
