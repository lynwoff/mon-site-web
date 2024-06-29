document.addEventListener('DOMContentLoaded', function() {
    // Récupération des éléments du DOM
    const taskInput = document.getElementById('taskInput');
    const taskDateTime = document.getElementById('taskDateTime');
    const taskCategory = document.getElementById('taskCategory');
    const addTaskButton = document.getElementById('addTaskButton');
    const searchInput = document.getElementById('searchInput');
    const calendarEl = document.getElementById('calendar');
    const taskListItems = document.getElementById('taskListItems');
    const completedTaskListItems = document.getElementById('completedTaskListItems');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Variables de suivi des tâches
    let totalTasks = 0;
    let completedTasks = 0;
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Initialisation du calendrier FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        editable: true,
        selectable: true,
        select: handleDateSelect, // Fonction de gestion de la sélection de date
        eventClick: handleEventClick // Fonction de gestion du clic sur un événement
    });

    calendar.render();

    // Chargement initial des tâches dans le calendrier depuis localStorage
    tasks.forEach(task => {
        const event = calendar.addEvent({
            id: task.id,
            title: task.title,
            start: task.start,
            end: task.start,
            category: task.category,
            completed: task.completed || false
        });

        if (task.completed) {
            addTaskToCompletedList(event);
        } else {
            addTaskToList(event);
        }
    });

    // Fonction pour ajouter une tâche
    function addTask() {
        const taskText = taskInput.value.trim();
        const taskDueDateTime = taskDateTime.value;
        const category = taskCategory.value;

        if (taskText === '' || taskDueDateTime === '') {
            alert('Veuillez remplir tous les champs pour ajouter une tâche.');
            return;
        }

        const event = calendar.addEvent({
            id: Date.now().toString(),
            title: `${taskText} [${category}]`,
            start: taskDueDateTime,
            end: taskDueDateTime,
            category: category,
            completed: false
        });

        tasks.push({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.start,
            category: category,
            completed: false
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));

        addTaskToList(event);

        taskInput.value = '';
        taskDateTime.value = '';
        taskCategory.value = '';

        updateProgressBar();

        showToast('Tâche ajoutée avec succès!', 'success');
    }

    // Fonction pour ajouter une tâche à la liste des tâches à faire
    function addTaskToList(event) {
        const li = createTaskListItem(event);
        taskListItems.appendChild(li);
        totalTasks++;
        updateProgressBar();
    }

    // Fonction pour ajouter une tâche à la liste des tâches terminées
    function addTaskToCompletedList(event) {
        const li = createTaskListItem(event);
        li.classList.add('completed');
        completedTaskListItems.appendChild(li);
        totalTasks++;
        completedTasks++;
        updateProgressBar();
    }

    // Créer un élément de liste pour une tâche
    function createTaskListItem(event) {
        const li = document.createElement('li');
        li.classList.add('task-item');
        li.setAttribute('data-event-id', event.id);
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${event.extendedProps.completed ? 'checked' : ''}>
            <span>${event.title}</span>
            <span class="task-date">${formatDate(event.start)}</span>
            <button class="delete-button" aria-label="Supprimer la tâche">
                <i class="fas fa-trash"></i>
            </button>
        `;

        const deleteButton = li.querySelector('.delete-button');
        const checkbox = li.querySelector('.task-checkbox');

        deleteButton.addEventListener('click', function() {
            if (confirm("Voulez-vous supprimer cette tâche?")) {
                event.remove();
                removeTaskFromList(event);
                showToast('Tâche supprimée avec succès!', 'success');
            }
        });

        checkbox.addEventListener('change', function() {
            completeTask(event, li, checkbox);
        });

        return li;
    }

    // Supprimer une tâche de la liste des tâches
    function removeTaskFromList(event) {
        const taskIndex = tasks.findIndex(task => task.id === event.id);
        if (taskIndex !== -1) {
            tasks.splice(taskIndex, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        const taskListItem = document.querySelector(`.task-item[data-event-id="${event.id}"]`);
        if (taskListItem) {
            taskListItem.remove();
            totalTasks--;

            if (event.extendedProps.completed) {
                completedTasks--;
            } else {
                updateProgressBar();
            }
        }
    }

    // Fonction pour marquer une tâche comme complétée ou non complétée
    function completeTask(event, taskListItem, checkbox) {
        const taskIndex = tasks.findIndex(task => task.id === event.id);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = checkbox.checked;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        if (checkbox.checked) {
            taskListItem.classList.add('completed');
            completedTaskListItems.appendChild(taskListItem);
            completedTasks++;

            // Supprimer l'événement du calendrier
            event.remove();
        } else {
            taskListItem.classList.remove('completed');
            taskListItems.appendChild(taskListItem);
            completedTasks--;

            // Réajouter l'événement au calendrier sans créer un doublon
            calendar.addEvent({
                id: event.id,
                title: event.title,
                start: event.start,
                end: event.start,
                category: event.extendedProps.category,
                completed: false
            });

            // Mettre à jour l'état de l'événement
            event.setProp('completed', false);
        }

        updateProgressBar();
    }

    // Fonction pour formater la date
    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
        return new Date(date).toLocaleDateString('fr-FR', options);
    }

    // Fonction de gestion de la sélection de date dans le calendrier
    function handleDateSelect(info) {
        const title = prompt('Nom de la tâche:');
        if (title) {
            const event = {
                id: Date.now().toString(),
                title: title,
                start: info.startStr,
                end: info.endStr || info.startStr,
                category: 'travail',
                completed: false
            };

            tasks.push(event);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            calendar.addEvent(event);
            addTaskToList(event);
            showToast('Tâche ajoutée avec succès!', 'success');
        } else {
            calendar.unselect();
        }
    }

    // Fonction de gestion du clic sur un événement dans le calendrier
    function handleEventClick(clickedInfo) {
        const event = clickedInfo.event;
        if (confirm(`Voulez-vous supprimer la tâche "${event.title}"?`)) {
            event.remove();
            removeTaskFromList(event);
            showToast('Tâche supprimée avec succès!', 'success');
        }
    }

    // Fonction pour mettre à jour la barre de progression
    function updateProgressBar() {
        if (totalTasks > 0) {
            const progress = Math.round((completedTasks / totalTasks) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        } else {
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }
    }

    // Fonction pour afficher une notification toast
    function showToast(message, type) {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: 'bottom', // Position de la notification
            backgroundColor: type === 'error' ? '#dc3545' : '#28a745' // Couleur basée sur le type de notification
        }).showToast();
    }

    // Filtrer les tâches par nom
    searchInput.addEventListener('input', function() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const taskItems = taskListItems.querySelectorAll('.task-item');

        taskItems.forEach(item => {
            const title = item.querySelector('span').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Ajouter une tâche lorsque le bouton Ajouter est cliqué
    addTaskButton.addEventListener('click', addTask);

    // Charger les tâches initiales depuis localStorage
    function loadTasks() {
        tasks.forEach(task => {
            const event = {
                id: task.id,
                title: task.title,
                start: task.start,
                end: task.start,
                category: task.category,
                completed: task.completed || false
            };

            if (task.completed) {
                addTaskToCompletedList(event);
            } else {
                addTaskToList(event);
            }
        });
    }

    // Chargement initial des tâches
    loadTasks();
});


// Sélectionnez l'élément bouton d'information dans votre script.js
const infoButton = document.getElementById('infoButton');

// Fonction pour afficher les informations
function showInformation() {
    const information = `
        Comment fonctionne ce site ?
        Cet agenda To-Do List vous permet de gérer vos tâches de manière simple et efficace :
        
            -Ajoutez une tâche en remplissant le formulaire ci-dessus.
            -Les tâches ajoutées apparaissent dans la liste "Tâches à faire" ainsi que dans le calendriers.
            -Cochez une tâche pour la marquer comme terminée.
            -Les tâches terminées sont déplacées vers la liste "Tâches terminées".
            -Vous pouvez filtrer les tâches en utilisant le champ de recherche.
            -Utilisez le calendrier pour visualiser et gérer vos tâches par date.
        
        Profitez de votre gestion de tâches!
    `;
    
    Toastify({
        text: information,
        duration: 10000, // 10 secondes
        gravity: "top",
        backgroundColor: "linear-gradient(to right, #ff416c, #ff4b2b)",
        close: true
    }).showToast();
}

// Gestionnaire d'événements pour le bouton d'information
infoButton.addEventListener('click', showInformation);
