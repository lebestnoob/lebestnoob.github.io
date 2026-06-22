window.onload = function(){
        fetchContent("/templates/assembly.json", function(content){
            var templatesList;            
            try {
                templatesList = JSON.parse(content);
            } catch(e){
                templatesList = eval('(' + content + ')');
            }

            for (var key in templatesList) {   
                    (function(currentKey) {
                        fetchContent("/templates/" + currentKey, function(result) {;
                            var path = window.location.hash.substring(1, window.location.hash.length);
                
                            if (window.location.pathname != "/")  { 
                                path = "404.html";
                            } 
                
                            if(currentKey == "main.html") {
                                fetchContent("/pages/" + path, function(pageResult){
                                    document.getElementById(templatesList[currentKey].id).innerHTML = pageResult;
                                    var scripts = document.getElementsByTagName("script");
                                    for(var i=0; i<scripts.length; i++){
                                        eval(scripts[i].text)
                                    }
                                });
                            } else {
                            
                            document.getElementById(templatesList[currentKey].id).innerHTML = result;
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

function fetchContent(url, callback){
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
    req.callback = callback;

    req.open('GET', url, true);
    
    req.onreadystatechange = function(){
        if (req.readyState === 4) {
            if (req.status === 200) {
                callback(req.responseText);
            } else {
                if (req.status === 404){
                    window.location.href = "/404.html" + window.location.hash
                }
            }
        }
    }
    
    req.send();
}

