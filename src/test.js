var http = require('http');
var cheerio = require('cheerio');

    var endpoint = 'http://www.mollymoon.com/flavors/seasonal';

    http.get(endpoint, function (res) {
        var noaaResponseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            // tideResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            noaaResponseString += data;
        });

        res.on('end', function () {
            $ = cheerio.load(noaaResponseString);
            flavors = $('.product > strong');
            flavs = flavors.text().split(' ');
            flavs = flavs.filter(String);
            flavs = flavs.filter(function(n){ return n != "\n" });
            flavs = flavs.join(' ');
            console.log(flavs);

            response.tell(flavs, "MollyMoon", flavs);
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
    });

