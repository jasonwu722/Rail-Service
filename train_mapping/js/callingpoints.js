(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "AIzaSyA14vcofDMOWim99Ojgv_FRfmM-OedFq9E",
    v: "weekly",
  });

  let currentInfoWindow = null;

  async function fetchDepartureBoard(stationCode) {
    const headersList = {
        "x-apikey": "3GzgOrw0GLYmOxtEppcxG8ZNhbGt5SJz3BMcyfU06spaOONd",
    }

    const baseURL = "https://api1.raildata.org.uk/1010-live-arrival-and-departure-boards-arr-and-dep/LDBWS/api/20220120";
    const endpoint = "/GetArrDepBoardWithDetails/";
    const numRows = "numRows=5";

    const fullURL = `${baseURL}${endpoint}${stationCode}?${numRows}`;

  var reqOptions = {
      method: "GET",
      headers: headersList,
      url: fullURL
    }
    try {
        const response = await axios(reqOptions);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data for station ${stationCode}:`, error);
        return null;
    }
}

function displayDepartureBoard(data) {
    if (!data || !data.trainServices) {
        return 'No data available';
    }
  
    const services = data.trainServices;
    let output = '<ul>';

    services.forEach(service => {
        const origin = service.origin[0].locationName;
        const origin2 = service.origin;
        const origin3 = service.origin[0];
        const destination = service.destination[0].locationName;
        const scheduledDeparture = service.std || service.sta;
        const expectedDeparture = service.etd || service.eta;
        const platform = service.platform || 'Not Available';
        const operator = service.operator;
        // const locationNames = service.previousCallingPoints[0].callingPoint[0].locationName
        const locationNames = [];
        const locationNamesArrival = [];

        const calling_points = (service.subsequentCallingPoints && service.subsequentCallingPoints[0] && service.subsequentCallingPoints[0].callingPoint)
        const calling_points_data = calling_points.map(cp => ({
          name: cp.locationName || 'Unknown',
          scheduledTime: cp.st || 'Unknown',
          actualTime: cp.et || 'Unknown'
        }))
        const callingPointsStr = encodeURIComponent(JSON.stringify(calling_points_data));
        try {
            service.previousCallingPoints[0].callingPoint.forEach(cp => {
                locationNames.push(cp.locationName);
                locationNamesArrival.push(cp.st);
            });
        output += ` <li>${origin} to ${destination} <button onclick="alert('${locationNames[0]}')">Details</button></li>`;
        console.log(calling_points);
        } catch (origin) {
        }

    });
    output += '</ul>';
    return output;
}

async function initMap() {
const {Map} = await google.maps.importLibrary("maps");

const map = new google.maps.Map(document.getElementById("map"),  {
    zoom: 14,
    center: { lat: 53.227390, lng: -4.129263},
    mapId: '3cd293d4d79eba4f'
});

const transitLayer = new google.maps.TransitLayer();
transitLayer.setMap(map);

const station_icon = {
    url: "img/station.png",
    scaledSize: new google.maps.Size(20, 20),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 10)
};

fetch ('assets/stations.json')
    .then(response => response.json())
    .then(async data => {
        for (const stations of data) {

            const departureData = await fetchDepartureBoard(stations.crs);
            const departureInfo = displayDepartureBoard(departureData);

            const infowindow_content = `
            <div class = "info_window_content">
            <h3 class = "info_window_title">${stations.station_name}</h3>
                <div class="info_window_body">
                <div id="departure_board">${departureInfo}</div>
                </div>
            </div>
            `;

            const station_markers = new google.maps.Marker({
                position: {lat: stations.latitude, lng: stations.longitude},
                map: map,
                title: stations.station_name,
                icon: station_icon
            });

            const infoWindow = new google.maps.InfoWindow({
                content: infowindow_content 
            });
            


            station_markers.addListener('click', () => {
                if (currentInfoWindow) {
                currentInfoWindow.close();
                }
                infoWindow.open(map, station_markers);
                currentInfoWindow = infoWindow;
            });
        }
    })


}

window.onload = initMap;

