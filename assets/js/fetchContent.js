window.onload = function(){
    if (document.readyState === "complete") {

        var content  = fetchContent("/templates/assembly.json");
        var templatesList = JSON.parse(content);
        var keys = Object.keys(templatesList);
        
        var arr = [];
        for (var i=0; i < keys.length; i++){   
            
            var result = fetchContent("/templates/" + keys[i]);
            var path = window.location.hash.substring(1, window.location.hash.length);

            if (window.location.pathname != "/")  { 
                path = "404.html";
            } 
            
            if(keys[i] == "main.html")
                result = fetchContent("/pages/" + path);
            
            document.getElementById(templatesList[keys[i]].id).innerHTML = result;
            
        }
    }

    var hrefs = document.getElementsByTagName("a");

    for(var i=0; i < hrefs.length; i++){
        if(hrefs[i].href.includes("#")) {
            hrefs[i].onclick = function(){
                                window.location.hash = this.href;
                                setTimeout(function() {
                                    window.location.reload();
                                }, 100);
                            }
        }
    }

}

function fetchContent(url){
    var req = new XMLHttpRequest();

        req.open('GET', url, false);
        req.send();

        return req.responseText;

}

