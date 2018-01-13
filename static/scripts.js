// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels for points of interest
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },
    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        panControl: true,
        styles: styles,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);
});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    var myLatLng = {lat: place["lat"], lng: place["long"]};

    if (place["type"]=="arch")
    {
        url1='http://maps.google.com/mapfiles/kml/pal2/icon10.png';
    }
    else if (place["type"]=="nature")
    {
        url1='http://maps.google.com/mapfiles/kml/pal2/icon12.png';
    }
    //adds marker to the map
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        icon: {
            labelOrigin: new google.maps.Point(0,40),
            url:url1
        },
    });

    //listens click and shows info
    marker.addListener('click', function() {

        // configuratuing image search request
        var parameters={
            q: place["name"],
            num: 1,
            start: 1,
            imgSize: 'medium',
            searchType: 'image',
            key: 'AIzaSyCCaDRjkOTpBVjDMPNT4oBXsArAJvDSmwo',
            cx: '017708140107321662253:6bpca-hzmxg'
        };

        //get image for place using JSON/Atom Custom Search API
        $.getJSON( 'https://www.googleapis.com/customsearch/v1', parameters, function(data) {
            var image_ref=data["items"][0]["link"];

            // build content for infowindow
            var str1='<p><img src="'+image_ref+'"></p>'+
                '<h4>'+place["name"]+'</h4>'+
                '<p>Адреса: '+place["city"];
            if (place["adress"]!=' ')
            {
                var str=str1+', '+ place["adress"];
            }
            else
            {
                str=str1;
            }
            var info='</p>'+str+'<p><a href="'+place["wiki_ref"]+'" target="_blank">Інформація з Вікіпедії</a>'+'</p>';

            //shows infowindow
            showInfo(marker, info);
        });
    });

    //saves marker
    markers.push(marker);
}

/**
 * Configures application.
 */
function configure()
{

    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update_all();
        }
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update_all();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true;
        event.stopPropagation && event.stopPropagation();
        event.cancelBubble && event.cancelBubble();
    }, true);

    // re-center map after place is selected from drop-down on submit button
    $("#form").submit(function(event){
        event.preventDefault();
        update();
    });

    // update UI
    update();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    //remove markers from the map
    for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
    }

    //delete markers from the array
    markers = [];
}

/**
 * Shows info window at marker with content.
 */


function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) == "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='/static/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}


/**
 * Updates UI's markers after place is selected from drop-down.
 */
function update()
{
    //get places from search
    var parameters= {
        region:$("#region_selection").val(),
        type:$("#type_selection").val()
    };

    $.getJSON(Flask.url_for("search"), parameters)
    .done(function(data, textStatus, jqXHR) {

       // remove old markers from map
       removeMarkers();

       // add new markers to map
        for (var i = 0; i < data[0].length; i++)
        {
           addMarker(data[0][i]);
        }
        //set zoom of map to cover all visible markers
        //https://stackoverflow.com/questions/19304574/center-set-zoom-of-map-to-cover-all-visible-markers
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}

/**
 * Updates UI's markers after zoom change or after map has been dragged.
*/
function update_all()
{
    //get places from search
    var parameters= {
        region:$("#region_selection").val(),
        type:$("#type_selection").val()
    };

    $.getJSON(Flask.url_for("search"), parameters)
    .done(function(data, textStatus, jqXHR) {

        // remove old markers from map
        removeMarkers();

        // add new markers to map
        for (var i = 0; i < data[1].length; i++)
        {
            addMarker(data[1][i]);
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
}