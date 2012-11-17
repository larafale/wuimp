var fs = require('fs');
var array = fs.readFileSync('file.csv').toString().split("\n");

var reg = new RegExp("^\/.*\\?")

for(i in array) {
  line = array[i]

  if(reg.test(line)){

    c = line.split("?")
    id = c[0].substr(1,24)
    c = c[1].split("&")
    d = c[0].split('place=')
    place = d[1]
    c = c[1].split(',')
    d = c[0].split('city=')
    city = d[1]

    if(city!="undefined") console.log("places[\"" + id + "\"] = [\"" + place + "\", \"" + city + "\"];");
  }
}