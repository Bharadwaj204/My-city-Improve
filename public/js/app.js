// client-side logic for complaint submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaintForm');
  const photoInput = document.getElementById('photo');
  const preview = document.getElementById('photoPreview');

  photoInput.addEventListener('change', () => {
    preview.innerHTML = '';
    const f = photoInput.files[0];
    if (!f) return;
    const img = document.createElement('img');
    img.className = 'preview';
    img.src = URL.createObjectURL(f);
    preview.appendChild(img);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('description', document.getElementById('description').value);
    fd.append('email', document.getElementById('email').value);
    fd.append('lat', document.getElementById('lat').value);
    fd.append('lng', document.getElementById('lng').value);
    if (photoInput.files[0]) fd.append('photo', photoInput.files[0]);

    const res = await fetch('/api/complaints', { method: 'POST', body: fd });
    const body = await res.json();
    if (res.ok) {
      alert('Complaint submitted! Your id: ' + body.id + '\nSave this id to track status.');
      form.reset(); preview.innerHTML='';
    } else {
      alert('Error: ' + (body.error || JSON.stringify(body)));
    }
  });
});

// OPTIONAL: map integration callback (if user adds Google Maps key and uncommented script)
function initMap() {
  const latInput = document.getElementById('lat');
  const lngInput = document.getElementById('lng');
  const mapDiv = document.getElementById('map');
  const center = { lat: 12.9716, lng: 77.5946 }; // fallback center
  const map = new google.maps.Map(mapDiv, { center, zoom: 13 });
  let marker;
  map.addListener('click', (e) => {
    const pos = e.latLng;
    latInput.value = pos.lat();
    lngInput.value = pos.lng();
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({ position: pos, map });
  });
}
