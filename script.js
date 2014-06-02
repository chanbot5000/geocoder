function addRow(){
				
			/*
			//$('#input_row').append('<input type="text" id="name" placeholder="Name">');	
			$('#input_row').append('<input type="text" id="street" placeholder="Street">');	
			$('#input_row').append('<input type="text" id="city" placeholder="City">');
			$('#input_row').append('<input type="text" id="state" placeholder="State">');
			$('#input_row').append('<input type="text" id="zip" placeholder="Zip Code">');						
			*/
			
			//$('#input_row').append('<input type="text" id="name" value="Name">');	
			$('#input_row').append('<input type="text" id="street" value="131 Riverlawn Ave">');	
			$('#input_row').append('<input type="text" id="city" value="Watertown">');
			$('#input_row').append('<input type="text" id="state" value="WI">');
			$('#input_row').append('<input type="text" id="zip" value="53094">');	
				
}

function createMap(){
	map = L.map('map').setView([39.5,-98.35],5);

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
	//L.geoJson(address).addTo(map);
}

function geocodeAddress(){
	name = $("#name").val();
	street = $("#street").val();
	city = $("#city").val();
	state = $("#state").val();
	zip = $("#zip").val();

	var plus_street= street.replace(/ /gi,"+");
    var plus_city = city.replace(/ /gi, "+");
    var plus_state = state.replace(/ /gi,"+");
    var plus_zip = zip.replace(/ /gi, "+");		

	//example format to pass to geocoder - http://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=4600+Silver+Hill+Rd%2C+Suitland%2C+MD+20746&benchmark=9&format=json
	var urlString = "http://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=" + plus_street + "%2C+" + plus_city + "%2C+" + plus_zip + "&benchmark=9&format=jsonp";
	console.log(urlString);

	$.ajax({
		type: "GET",
		dataType: "jsonp",
		contentType: "application/json",
		url: urlString,
		success: function(data) {
			mineJSON(data);
		},
		error: function(xhr, ajaxOptions, thrownError) {
			console.log(xhr.status, thrownError);
			console.log('error');

		}
	});
}

function mineJSON(json){

	try{
		x = json.result.addressMatches[0].coordinates.x;
		y =	json.result.addressMatches[0].coordinates.y;			

		completeAddress = street + " " + city + " " + state + " " + zip;
		popupContent = "<center>" + completeAddress + "<p>" + y + ", " + x + "</p></center>";

		L.marker([y, x]).addTo(map).bindPopup(popupContent);
		map.setZoom(12);
		map.setView(new L.LatLng(y,x));

		if (undoButtonCreated == false){
			$('#button_row').append('<input type="button" id="undo" class="geocodeButton" value="Undo">');
			undoButtonCreated = true;
			$('#undo').click(function(){
				if (entryCount > 1){
					csvList.pop()
					$('#csv').empty();
					$('#csv').append('<h2>CSV</h2>');
					$('#csv').append(csvList);

					jsonList.pop();
					jsonList.pop();
					jsonList.pop();
					jsonList.push(']}');					

					entryCount -= 1;

					if (entryCount == 1){
						$('#undo').remove();
						$('#csv').remove()
						$('#json').remove();
						jsonList.pop();
						undoButtonCreated = false;
						csvJsonDivsCreated = false;
					}

					$('#json').empty();
					$('#json').append('<h2>GEOJSON</h2>');
					$('#json').append(jsonList);
				}
			})
			
			console.log(undoButtonCreated);
		}
		
		appendCSV(name, street, city, state, zip, x,y);			
	
	}
	catch(err){
		$('#map').append('<div id="geocodeError">Whoops! We were unable to geocode that address, sorry about that!<p><input type="button" id="geocodeErrorDismiss" value="Dismiss"></p></div>');
		errorDivActive = true;
		
		$('#geocodeErrorDismiss').click(function(){
			$('#geocodeError').remove();
			errorDivActive = false;
		});		
	}		
}

function appendCSV(name, street, city, state, zip, x, y){

	
	if (csvJsonDivsCreated == false){
		$('#bottomContent').append('<div id="csv"></div>');
		$('#bottomContent').append('<div id="json"></div>');
		csvJsonDivsCreated = true;		
	}
	

	$('#csv').empty();
	$('#csv').append('<h2>CSV</h2>');
	
	csvString = entryCount + ", " + street + ", " + city + ", " + state + ", " + zip + ", " + x + ", " + y +"<br />";
	
	csvList.push(csvString);
	$('#csv').append(csvList);
	//$('#json').append(csvList);

	
	appendJSON(x,y);
		
}

function appendJSON(x,y){	
	
	var newJSONFeature = '{"type":"Feature","geometry":{"type":"Point","coordinates":[' + x + ', ' + y + ']},"properties":{"address":"'+ completeAddress + '"}}';

	if (entryCount > 1){
		jsonList.pop()
		jsonList.push(',');
	}

	jsonList.push(newJSONFeature);

	jsonList.push(']}');

	$('#json').empty();
	$('#json').append("<h2>GEOJSON</h2>");
	$('#json').append(jsonList);

	entryCount += 1;
}