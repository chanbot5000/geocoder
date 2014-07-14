function addRow(){
				
			
			//$('#input_row').append('<input type="text" id="name" placeholder="Name">');	
			$('#input_row').append('<input type="text" id="street" placeholder="Street">');	
			$('#input_row').append('<input type="text" id="city" placeholder="City">');
			$('#input_row').append('<input type="text" id="state" placeholder="State">');
			$('#input_row').append('<input type="text" id="zip" placeholder="Zip Code">');				
			
			/*
			//$('#input_row').append('<input type="text" id="name" value="Name">');	
			$('#input_row').append('<input type="text" id="street" value="17 N Webster St">');	
			$('#input_row').append('<input type="text" id="city" value="Madison">');
			$('#input_row').append('<input type="text" id="state" value="WI">');
			$('#input_row').append('<input type="text" id="zip" value="53703">');	*/				
}

function createMap(){
	map = L.map('map').setView([39.5,-98.35],10);
	L.GeoIP.centerMapOnPosition(map);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
	
}

function buildAddress(){
	
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
	var urlString = "http://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=" + plus_street + "%2C+" + plus_city + "%2C+" + plus_state + "+" + plus_zip + "&benchmark=9&format=jsonp";		
	console.log(urlString);
	geocodeAddress(urlString);
	
}

function geocodeAddress(address){
	console.log(address);
	$.ajax({
		type: "GET",
		dataType: "jsonp",
		contentType: "application/jsonp",
		url: address,		
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
		matchedAddress = json.result.addressMatches[0].matchedAddress;

		popupContent = "<center>" + matchedAddress + "<p>" + y + ", " + x + "</p></center>";
		var marker = L.marker([y,x]);	
		markerList.push(marker);			
		marker.addTo(map).bindPopup(popupContent);		
				
		if (entryCount == lines.length-1){
			alert('in if');
			markerGroup = new L.featureGroup(markerList);
			map.fitBounds(markerGroup.getBounds());
		}		

		if (csvImport == false){
			map.setView(new L.LatLng(y,x), 12);
		}	

		if (undoButtonCreated == false){
			$('#inputFile').remove();
			$('#button_row').append('<input type="button" id="undo" class="geocodeButton" value="Undo">');
			undoButtonCreated = true;
			$('#undo').click(function(){
				
				map.removeLayer(markerList[markerList.length - 1]);
				markerList.pop();				
				

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

						map.setView([39.5,-98.35],5);

					}else{

						map.setView(markerList[markerList.length -1].getLatLng());
					}

					$('#json').empty();
					$('#json').append('<h2>GEOJSON</h2>');
					$('#json').append(jsonList);
				}
			})			
		}
		
		//console.log(matchedAddress);
		matchedAddressSplit = matchedAddress.split(",");		

		street = matchedAddressSplit[0];
		city = matchedAddressSplit[1];
		state = matchedAddressSplit[2];
		zip = matchedAddressSplit[3];
		console.log(street,city,state,zip);
		appendCSV(name, street, city, state, zip, x,y);			
	
	}
	catch(err){
		if (csvImport == false){
			$('#map').append('<div class="geocodeError" id="geocodeError">Whoops! We were unable to geocode that address, sorry about that!<p><input type="button" id="geocodeErrorDismiss" value="Dismiss"></p></div>');
			errorDivActive = true;
			
			$('#geocodeErrorDismiss').click(function(){
				$('#geocodeError').remove();
				errorDivActive = false;
			});		
		}else{			
			var csvError = json.result.input.address.address;
			csvGeocodeError(csvError);
		}
	}		
}

function csvGeocodeError(addressError){

	if (errorCount == 0){
		$('#bottomContent').append('<div id="csvErrorGeocoded"><h2>Geocode Error - Could Not Find Addresses:</h2></div>');
	}

	errorCount++;	
	$('#csvErrorGeocoded').append(errorCount + " " + addressError);
	$('#csvErrorGeocoded').append('<br />');
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

	appendJSON(x,y);
		
}

function appendJSON(x,y){	
	
	var newJSONFeature = '{"type":"Feature","geometry":{"type":"Point","coordinates":[' + x + ', ' + y + ']},"properties":{"address":"'+ matchedAddress + '"}}';

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

function readfile(f){	
	lines = [];
	var reader = new FileReader();
	reader.readAsText(f);

	reader.onload = function(){
		csvImport = true;
		var text = reader.result;
		var s = text.split(/\r\n|\n/);				
		
		for (var i=0; i<s.length;i++){
			var data = s[i].split(';');
			var tarr = [];
			for (var j=0;j<data.length;j++){
				tarr.push(data[j]);
			}
			lines.push(tarr);			
		}
	}

	reader.onloadend = function(){
		readFileSuccess();
	}
}

function readFileSuccess(){

		var csvHeader = lines[0][0].split(","); //include space to split at comma space instead of just comma
		var geocodeFields = ["Street","City","State","Zip"];			

		$('#csvFields').append('Select the corresponding column for the geocoding process. This geocoder works best if it is provided the Street Address, City, State, and Zip code<br /><br />');

		for (var i=0;i<geocodeFields.length;i++){
			var selectTag = "<select id='upload" + geocodeFields[i] + "'>"; 

			for (var j=0;j<csvHeader.length;j++){
				var optionTag = "<option value='" + csvHeader[j] + "'>" + csvHeader[j] + "</option>";
				selectTag = selectTag + optionTag;					
			}

			selectTag = selectTag + "</select><br />";
			$('#csvFields').append(geocodeFields[i]);
			$('#csvFields').append(selectTag);
		}

		$('#csvFields').append('<br />');
		$('#cancelCSV').before('<input type="button" id="geocodeUploadedCSV" value="Geocode!">');

		$('#geocodeUploadedCSV').click(function(){			

			var uploadStreetField = $('#uploadStreet').val();
			var uploadCityField = $('#uploadCity').val();
			var uploadStateField = $('#uploadState').val();
			var uploadZipField = $('#uploadZip').val();

			var uploadStreetIndex = csvHeader.indexOf(uploadStreetField);
			var uploadCityIndex = csvHeader.indexOf(uploadCityField);
			var uploadStateIndex = csvHeader.indexOf(uploadStateField);
			var uploadZipIndex = csvHeader.indexOf(uploadZipField);
			
			for (var mug=0;mug<lines.length;mug++){
				var uploadLine = lines[mug];
				var uploadLineList = uploadLine[0].split(",");					

				if (uploadLineList == ""){

				}else if(mug == 0){

				}else{
									
				uploadStreet = uploadLineList[uploadStreetIndex];
				uploadCity = uploadLineList[uploadCityIndex];
				uploadState = uploadLineList[uploadStateIndex];
				uploadZip = uploadLineList[uploadZipIndex];

				var valueList = [uploadStreet,uploadCity,uploadState,uploadZip];
				var stringRemovedList = [];
				var newValueList = [];

				for (var gum=0;gum<valueList.length;gum++){

					if (valueList[gum].indexOf(' ') == 0){
						valueList[gum] = valueList[gum].replace(' ','',1);
						stringRemovedList.push(valueList[gum]);
					}else{							
						stringRemovedList.push(valueList[gum]);
					}

					newValueList.push(valueList[gum].replace(/ /gi,"+"));
						
				}	
				
				console.log(entryCount);
				var upUrlString = "http://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=" + newValueList[0] + "%2C+" + newValueList[1] + "%2C+" + newValueList[2] + "+" + newValueList[3] + "&benchmark=9&format=jsonp";						

				geocodeAddress(upUrlString);				
				$('#inputFileDiv').remove();

				}
			}												
		});
				
}