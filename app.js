const STORAGE_KEY = 'flowboard-v1';
const people = [
  { id: 'you', name: 'You', initials: 'Y', color: '#e17d6d' },
  { id: 'maya', name: 'Maya Chen', initials: 'MC', color: '#a47cc7' },
  { id: 'noah', name: 'Noah Williams', initials: 'NW', color: '#4f9dab' },
  { id: 'lina', name: 'Lina Patel', initials: 'LP', color: '#d6a34a' },
  { id: 'sam', name: 'Sam Rivera', initials: 'SR', color: '#65a37f' }
];

const seed = {
  currentBoardId: 'launch',
  boards: [{
    id: 'launch', name: 'Product launch', color: '#685bd2',
    description: 'Everything needed to take Flowboard from a bright idea to launch day.',
    columns: [
      { id: 'ideas', name: 'Ideas', cards: [
        { id: 'c1', title: 'Collect customer story angles', description: 'Find the strongest early-adopter stories for launch week.', assignee: 'maya', due: '2026-08-15', label: 'marketing', priority: 'normal' },
        { id: 'c2', title: 'Draft launch day social posts', description: 'Create a short, warm campaign for each platform.', assignee: 'you', due: '2026-08-18', label: 'coral', priority: 'low' }
      ]},
      { id: 'progress', name: 'In progress', cards: [
        { id: 'c3', title: 'Polish onboarding flow', description: 'Make the first ten minutes feel effortless.', assignee: 'lina', due: '2026-08-12', label: 'violet', priority: 'high' },
        { id: 'c4', title: 'Prepare pricing comparison', description: 'A clear page that helps small teams choose with confidence.', assignee: 'noah', due: '2026-08-16', label: 'blue', priority: 'normal' }
      ]},
      { id: 'review', name: 'Ready for review', cards: [
        { id: 'c5', title: 'Update product screenshots', description: 'Replace the dashboard images in the announcement.', assignee: 'sam', due: '2026-08-11', label: 'violet', priority: 'high' }
      ]},
      { id: 'done', name: 'Done', cards: [
        { id: 'c6', title: 'Confirm launch checklist', description: 'Roles, comms and launch-day timings are aligned.', assignee: 'you', due: '2026-08-09', label: 'gold', priority: 'normal' }
      ]}
    ]
  }, {
    id: 'website', name: 'Website refresh', color: '#e47c6b', description: 'A calmer, clearer new home for the brand.',
    columns: [{ id: 'todo', name: 'To do', cards: [{ id: 'c7', title: 'Audit current navigation', description: '', assignee: 'noah', due: '', label: 'blue', priority: 'normal' }] }, { id: 'doing', name: 'In progress', cards: [] }, { id: 'complete', name: 'Complete', cards: [] }]
  }]
};

const $ = (s) => document.querySelector(s);
let state = load(); let dragCardId = null;
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(seed); } catch { return structuredClone(seed); } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; }
function board() { return state.boards.find(b => b.id === state.currentBoardId); }
function person(id) { return people.find(p => p.id === id) || people[0]; }
function esc(text='') { const d=document.createElement('div'); d.textContent=text; return d.innerHTML; }
function formatDue(date) { if (!date) return ''; const d = new Date(`${date}T12:00:00`); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function isOverdue(date) { return date && new Date(`${date}T23:59:59`) < new Date() && date !== new Date().toISOString().slice(0,10); }
function avatar(id, extra='') { const p=person(id); return `<span class="avatar ${extra}" title="${esc(p.name)}" style="background:${p.color}">${p.initials}</span>`; }
function allCards() { return state.boards.flatMap(b => b.columns.flatMap(c => c.cards.map(card => ({...card, board:b, column:c})))); }
function labelName(label) { return ({violet:'Design',blue:'Product',coral:'Marketing',gold:'Research',marketing:'Marketing'})[label] || label; }

function render() {
  const b=board();
  $('#boardTitle').textContent=b.name; $('#boardHeading').textContent=b.name; $('#boardDescription').textContent=b.description || 'A place to keep the work moving.';
  $('#taskCount').textContent=allCards().filter(c=>c.assignee==='you' && c.column.name.toLowerCase()!=='done').length;
  $('#boardNav').innerHTML=state.boards.map(x=>`<button class="board-link ${x.id===b.id?'active':''}" data-board="${x.id}"><span class="board-dot" style="background:${x.color}"></span>${esc(x.name)}</button>`).join('');
  $('#teamStack').innerHTML=people.slice(0,4).map(p=>avatar(p.id)).join('') + `<span class="avatar" style="background:#868896;font-size:11px">+${people.length-4}</span>`;
  $('#boardCanvas').innerHTML=b.columns.map(column => `<article class="column" data-column="${column.id}"><header class="column-head"><span class="column-name">${esc(column.name)} <span class="column-count">${column.cards.length}</span></span><button class="icon-btn column-menu" data-column-menu="${column.id}" aria-label="Column options">•••</button></header><div class="card-list" data-dropzone="${column.id}">${column.cards.map(cardTemplate).join('')}</div><button class="add-card" data-add-card="${column.id}">+ Add a task</button></article>`).join('') + `<button class="add-column" id="addColumn">+ Add another list</button>`;
  bindBoardEvents();
}
function cardTemplate(c) { const p=person(c.assignee); return `<article class="task-card" draggable="true" tabindex="0" data-card="${c.id}"><div class="card-meta">${c.label?`<span class="tag ${c.label==='marketing'?'coral':c.label}">${labelName(c.label)}</span>`:'<span></span>'}${c.priority==='high'?'<span class="priority">● High</span>':''}</div><h3>${esc(c.title)}</h3>${c.description?`<p>${esc(c.description)}</p>`:''}<div class="card-foot"><span class="due ${isOverdue(c.due)?'overdue':''}">${c.due ? `◷ ${formatDue(c.due)}` : ''}</span>${avatar(p.id)}</div></article>`; }
function bindBoardEvents() {
  document.querySelectorAll('[data-board]').forEach(el=>el.onclick=()=>{state.currentBoardId=el.dataset.board;save();render();});
  document.querySelectorAll('[data-add-card]').forEach(el=>el.onclick=()=>openCard(null,el.dataset.addCard));
  document.querySelectorAll('.task-card').forEach(el=>{el.addEventListener('click',()=>openCard(el.dataset.card));el.addEventListener('keydown',e=>{if(e.key==='Enter') openCard(el.dataset.card)});el.addEventListener('dragstart',()=>{dragCardId=el.dataset.card;el.classList.add('dragging')});el.addEventListener('dragend',()=>{dragCardId=null;el.classList.remove('dragging');document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))})});
  document.querySelectorAll('[data-dropzone]').forEach(zone=>{zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over')});zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));zone.addEventListener('drop',e=>{e.preventDefault();moveCard(dragCardId,zone.dataset.dropzone)})});
  $('#addColumn').onclick=addColumn;
  document.querySelectorAll('[data-column-menu]').forEach(btn=>btn.onclick=()=>renameColumn(btn.dataset.columnMenu));
}
function findCard(id) { for(const c of board().columns){ const card=c.cards.find(x=>x.id===id); if(card)return{card,column:c}; } return {}; }
function openCard(id, columnId) { const found=id?findCard(id):null; const c=found?.card || {id:'',title:'',description:'',assignee:'you',due:'',label:'',priority:'normal'}; $('#cardId').value=c.id;$('#cardColumnId').value=found?.column.id||columnId||board().columns[0].id;$('#titleInput').value=c.title;$('#descriptionInput').value=c.description;$('#assigneeInput').innerHTML=people.map(p=>`<option value="${p.id}" ${p.id===c.assignee?'selected':''}>${p.name}</option>`).join('');$('#dueInput').value=c.due;$('#labelInput').value=c.label==='marketing'?'coral':c.label;$('#priorityInput').value=c.priority;$('#dialogEyebrow').textContent=id?'TASK DETAILS':'NEW TASK';$('#dialogTitle').textContent=id?'Edit task':'Add a task';$('#deleteCardBtn').style.visibility=id?'visible':'hidden';$('#cardDialog').showModal();$('#titleInput').focus(); }
function saveCard(e) { e.preventDefault();const id=$('#cardId').value;const data={id:id||uid(),title:$('#titleInput').value.trim(),description:$('#descriptionInput').value.trim(),assignee:$('#assigneeInput').value,due:$('#dueInput').value,label:$('#labelInput').value,priority:$('#priorityInput').value};if(!data.title)return;if(id){const {card}=findCard(id);Object.assign(card,data);toast('Task updated');}else{board().columns.find(c=>c.id===$('#cardColumnId').value).cards.push(data);toast('Task added');}save();$('#cardDialog').close();render(); }
function deleteCard(){const id=$('#cardId').value;if(!id)return;const {column}=findCard(id);column.cards=column.cards.filter(c=>c.id!==id);save();$('#cardDialog').close();render();toast('Task deleted');}
function moveCard(id,targetId){if(!id)return;const {card,column}=findCard(id);const target=board().columns.find(c=>c.id===targetId);if(!card||!target||column===target)return;column.cards=column.cards.filter(c=>c.id!==id);target.cards.push(card);save();render();toast(`Moved to ${target.name}`);}
function addColumn(){const name=prompt('Name this list');if(!name?.trim())return;board().columns.push({id:uid(),name:name.trim(),cards:[]});save();render();}
function renameColumn(id){const col=board().columns.find(c=>c.id===id);const name=prompt('Rename list',col.name);if(!name?.trim()||name.trim()===col.name)return;col.name=name.trim();save();render();}
function createBoard(e){e.preventDefault();const name=$('#newBoardName').value.trim();if(!name)return;const colors=['#685bd2','#e47c6b','#50a39d','#d39a42'];state.boards.push({id:uid(),name,description:$('#newBoardDescription').value.trim(),color:colors[state.boards.length%colors.length],columns:[{id:uid(),name:'To do',cards:[]},{id:uid(),name:'In progress',cards:[]},{id:uid(),name:'Done',cards:[]}]});state.currentBoardId=state.boards.at(-1).id;save();$('#boardDialog').close();$('#boardForm').reset();render();toast('Board created');}
function search(q=''){const results=allCards().filter(c=>`${c.title} ${c.description}`.toLowerCase().includes(q.toLowerCase()));$('#searchResults').innerHTML=q?results.length?results.map(c=>`<div class="search-result" data-result="${c.id}" data-result-board="${c.board.id}"><strong>${esc(c.title)}</strong><small>${esc(c.board.name)} · ${esc(c.column.name)}</small></div>`).join(''):'<div class="empty">No tasks found</div>':'<div class="empty">Search across every board</div>';document.querySelectorAll('[data-result]').forEach(el=>el.onclick=()=>{state.currentBoardId=el.dataset.resultBoard;save();render();$('#searchDialog').close();setTimeout(()=>openCard(el.dataset.result),10)});}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove('show'),1900)}

$('#openCreateCard').onclick=()=>openCard(null); $('#cardForm').addEventListener('submit',saveCard); $('#deleteCardBtn').onclick=deleteCard; $('#newBoardBtn').onclick=()=>$('#boardDialog').showModal(); $('#boardForm').addEventListener('submit',createBoard); $('#searchBtn').onclick=()=>{$('#searchDialog').showModal();$('#searchInput').value='';search();setTimeout(()=>$('#searchInput')?.focus(),0)}; $('#searchInput').addEventListener('input',e=>search(e.target.value)); $('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open'); $('#shareBtn').onclick=()=>toast('Your board is ready to share');
render();
