window.onload = function() {
        fetchContent("/templates/assembly.json", function(content) {
            var templatesList;            
            try {
                templatesList = JSON.parse(content);
            } catch(e) {
                templatesList = eval('(' + content + ')');
            }

            for (var key in templatesList) {   
                    (function(currentKey) {
                        fetchContent("/templates/" + currentKey, function(result) {
                
                            var html = document.getElementById(templatesList[currentKey].id);
                            if(currentKey == "main.html") {
                                loadContent();
                            } else if (templatesList[currentKey].append) {
                                html.insertAdjacentHTML("beforeend", result);
                            } else {
                                html.innerHTML = result;
                                var scripts = html.getElementsByTagName("script");
                                for(var i=0; i<scripts.length; i++) {
                                    eval(scripts[i].text)
                                }
                            }
                        });
                    })(key);
            }

        });
    
        var currentHash = window.location.hash;
        if(!currentHash) {
            currentHash = "#";
        }
        if ("onhashchange" in window) {
            window.onhashchange = function() {
                currentHash = window.location.hash;
                if(!currentHash) {
                    currentHash = "#";
                }
                loadContent();
            };
        } else {
            setInterval(function() {
                if (window.location.hash != currentHash) {
                    currentHash = window.location.hash;
                    if(!currentHash) {
                        currentHash = "#";
                    }
                    loadContent();
                }
            }, 100);
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

function loadContent(){
    var path = window.location.pathname != "/" ? "404.html" : window.location.hash.substring(1, window.location.hash.length);
    var main = document.getElementById("main");
    fetchContent("/pages/" + path, function(pageResult) {
        main.innerHTML = pageResult;
        document.title = main.getElementsByTagName("h1")[0].innerText;

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
