const fs = require('fs').promises;
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data', 'complaints.json');

async function ensure() {
  try {
    await fs.access(DATA_FILE);
  } catch (e) {
    await fs.writeFile(DATA_FILE, JSON.stringify([] , null, 2));
  }
}

async function readAll() {
  await ensure();
  const txt = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(txt || '[]');
}

async function writeAll(arr) {
  await fs.writeFile(DATA_FILE, JSON.stringify(arr, null, 2));
}

async function addComplaint(c) {
  const all = await readAll();
  all.push(c);
  await writeAll(all);
  return c;
}

async function getAllComplaints() {
  return await readAll();
}

async function getComplaint(id) {
  const all = await readAll();
  return all.find(x => x.id === id) || null;
}

async function updateComplaintStatus(id, status) {
  const all = await readAll();
  const idx = all.findIndex(x => x.id === id);
  if (idx === -1) return null;
  all[idx].status = status;
  all[idx].updatedAt = new Date().toISOString();
  await writeAll(all);
  return all[idx];
}

module.exports = { addComplaint, getAllComplaints, getComplaint, updateComplaintStatus };
