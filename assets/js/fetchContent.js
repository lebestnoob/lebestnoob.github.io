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
                        fetchContent("/templates/" + currentKey, function(result) {;
                            var path = window.location.pathname != "/" ? "404.html" : window.location.hash.substring(1, window.location.hash.length);
                
                            var html = document.getElementById(templatesList[currentKey].id);
                            if(currentKey == "main.html") {
                                fetchContent("/pages/" + path, function(pageResult) {
                                    html.innerHTML = pageResult;
                                    document.title = html.getElementsByTagName("h1")[0].innerText;

                                    if (html.getElementsByTagName("p")[0]) {
                                        document.getElementById("head").insertAdjacentHTML("beforeend", "<meta name=\"description\" content=\"" + html.getElementsByTagName("p")[0].innerText + "\">");
                                    }
                                    
                                    var scripts = html.getElementsByTagName("script");
                                    for(var i=0; i<scripts.length; i++) {
                                        eval(scripts[i].text)
                                    }
                                });
                            } else if (templatesList[currentKey].append) {
                                html.insertAdjacentHTML("beforeend",result);
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
        if ("onhashchange" in window) {
            window.onhashchange = function() {
                window.location.reload();
            };
        } else {
            setInterval(function() {
                if (window.location.hash != currentHash) {
                    window.location.reload();
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
