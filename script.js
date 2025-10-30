// === ІНІЦІАЛІЗАЦІЯ FIREBASE === 
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

// === DOM елементи ===
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

// === Додати нове завдання ===
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    db.ref('tasks').once('value', snapshot => {
        const data = snapshot.val() || {};
        const maxOrder = Object.values(data).reduce((max, t) => t.order > max ? t.order : max, -1);

        const newTask = { id: Date.now(), text, completed: false, order: maxOrder + 1 };
        db.ref('tasks/' + newTask.id).set(newTask);
        taskInput.value = '';
    });
}

// === Відслідковуємо зміни у Firebase ===
db.ref('tasks').on('value', snapshot => {
    const data = snapshot.val() || {};
    const tasks = Object.values(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    renderTasks(tasks);
});

// === Рендер списку завдань з анімаціями ===
function renderTasks(tasks) {
    // Зберігаємо існуючі елементи для визначення змін
    const oldItems = {};
    Array.from(taskList.children).forEach(li => oldItems[li.dataset.id] = li);

    taskList.innerHTML = '';

    tasks.forEach(task => {
        let li = oldItems[task.id];
        const isNew = !li;

        if (!li) {
            li = document.createElement('li');
            li.dataset.id = task.id;
        }

        li.classList.toggle('completed', task.completed);

        // Підсвітка змін
        if (isNew) {
            li.classList.add('highlight');
            setTimeout(() => li.classList.remove('highlight'), 800);
        }

        // Оновлюємо вміст
        li.innerHTML = '';
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
            if (newText && newText.trim() !== '')
                db.ref('tasks/' + task.id).update({ text: newText.trim() });
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
    });

    // === Drag-n-Drop з анімацією ===
    Sortable.create(taskList, {
        animation: 200,
        onEnd: function () {
            const newOrder = Array.from(taskList.children).map(li => li.dataset.id);
            newOrder.forEach((id, index) => {
                db.ref('tasks/' + id).update({ order: index });
            });
        }
    });
}

// === Слухаємо події кнопки та Enter ===
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
});

console.log("Firebase:", firebase.apps.length ? "Підключено ✅" : "Немає підключення ❌");
