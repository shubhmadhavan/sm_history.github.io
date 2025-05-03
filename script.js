

let eventsData = [];
let usedEvents = [];
let tableCards = [];
let currentQuestion = null;
let strikes = 0;
let score = 0;

// Load events from JSON
async function loadEvents() {
    const response = await fetch('data/dates.json');
    const data = await response.json();
    eventsData = data.events;
    startGame();
}

// Start the game
function startGame() {
    pickStartingCards();
    setupQuestionCard();
    updateTable();
}

// Pick starting table card and question card
function pickStartingCards() {
    const shuffled = [...eventsData].sort(() => 0.5 - Math.random());
    const first = shuffled.pop();
    const second = shuffled.pop();
    usedEvents.push(first, second);

    tableCards.push(first);
    currentQuestion = second;
}

// Setup question card
function setupQuestionCard() {
    const questionEvent = document.getElementById('question-event');
    const questionCard = document.getElementById('question-card');

    if (!currentQuestion) {
        questionEvent.textContent = "";
        questionCard.style.opacity = '0'; // Hide the card
        return;
    }

    questionCard.style.display = 'block'; // Ensure visible if new question

    questionEvent.textContent = currentQuestion.event;
    questionCard.setAttribute('draggable', true);
    
    // Remove old image overlays if any
    const oldImgDiv = questionCard.querySelector('.card-img');
    if (oldImgDiv) oldImgDiv.remove();

    if (currentQuestion.imgUrl) {
        questionCard.style.position = 'relative';

        const imgDiv = document.createElement('div');
        imgDiv.classList.add('card-img');
        imgDiv.style.backgroundImage = `url('data_images/${currentQuestion.imgUrl}')`;
        questionCard.appendChild(imgDiv);
    }

    questionCard.addEventListener('dragstart', dragStart);
}



// Update table with cards and drop zones
// Update table with cards and drop zones
function updateTable() {
    const table = document.getElementById('card-container-table');
    table.innerHTML = '';

    // Add drop zone at start
    table.appendChild(createDropZone(0));

    tableCards.forEach((card, index) => {
        const cardElement = createAnswerCard(card, index);

        // Add 'wrong' class if the card is marked as wrong
        if (card.wrong) {
            cardElement.classList.add('wrong');
        }

        table.appendChild(cardElement);
        table.appendChild(createDropZone(index + 1));
    });


}


// Create a drop zone
function createDropZone(position) {
    const dropZone = document.createElement('div');
    dropZone.classList.add('drop-zone');
    dropZone.dataset.position = position;

    dropZone.addEventListener('dragover', e => e.preventDefault());
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('click', () => {
        handleManualDrop(dropZone.dataset.position);
    });


    return dropZone;
}

// Create an answer card
// Create an answer card
function createAnswerCard(card, index) {
    const cardDiv = document.createElement('div');
    cardDiv.classList.add('card');
    cardDiv.dataset.index = index;

    // Check if imgUrl exists, and if so, set it as the background
    if (card.imgUrl) {
        cardDiv.style.position = 'relative'; // To position the overlay inside the card

        // Create the background image element
        const imgDiv = document.createElement('div');
        imgDiv.classList.add('card-img');
        imgDiv.style.backgroundImage = `url('data_images/${card.imgUrl}')`;

        // Append the image overlay
        cardDiv.appendChild(imgDiv);
    }

    const front = document.createElement('div');
    front.classList.add('card-info');
    front.innerHTML = `<h3>${card.year}</h3><p>${card.event}</p><p>${card.info1}</p>`;

    const back = document.createElement('div');
    back.classList.add('card-info-2', 'hidden');
    back.innerHTML = `<p>${card.info2}</p>`;

    // Add the arrow to the bottom-right of the card
    const arrow = document.createElement('span');
    arrow.classList.add('card-arrow');
    arrow.textContent = '🌐';
    
    // Add the click event to search for the Wikipedia page
    arrow.addEventListener('click', () => {
        const searchQuery = `${card.event} wikipedia`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        window.open(searchUrl, '_blank');
    });

    // Append the arrow to the card
    cardDiv.appendChild(arrow);
    cardDiv.appendChild(front);
    cardDiv.appendChild(back);

    cardDiv.addEventListener('click', () => {
        cardDiv.classList.toggle('hidden');
        front.classList.toggle('hidden');
        back.classList.toggle('hidden');
    });

    return cardDiv;
}




// Handle drag start
function dragStart(e) {
    e.dataTransfer.setData('text/plain', 'dragging');
}


// Check if tableCards are in chronological order
function isOrderCorrect() {
    for (let i = 1; i < tableCards.length; i++) {
        if (new Date(tableCards[i - 1].year) > new Date(tableCards[i].year)) {
            return false;
        }
    }
    return true;
}

// Update hearts display
function updateHearts() {
    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`heart${i}`);
        if (i <= strikes) {
            heart.textContent = '🤍'; // Grey heart
        } else {
   
        }
    }
}

// Pick next question card
function pickNextQuestion() {
    const remaining = eventsData.filter(event => !usedEvents.includes(event));
    
    if (remaining.length === 0) {
        // No next question available
        currentQuestion = null;
        setupQuestionCard(); // Clear or hide question card
        disableDragging();
        setTimeout(() => {
            if (confirm("You've placed all events! Replay?")) {
                location.reload();
            }
        }, 100); // small timeout to let DOM update
        return;
    }

    const next = remaining[Math.floor(Math.random() * remaining.length)];
    usedEvents.push(next);
    currentQuestion = next;
    setupQuestionCard();
}



// Disable dragging after game over
function disableDragging() {
    const questionCard = document.getElementById('question-card');
    questionCard.setAttribute('draggable', false);
}


// Handle drop
function handleDrop(e) {
    e.preventDefault();
    const position = parseInt(e.currentTarget.dataset.position);

    const insertedCard = { ...currentQuestion, wrong: false };
    tableCards.splice(position, 0, insertedCard);

    updateTable();

    if (isOrderCorrect()) {
        score++;
        document.getElementById('score').textContent = `Score: ${score}`;
    } else {
        insertedCard.wrong = true;

        strikes++;
        updateHearts();

        if (strikes >= 3) {
            updateTable();
            setTimeout(() => {
                alert("Game Over! Final Score: " + score);
                disableDragging();
            }, 100);
            return;
        }

        tableCards.sort((a, b) => new Date(a.year) - new Date(b.year));
    }

    pickNextQuestion();
    updateTable();
}



// Handle manual drop
function handleManualDrop(position) {
    position = parseInt(position);
    
    const insertedCard = { ...currentQuestion, wrong: false };
    tableCards.splice(position, 0, insertedCard);

    // Update the table before checking the order
    updateTable();

    if (isOrderCorrect()) {
        score++;
        document.getElementById('score').textContent = `Score: ${score}`;
    } else {
        strikes++;
        updateHearts();

        // Mark the card as wrong and update the table
        insertedCard.wrong = true;

        tableCards.sort((a, b) => new Date(a.year) - new Date(b.year));

        if (strikes >= 3) {
            alert("Game Over! Final Score: " + score);
            disableDragging();
            return;
        }
    }

    pickNextQuestion();
    updateTable();
}





// Start
loadEvents();




