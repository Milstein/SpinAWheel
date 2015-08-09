var placeSearch, autocomplete, streetNum, streetName, cityName, stateName, zipCode;
var componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    postal_code: 'short_name'
};

function initialize() {
    // Create the autocomplete object, restricting the search
    // to geographical location types.
    autocomplete = new google.maps.places.Autocomplete(
        /** @type {HTMLInputElement} */(document.getElementById('apiAddr')),
        { types: ['geocode'] });
    // When the user selects an address from the dropdown,
    // populate the address fields in the form.
    google.maps.event.addListener(autocomplete, 'place_changed', function () {
        fillInAddress();
    });
}

// [START region_fillform]
function fillInAddress() {
    // Get the place details from the autocomplete object.
    var place = autocomplete.getPlace();
    addrSwitch()
    for (var component in componentForm) {
        document.getElementById(component).value = '';
        document.getElementById(component).disabled = false;
    }

    // Get each component of the address from the place details
    // and fill the corresponding field on the form.
    for (var i = 0; i < place.address_components.length; i++) {
        var addressType = place.address_components[i].types[0];
        if (componentForm[addressType]) {
            var val = place.address_components[i][componentForm[addressType]];

            if (addressType == 'street_number') {
                streetNum = val;
            } else if (addressType == 'route') {
                streetName = val;
                $('#addr1').val((streetNum ? streetNum + ' ' : '') + streetName).change();
            } else if (addressType == 'locality') {
                cityName = val;
                $('#city').val(cityName).change();
            } else if (addressType == 'administrative_area_level_1') {
                stateName = val;
                $('#state').val(stateName).change();
            } else if (addressType == 'postal_code') {
                zipCode = val;
                $('#zip').val(zipCode).change();
            }

            //$('#'+addressType).val(val);
        }
    }
    $('#addr2').focus();
}
// [END region_fillform]

// [START region_geolocation]
// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var geolocation = new google.maps.LatLng(
                position.coords.latitude, position.coords.longitude);
            autocomplete.setBounds(new google.maps.LatLngBounds(geolocation,
                geolocation));
        });
    }
}
// [END region_geolocation]