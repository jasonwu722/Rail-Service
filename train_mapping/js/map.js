(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
  key: "AIzaSyA14vcofDMOWim99Ojgv_FRfmM-OedFq9E",
  v: "weekly",
})
// import Google Map API

async function fetch_departure_board(CRS_code) {
  const rail_API_key = {
    "x-apikey": "3GzgOrw0GLYmOxtEppcxG8ZNhbGt5SJz3BMcyfU06spaOONd",
    // Rail Data Marketplace API
  }

  const base_URL = "https://api1.raildata.org.uk/1010-live-arrival-and-departure-boards-arr-and-dep/LDBWS/api/20220120/GetArrDepBoardWithDetails/"
  const num_rows = "numRows=5"
  const request_URL = `${base_URL}${CRS_code}?${num_rows}`
  // Rail Data Marketplace API request URL

  var request_options = {
    method: "GET",
    headers: rail_API_key,
    url: request_URL
  }
  // request date from Rail Data Marketplace API

  try {
    const response = await axios(request_options)
    return response.data
  } 
  catch (error) {
    console.error(`Error fetching data for station ${CRS_code}:`, error)
    return null
  }
  // if the data of station is not available on Rail Data Marketpalce, catch the error and log the CRS code of the station
}

function display_departure_board(data, station_name) {
  if (!data.trainServices) {
    return 'No data available'
  }
  // check whether the station has data
  

  const services = data.trainServices
  let output = `<h3>${station_name}</h3><ul class="infowindow">`
  
  services.forEach(service => {
    const origin = service.origin[0].locationName || 'Unknown Origin'
    const destination = service.destination[0].locationName || 'Unknown Destination'
    const scheduled_departure = service.std || service.sta || 'Unknown'
    const expected_departure = service.etd || service.eta || 'Unknown'
    const platform = service.platform || 'Not Available'
    const operator = service.operator || 'Unknown Operator'

    const calling_points = (service.subsequentCallingPoints && service.subsequentCallingPoints[0] && service.subsequentCallingPoints[0].callingPoint) || []
    const calling_points_data = calling_points.map(cp => ({
      name: cp.locationName || 'Unknown',
      scheduled_time: cp.st || 'Unknown',
      actual_time: cp.et || 'Unknown'
    }))

    const calling_points_str = encodeURIComponent(JSON.stringify(calling_points_data))

    output += `<li><button class="btn" onclick='showTrainInfo("${scheduled_departure}", "${platform}", "${expected_departure}", "${operator}", "${calling_points_str}")'>${scheduled_departure} - ${origin} to ${destination}</button></li>`
  })
  output += '</ul></div>'
  return output
}

function showTrainInfo(scheduled_departure, platform, expected_departure, operator, calling_points_str) {
  const callingPoints = JSON.parse(decodeURIComponent(calling_points_str))

  const modal_body = document.getElementById('trainModalBody')
  modal_body.innerHTML = `
    <p>Scheduled Time: ${scheduled_departure}</p>
    <p>Platform: ${platform}</p>
    <p>Expected: ${expected_departure}</p>
    <p>Operator: ${operator}</p>
    <h3>Subsequent Calling Points:</h3>
    <ul>
      ${callingPoints.map(cp => `<li>${cp.name} - Scheduled: ${cp.scheduled_time} - Excepted: ${cp.actual_time}</li>`).join('')}
    </ul>
  `

  const modal = document.getElementById('infoModal')
  modal.style.display = "block"
}

document.querySelector('.close').onclick = function() {
  document.getElementById('infoModal').style.display = "none"
}

window.onclick = function(event) {
  const modal = document.getElementById('infoModal')
  if (event.target == modal) {
    modal.style.display = "none"
  }
}

let currentInfoWindow = null

async function initMap() {
  const {Map} = await google.maps.importLibrary("maps")

  const map_inital_options = {
    zoom: 8,
    center: { lat: 53.227390, lng: -4.129263},
    disableDefaultUI: true,
    mapId: '3cd293d4d79eba4f'
  }

  const map = new google.maps.Map(document.getElementById("map"), map_inital_options)

  const transitLayer = new google.maps.TransitLayer()
  transitLayer.setMap(map)

  const station_icon = {
    url: "img/station_logo.png",
    scaledSize: new google.maps.Size(40, 40),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(0, 30)
  }

  const markers = []

  fetch ('assets/uk_train_stations.json')
    .then(response => response.json())
    .then(data => {
      for (const stations of data) {
        const station_markers = new google.maps.Marker({
          position: {lat: stations.latitude, lng: stations.longitude},
          map: map,
          title: stations.station_name,
          icon: station_icon
        })

        station_markers.addListener('click', async () => {
          if (currentInfoWindow) {
            currentInfoWindow.close()
          }

          const departure_data = await fetch_departure_board(stations.crs)
          const departure_info = display_departure_board(departure_data, stations.station_name)
          document.getElementById('trainModalBody').innerHTML = departure_info

          const infoWindow = new google.maps.InfoWindow({
            content: departure_info
          })
        
          infoWindow.open(map, station_markers)
          currentInfoWindow = infoWindow
        })

        markers.push(station_markers);
      }
      
      new markerClusterer.MarkerClusterer({map, markers})
    })
}

window.onload = initMap