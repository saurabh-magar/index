// Initialize Map
var map = L.map('map').setView([22.3511, 78.6677], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var routeControl, userLocation, userMarker;

// Function to use GPS as Starting Location
function useGPS() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    document.getElementById('useLocation').innerText = "Finding...";

    navigator.geolocation.getCurrentPosition(
        position => {
            userLocation = [position.coords.latitude, position.coords.longitude];

            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker(userLocation).addTo(map)
                .bindPopup("Your Location").openPopup();

            map.setView(userLocation, 14);
            document.getElementById('useLocation').innerText = "Location Set ✅";
        },
        error => {
            alert("Unable to retrieve your location. Make sure GPS is enabled.");
            document.getElementById('useLocation').innerText = "Use My Location";
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
}

// Function to find route from GPS to destination
function findRoute() {
    var destinationInput = document.getElementById('destination').value;

    if (!userLocation) {
        alert("Please click 'Use My Location' first.");
        return;
    }
    if (!destinationInput) {
        alert("Please enter a destination!");
        return;
    }

    var geocodeUrl = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=";

    fetch(geocodeUrl + encodeURIComponent(destinationInput))
        .then(response => response.json())
        .then(destinationResults => {
            if (destinationResults.length === 0) {
                alert("Destination not found!");
                return;
            }

            var destinationCoords = [parseFloat(destinationResults[0].lat), parseFloat(destinationResults[0].lon)];

            if (routeControl) map.removeControl(routeControl);

            routeControl = L.Routing.control({
                waypoints: [
                    L.latLng(userLocation[0], userLocation[1]),
                    L.latLng(destinationCoords[0], destinationCoords[1])
                ],
                routeWhileDragging: true,
                showAlternatives: false,
                createMarker: function() { return null; },
                lineOptions: {
                    styles: [{ color: 'blue', weight: 6 }]
                }
            }).addTo(map);

            routeControl.on('routesfound', function(e) {
                var route = e.routes[0];
                var distance = route.summary.totalDistance / 1000;
                var estimatedTime = (distance * 3).toFixed(0) + " min";

                document.getElementById('distance').innerText = `Distance: ${distance.toFixed(2)} km`;
                document.getElementById('estimatedTime').innerHTML = `<strong>Estimated Time: ${estimatedTime}</strong>`;

                map.fitBounds([userLocation, destinationCoords]);
            });
        })
        .catch(() => alert("Error fetching route. Please try again."));
}