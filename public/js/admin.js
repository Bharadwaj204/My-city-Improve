document.addEventListener('DOMContentLoaded', () => {
  const tbl = document.querySelector('#tbl tbody');
  const loadBtn = document.getElementById('load');

  function getToken(){ return localStorage.getItem('mycity_token'); }

  async function load() {
    tbl.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const res = await fetch('/api/complaints', { headers });
    const all = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        tbl.innerHTML = '<tr><td colspan="6">Unauthorized. Please <a href="/admin-login.html">login</a>.</td></tr>';
        return;
      }
      tbl.innerHTML = `<tr><td colspan="6">Error: ${JSON.stringify(all)}</td></tr>`;
      return;
    }
    if (!all.length) {
      tbl.innerHTML = '<tr><td colspan="6">No complaints</td></tr>';
      return;
    }
    tbl.innerHTML = '';
    all.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c._id}</td>
        <td>${escapeHtml(c.description)}<br/><small>${c.email || ''}</small></td>
        <td>${c.photoUrl ? `<a href="${c.photoUrl}" target="_blank"><img src="${c.photoUrl}" class="thumb"/></a>` : ''}</td>
        <td>${c.lat ? c.lat + ',' + c.lng : ''}</td>
        <td>${c.status}</td>
        <td>
          <button class="set" data-id="${c._id}" data-status="In Progress">Mark In Progress</button>
          <button class="set" data-id="${c._id}" data-status="Resolved">Mark Resolved</button>
        </td>
      `;
      tbl.appendChild(tr);
    });

    Array.from(document.querySelectorAll('button.set')).forEach(b => b.addEventListener('click', onSet));
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }

  async function onSet(e){
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    const token = getToken();
    if (!token) return alert('Please login first: /admin-login.html');

    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ status })
    });
    const body = await res.json();
    if (res.ok) {
      alert('Updated'); load();
    } else {
      alert('Error: ' + (body.error || JSON.stringify(body)));
    }
  }

  loadBtn.addEventListener('click', load);
  load();
});
