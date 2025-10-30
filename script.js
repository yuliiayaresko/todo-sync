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

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

function highlightTask(li) {
	li.classList.add("highlight");
	setTimeout(() => li.classList.remove("highlight"), 800);
}

function createTaskElement(task) {
	const li = document.createElement("li");
	li.dataset.id = task.id;
	if (task.completed) li.classList.add("completed");

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = task.completed;
	checkbox.addEventListener("change", () =>
		db.ref("tasks/" + task.id).update({
			completed: !task.completed,
			lastAction: "toggle",
			changedAt: Date.now()
		})
	);

	const span = document.createElement("span");
	span.className = "task-text";
	span.textContent = task.text;

	const actions = document.createElement("div");
	actions.className = "actions";

	const editBtn = document.createElement("button");
	editBtn.textContent = "✏️";
	editBtn.className = "edit-btn";
	editBtn.addEventListener("click", () => {
		const newText = prompt("Редагувати завдання:", task.text);
		if (newText && newText.trim() !== "")
			db.ref("tasks/" + task.id).update({
				text: newText.trim(),
				lastAction: "edit",
				changedAt: Date.now()
			});
	});

	const delBtn = document.createElement("button");
	delBtn.textContent = "🗑️";
	delBtn.className = "delete-btn";
	delBtn.addEventListener("click", () =>
		db.ref("tasks/" + task.id).remove()
	);

	actions.appendChild(editBtn);
	actions.appendChild(delBtn);
	li.appendChild(checkbox);
	li.appendChild(span);
	li.appendChild(actions);
	return li;
}

function addTask() {
	const text = taskInput.value.trim();
	if (!text) return;
	const id = Date.now().toString();
	const now = Date.now();
	db.ref("tasks/" + id).set({
		id,
		text,
		completed: false,
		order: now,
		lastAction: "add",
		changedAt: now
	});
	taskInput.value = "";
}

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") addTask();
});

db.ref("tasks").on("value", (snapshot) => {
	const data = snapshot.val() || {};
	const tasks = Object.values(data).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	tasks.forEach((task) => {
		let li = document.querySelector(`li[data-id="${task.id}"]`);
		if (!li) {
			li = createTaskElement(task);
			taskList.appendChild(li);
			highlightTask(li);
		}

		const textSpan = li.querySelector(".task-text");
		textSpan.textContent = task.text;
		li.querySelector("input[type='checkbox']").checked = task.completed;
		li.classList.toggle("completed", task.completed);

		if (!li.dataset.lastChange || li.dataset.lastChange != task.changedAt) {
			if (task.lastAction && task.lastAction !== "none") highlightTask(li);
			li.dataset.lastChange = task.changedAt;
		}
	});

	Array.from(taskList.children).forEach((li) => {
		if (!tasks.find((t) => t.id === li.dataset.id)) li.remove();
	});

	const currentIds = Array.from(taskList.children).map((li) => li.dataset.id);
	const correctIds = tasks.map((t) => t.id);
	if (JSON.stringify(currentIds) !== JSON.stringify(correctIds)) {
		const positions = {};
		Array.from(taskList.children).forEach(
			(li) => (positions[li.dataset.id] = li.getBoundingClientRect().top)
		);
		tasks.forEach((task) => {
			const li = document.querySelector(`li[data-id="${task.id}"]`);
			if (li) taskList.appendChild(li);
		});
		requestAnimationFrame(() => {
			Array.from(taskList.children).forEach((li) => {
				const oldTop = positions[li.dataset.id] || 0;
				const newTop = li.getBoundingClientRect().top;
				const delta = oldTop - newTop;
				if (Math.abs(delta) > 3) {
					li.style.transform = `translateY(${delta}px)`;
					requestAnimationFrame(() => (li.style.transform = ""));
				}
			});
		});
	}

	initSortable();
});

function initSortable() {
	if (window.sortable) window.sortable.destroy();
	window.sortable = Sortable.create(taskList, {
		animation: 200,
		ghostClass: "sortable-ghost",
		fallbackOnBody: true,
		swapThreshold: 0.65,
		onEnd: function (evt) {
			const items = Array.from(taskList.children);
			const movedId = evt.item.dataset.id;
			const updates = {};
			const now = Date.now();
			items.forEach((li, i) => {
				updates[`tasks/${li.dataset.id}/order`] = i;
				if (li.dataset.id === movedId) {
					updates[`tasks/${li.dataset.id}/lastAction`] = "move";
					updates[`tasks/${li.dataset.id}/changedAt`] = now;
				}
			});
			db.ref().update(updates);
		},
	});
}
