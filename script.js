
const firebaseConfig = {
    apiKey: "AIzaSyCEpe5hA8AvZlMJYfFWBkOKQGtzHJ3NEPA",
    authDomain: "todo-sync-f9b93.firebaseapp.com",
    databaseURL: "https://todo-sync-f9b93-default-rtdb.firebaseio.com",
    projectId: "todo-sync-f9b93",
    storageBucket: "todo-sync-f9b93.firebasestorage.app",
    messagingSenderId: "663786420564",
    appId: "1:663786420564:web:f0c23704e5ccce8a5370c1",
    measurementId: "G-4C0HYHHGHP"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');


let lastChangedId = null;


function highlightTask(taskElement) {
    taskElement.classList.add('highlight');
    setTimeout(() => taskElement.classList.remove('highlight'), 1000);
}

db.ref('tasks').on('value', snapshot => {
    const data = snapshot.val() || {};
    const tasks = Object.values(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    renderTasks(tasks);
});


function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    const newTask = { id: Date.now().toString(), text, completed: false, order: Date.now() };
    lastChangedId = newTask.id; // запам’ятовуємо для підсвітки
    db.ref('tasks/' + newTask.id).set(newTask);
    taskInput.value = '';
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });


function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        if (task.completed) li.classList.add('completed');

        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () =>
            db.ref('tasks/' + task.id).update({ completed: !task.completed })
        );

        
        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

       
        const actions = document.createElement('div');
        actions.className = 'actions';

        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.className = 'edit-btn';
        editBtn.addEventListener('click', () => {
            const newText = prompt('Редагувати завдання:', task.text);
            if (newText && newText.trim() !== '') {
                lastChangedId = task.id; // запам’ятовуємо для підсвітки
                db.ref('tasks/' + task.id).update({ text: newText.trim() });
            }
        });

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.className = 'delete-btn';
        delBtn.addEventListener('click', () =>
            db.ref('tasks/' + task.id).remove()
        );

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);

        taskList.appendChild(li);

        
        li.classList.add('fade-in');
        setTimeout(() => li.classList.remove('fade-in'), 600);

        
        if (task.id === lastChangedId) {
            highlightTask(li);
            lastChangedId = null; 
        }
    });

    initSortable(); 
}


function initSortable() {
    if (window.sortable) window.sortable.destroy();
    window.sortable = Sortable.create(taskList, {
        animation: 200,
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: function () {
            const newOrder = Array.from(taskList.children).map(li => li.dataset.id);
            newOrder.forEach((id, index) => {
                db.ref('tasks/' + id).update({ order: index });
            });
        }
    });
}


