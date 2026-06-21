window.onload = function(){
        fetchContent("/templates/assembly.json", function(content){
            var templatesList = JSON.parse(content);

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
                                });
                            } else {
                            
                            document.getElementById(templatesList[currentKey].id).innerHTML = result;
                            }
                        });
                    })(key);
            }

        });

    window.onhashchange = function() {
        window.location.reload();
    };
}

function fetchContent(url, callback){
    var req = new XMLHttpRequest();
    req.callback = callback;

    req.open('GET', url, true);
    
    req.onreadystatechange = function(){
        if (req.readyState === 4) {
            if (req.status === 200) {
                callback(req.responseText);
            } else {
                if (req.status == 404){
                    window.location.href = "/404.html" + window.location.hash
                }
            }
        }
    }
    
    req.send();
}

