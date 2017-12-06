var express = require('express');
var app = express();

app.get("/api/getData", function (req, rps) {
    var mockData = {
        "success": true,
        "result": {
            "nodes": [
                { "id": "Napoleon", "group": ["小广告"] },
                { "id": "Myriel", "group": ["小广告", "中介", "骚扰电话"] },
                { "id": "CountessdeLo", "group": ["小广告", "中介"] },
                { "id": "OldMan", "group": ["骚扰电话"] },
                { "id": "Valjean", "group": ["中介", "骚扰电话"] },
                { "id": "Gavroche", "group": ["中介"] },
                { "id": "Fameuil", "group": ["小广告", "中介"] }
            ],
            "links": [
                { "source": "Napoleon", "target": "Myriel", "value": 1 },
                { "source": "CountessdeLo", "target": "Myriel", "value": 1 },
                { "source": "OldMan", "target": "Myriel", "value": 1 },
                { "source": "Valjean", "target": "Valjean", "value": 1 },
                { "source": "Valjean", "target": "Myriel", "value": 5 },
                { "source": "Fameuil", "target": "Napoleon", "value": 4 },
                { "source": "Fameuil", "target": "Valjean", "value": 4 },
                { "source": "Gavroche", "target": "CountessdeLo", "value": 4 },
                { "source": "Fameuil", "target": "Valjean", "value": 4 }
            ]
        },
        messages: "数据获取成功！"
    }
    rps.send(mockData);
});

var server = app.listen(9999, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});