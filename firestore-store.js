const EMPTY_DATA = () => ({ categories: [], tasks: [], events: [] });
const clone = value => JSON.parse(JSON.stringify(value));
const categoryDocumentId = name => 'c_' + Array.from(new TextEncoder().encode(name), byte => byte.toString(16).padStart(2, '0')).join('');

function normalizeLocalData(raw, defaultCategories, today) {
  if (!raw || !Array.isArray(raw.categories) || !Array.isArray(raw.tasks) || !Array.isArray(raw.events)) return null;
  const categories = [...new Set(raw.categories.filter(value => typeof value === 'string').map(value => value.trim().slice(0, 8)).filter(Boolean))];
  const normalizeItem = (item, index, type) => {
    if (!item || typeof item !== 'object') return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? item.date : today;
    const base = {
      id: String(item.id || type + '-legacy-' + index).slice(0, 100),
      title: String(item.title || '未命名事項').trim().slice(0, 80) || '未命名事項',
      date,
      time: typeof item.time === 'string' ? item.time : '',
      category: typeof item.category === 'string' ? item.category.slice(0, 8) : (categories[0] || ''),
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 300) : '',
      reminderMinutes: [null, 0, 5, 10, 15, 30, 60, 1440].includes(item.reminderMinutes) ? item.reminderMinutes : null,
      reminderMethod: item.reminderMethod === 'notification' ? 'notification' : 'in-app'
    };
    if (type === 'task') return { ...base, priority: ['high', 'normal', 'low'].includes(item.priority) ? item.priority : 'normal', completed: item.completed === true };
    return { ...base, endTime: typeof item.endTime === 'string' ? item.endTime : '', location: typeof item.location === 'string' ? item.location.slice(0, 160) : '' };
  };
  return {
    categories: categories.length ? categories : [...defaultCategories],
    tasks: raw.tasks.map((item, index) => normalizeItem(item, index, 'task')).filter(Boolean),
    events: raw.events.map((item, index) => normalizeItem(item, index, 'event')).filter(Boolean)
  };
}

function categoryRows(categories) {
  return categories.map(name => ({ id: categoryDocumentId(name), name }));
}

function collectChanges(collectionName, oldRows, newRows, operations, uid) {
  const oldById = new Map(oldRows.map(row => [row.id, row]));
  const newById = new Map(newRows.map(row => [row.id, row]));
  for (const [id, row] of newById) {
    const old = oldById.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(row)) operations.push({ type: 'set', collectionName, id, data: { ...row, uid } });
  }
  for (const id of oldById.keys()) if (!newById.has(id)) operations.push({ type: 'delete', collectionName, id });
}

async function writeDiff(firestore, db, uid, next, previous = EMPTY_DATA()) {
  const operations = [];
  collectChanges('categories', categoryRows(previous.categories || []), categoryRows(next.categories || []), operations, uid);
  collectChanges('tasks', previous.tasks || [], next.tasks || [], operations, uid);
  collectChanges('events', previous.events || [], next.events || [], operations, uid);

  for (let offset = 0; offset < operations.length; offset += 450) {
    const batch = firestore.writeBatch(db);
    for (const operation of operations.slice(offset, offset + 450)) {
      const ref = firestore.doc(db, 'users', uid, operation.collectionName, operation.id);
      if (operation.type === 'delete') batch.delete(ref);
      else batch.set(ref, operation.data);
    }
    await batch.commit();
  }
}

export async function loadUserData(firestore, db, uid, legacyStorageKey, defaultCategories, today, seedData) {
  const readCollection = name => firestore.getDocs(firestore.collection(db, 'users', uid, name));
  const [categorySnapshot, taskSnapshot, eventSnapshot] = await Promise.all([
    readCollection('categories'), readCollection('tasks'), readCollection('events')
  ]);

  if (categorySnapshot.empty && taskSnapshot.empty && eventSnapshot.empty) {
    let localData = null;
    try {
      localData = normalizeLocalData(JSON.parse(localStorage.getItem(legacyStorageKey) || 'null'), defaultCategories, today);
    } catch { }
    const initialData = localData || normalizeLocalData(seedData(), defaultCategories, today);
    await writeDiff(firestore, db, uid, initialData);
    return initialData;
  }

  const categories = categorySnapshot.docs.map(snapshot => snapshot.data().name).filter(value => typeof value === 'string');
  const tasks = taskSnapshot.docs.map(snapshot => {
    const { uid: ownerUid, ...item } = snapshot.data();
    return { ...item, id: snapshot.id };
  });
  const events = eventSnapshot.docs.map(snapshot => {
    const { uid: ownerUid, ...item } = snapshot.data();
    return { ...item, id: snapshot.id };
  });
  return { categories: categories.length ? categories : [...defaultCategories], tasks, events };
}

export function createUserDataStore(firestore, db, uid, initialData, onError) {
  let lastSaved = clone(initialData);
  let timer = null;
  let queue = Promise.resolve();

  const enqueue = snapshot => {
    queue = queue.then(async () => {
      await writeDiff(firestore, db, uid, snapshot, lastSaved);
      lastSaved = clone(snapshot);
    }).catch(error => { onError(error); });
    return queue;
  };

  return {
    save(data) {
      const snapshot = clone(data);
      clearTimeout(timer);
      timer = setTimeout(() => { timer = null; enqueue(snapshot); }, 350);
    },
    async flush(data) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        await enqueue(clone(data));
      }
      await queue;
    }
  };
}
