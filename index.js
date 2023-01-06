import Deck from './deck.js'

const valuePairs = {
    A: 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    J: 11,
    Q: 12,
    K: 13,
}

const foundations = {
    '♥': [],
    '♣': [],
    '♦': [],
    '♠': [],
}

const board = {
    'column0': [],
    'column1': [],
    'column2': [],
    'column3': [],
    'column4': [],
    'column5': [],
    'column6': [],
}

let theme = '-brick';

let moves = 0;
let score = 0;
let passes = 0;

const columnsIds = Object.keys(board);
const columns = Object.values(board);
const foundationSuits = Object.keys(foundations);
const foundationArrays = Object.values(foundations);

let stockdown = [];
let stockup = [];

let easyMode = true;

const d = document;

const stockId = d.getElementById('stock');
const stockdownId = d.getElementById('stockdown');
const stockupId = d.getElementById('stockup');

stockId.appendChild(stockdownId);
stockId.appendChild(stockupId);

//===== DEAL STOCK =====//

stockdownId.addEventListener('click', () => dealStock());

function dealStock() {
    const down = stockdown;
    let stockCards = [];
    // Hard mode find if 1, 2 or 3 cards left to flip.
    if (!easyMode) {
        if (down.length === 1) {
            stockCards.push(down.pop());
            faceupStockCards(stockCards);
        }
        if (down.length === 2) {
            stockCards = down.splice(down.length - 2, 2);
            faceupStockCards(stockCards);
        }
        if (down.length > 2) {
            stockCards = down.splice(down.length - 3, 3)
            faceupStockCards(stockCards);
        }
    }
    // Easy mode always flip 1 card.
    if (easyMode) {
        stockCards.push(down.pop());
        faceupStockCards(stockCards);
    }

    getStock();
    // Changed displayed number of cardbacks if < 3.
    if (down.length === 1) {
        d.getElementById('stockdown2').classList.remove('cardback', 'cardback' + theme);
        d.getElementById('stockdown3').classList.remove('cardback', 'cardback' + theme);
    }

    if (down.length === 2) {
        d.getElementById('stockdown3').classList.remove('cardback', 'cardback' + theme);
    }
    // If no cards remaining, add reset button.
    if (down.length === 0) {
        cardBackRemove('cardback');
        cardBackRemove('cardback' + theme);

        stockId.appendChild(reset.getHTML());
        d.getElementById('reset').addEventListener('click', () => fillStock());
    }

    incrementMoves();
}

function faceupStockCards(cards) {
    cards.map(card => turnFaceup(card));
    cards.map(card => stockup.push(card));
}

const reset = {
    getHTML: function () {
        const resetDiv = d.createElement('div');
        resetDiv.classList.add('reset', 'reset' + theme);
        resetDiv.setAttribute('id', 'reset');
        resetDiv.innerHTML = '↻';
        return resetDiv;
    }
}

function getStock() {
    const up = stockup;
    let newStockCards = [];
    // Find top 3 cards of faceup stock.
    if (up.length === 0) {
        return;
    }
    if (up.length === 1) {
        newStockCards = up.slice(up.length - 1, up.length);
    }
    if (up.length === 2) {
        newStockCards = up.slice(up.length - 2, up.length);
    }
    if (up.length > 2) {
        newStockCards = up.slice(up.length - 3, up.length);
    }

    stockOnclick(newStockCards);
}

function fillStock() {
    if (stockdown.length === 0) {
        stockdown = stockup.splice(0, stockup.length).reverse();

        if (stockdown.length === 0) return;
        // Resets facedown stock pile.
        stockupId.replaceChildren('');
        stockId.removeChild(d.getElementById('reset'));
        cardBackAdd('cardback');
        cardBackAdd('cardback' + theme);

        passes += 1;

        if (easyMode) {
            if (passes >= 1) {
                changeScore(-100);
            }
        }
        if (!easyMode) {
            if (passes >= 4) {
                changeScore(-20);
            }
        }
    }
}

//===== FIND MATCH, STOCK =====//

function stockOnclick(array) {
    // Add onclick event to right most faceup stock card.
    stockupId.replaceChildren(...array.reverse().map((card, index) => card.getHTML(0, 'col' + index)));
    let card = array[0];
    d.getElementById(card.value + card.suit).addEventListener('click', () => findMatchStock(card));
}

function findMatchStock(clickedCard) {

    if (foundations[clickedCard.suit].length === valuePairs[clickedCard.value] - 1) {
        // Find if stock card matches any foundation spaces.
        stockupId.removeChild(d.getElementById(clickedCard.value + clickedCard.suit));

        foundations[clickedCard.suit].push(stockup.pop());
        d.getElementById(clickedCard.suit).appendChild(clickedCard.getHTML());
        d.getElementById(clickedCard.value + clickedCard.suit).addEventListener('click', () => findMatchFoundation(clickedCard));

        getStock();
        incrementMoves();
        changeScore(10);
        win();
        return;
    }

    const matchingCard = findMatchingCard(clickedCard);

    if (matchingCard) {
        // Find if stock card matches any front row cards on board.
        removeCards(columns, columnsIds);

        let matchingArrayIndex = columns.map(array => array.includes(matchingCard)).indexOf(true);
        stockupId.removeChild(d.getElementById(clickedCard.value + clickedCard.suit));

        columns[matchingArrayIndex].push(stockup.pop());

        changeScore(5);
        renderAfterStock();
    }

    if (clickedCard.value === 'K') {
        // Find if stock card is a king and there's an empty board space.
        const emptyColumn = columns.map(array => array.length === 0).indexOf(true);

        if (emptyColumn >= 0) {
            removeCards(columns, columnsIds);

            stockupId.removeChild(d.getElementById(clickedCard.value + clickedCard.suit));
            columns[emptyColumn].push(stockup.pop());

            renderAfterStock();
        }
    }
}

function renderAfterStock() {
    // Reset board after found match.
    getStock();
    renderCards();
    incrementMoves();
    return;
}

//*** FIND MATCH, BOARD ***//

function boardOnclick() {
    // Add onclick event to all face up cards on board.
    getFaceupCards().map((card) => {

        d.getElementById(card.value + card.suit).addEventListener('click', () => {

            findMatchBoard(card, columns.map(array => array.includes(card)).indexOf(true));
        });
    });
}

function findMatchBoard(clickedCard, clickedArrayIndex) {

    const clickedArray = columns[clickedArrayIndex];
    const clickedCardIndex = clickedArray.indexOf(clickedCard);

    if (foundations[clickedCard.suit].length === valuePairs[clickedCard.value] - 1) {
        // Find if clicked card matches any foundation spaces.
        if (clickedCardIndex + 1 === clickedArray.length) {
            removeCards(columns, columnsIds);

            foundations[clickedCard.suit].push(clickedArray.pop());
            d.getElementById(clickedCard.suit).appendChild(clickedCard.getHTML());
            d.getElementById(clickedCard.value + clickedCard.suit).addEventListener('click', () => findMatchFoundation(clickedCard));

            renderAfterBoard(clickedArray);
            changeScore(10);
            win();
        }
    }

    const matchingCard = findMatchingCard(clickedCard);

    if (matchingCard) {
        // Find if clicked card matches any front row cards on board.
        removeCards(columns, columnsIds);

        const matchingArrayIndex = columns.map(array => array.includes(matchingCard)).indexOf(true);
        columns[matchingArrayIndex].push(...clickedArray.splice(clickedCardIndex, clickedArray.length));

        changeScore(3);
        renderAfterBoard(clickedArray);
    }

    if (clickedCard.value === 'K') {
        // Find if clicked card is a king and there's an empty board space.
        const emptyColumn = columns.map(array => array.length === 0).indexOf(true);

        if (emptyColumn >= 0) {
            removeCards(columns, columnsIds);

            columns[emptyColumn].push(...clickedArray.splice(clickedCardIndex, clickedArray.length));

            renderAfterBoard(clickedArray);
        }
    }
}

function findMatchingCard(clicked) {

    const valueMatches = getFrontCards(columns).filter(card => valuePairs[card.value] === valuePairs[clicked.value] + 1);
    // Returns clicked card object if a matching card is found.
    return valueMatches.filter(card => {
        if (clicked.color === 'black') {
            return card.color === 'red';
        } else {
            return card.color === 'black';
        }
    }).pop();
}

function newFaceupCard(array) {
    // Turns front row cards faceup if not already.
    if (array.length > 0 && array[array.length - 1].faceup === false) {
        let newFaceupCard = array[array.length - 1];
        turnFaceup(newFaceupCard);
        changeScore(5);
    }
}

function renderAfterBoard(array) {
    // Resets board after found match.
    newFaceupCard(array);
    renderCards();
    incrementMoves();
    return;
}

//*** FIND MATCH, FOUNDATIONS ***//

function foundationOnclick() {
    // Adds onclick event to front cards of foundations.
    getFrontCards(foundationArrays).map(card => {
        d.getElementById(card.value + card.suit).addEventListener('click', () => {
            findMatchFoundation(card);
        });
    });
}

function findMatchFoundation(clickedCard) {

    const matchingCard = findMatchingCard(clickedCard);

    if (matchingCard) {
        // Find if foundation card matches any front row cards on board.
        removeCards(columns, columnsIds);
        removeCards(foundationArrays, foundationSuits);

        let matchingArrayIndex = columns.map(array => array.includes(matchingCard)).indexOf(true);
        columns[matchingArrayIndex].push(foundations[clickedCard.suit].pop());

        changeScore(-15);
        renderAfterFoundation();
    }

    if (clickedCard.value === 'K') {
        // Find if foundation card is king and there's an empty board space.
        const emptyColumn = columns.map(array => array.length === 0).indexOf(true);

        if (emptyColumn >= 0) {
            removeCards(columns, columnsIds);
            removeCards(foundationArrays, foundationSuits);

            columns[emptyColumn].push(foundations[clickedCard.suit].pop());

            changeScore(-15);
            renderAfterFoundation();
        }
    }
}

function renderAfterFoundation() {
    // Resets board after match.
    renderFoundations();
    renderCards();
    incrementMoves();
    return;
}

//===== RENDER FUNCTIONS =====//

function renderCards() {
    columns.map((array, index) => loopArrays(array, index));
    boardOnclick();
}

function loopArrays(array, index) {
    for (let i = 0; i < array.length; i++) {
        d.getElementById(columnsIds[index]).appendChild(array[i].getHTML(`row${[i]}`));
    }
}

function renderFoundations() {
    foundationSuits.map(suit => {
        foundations[suit].map(card =>
            d.getElementById(suit).appendChild(card.getHTML()));
    });
    foundationOnclick();
}

function removeCards(arrays, ids) {
    arrays.map((array, index) => removeArrays(array, index, ids));
}

function removeArrays(array, index, id) {
    for (let i = 0; i < array.length; i++) {
        let cardDiv = array[i].value + array[i].suit;
        d.getElementById(id[index]).removeChild(d.getElementById(cardDiv));
    }
}

//===== MISC FUNCTIONS =====//

function incrementMoves() {
    moves += 1;
    d.getElementById('moves').innerHTML = moves;
}

function changeScore(amount) {
    score += amount;
    d.getElementById('score').innerHTML = score;
}

function turnFaceup(card) {
    card.faceup = true;
}

function getFrontCards(arrays) {
    return arrays.flatMap(array => array.slice(array.length - 1, array.length));
}

function getFaceupCards() {
    return columns.flatMap(array => array.filter(card => card.faceup === true));
}

function faceupBoard() {
    columns.map(array => turnFaceup(array[array.length - 1]));
}

function win() {
    let total = 0;
    foundationArrays.map(array => total += array.length);
    if (total === 52) {
        alert('YOU WIN');
    }
}

//===== GAME START =====//

function startGame() {
    const deck = new Deck();
    deck.shuffle();

    for (let i = 0; i < 7; i++) {
        for (let j = i; j < 7; j++) {
            columns[j].push(deck.cards.pop());
        }
    }
    stockdown = deck.cards;

    cardBackAdd('cardback');
    cardBackAdd('cardback' + theme);
    applyTheme(theme);
    faceupBoard();
    renderCards();
}

function newGame() {
    removeCards(columns, columnsIds);
    columns.map(array => array.splice(0, array.length));
    foundationArrays.map(array => array.splice(0, array.length));
    foundationSuits.map(suit => d.getElementById(suit).replaceChildren(suit));
    stockdownId.replaceChildren('');
    stockupId.replaceChildren('');

    if (d.getElementById('reset')) {
        stockId.removeChild(d.getElementById('reset'));
    }

    moves = 0;
    score = 0;
    passes = 0;
    stockdown = [];
    stockup = [];

    d.getElementById('score').innerHTML = score;
    d.getElementById('moves').innerHTML = moves;

    startGame();
}

//===== MODAL =====//

const startNew = d.getElementById('newgame');
const modalNew = d.getElementById('main-modal');
const spanNew = d.getElementsByClassName('close-new')[0];

startNew.onclick = () => {
    modalNew.style.display = 'block';
}
spanNew.onclick = () => {
    modalNew.style.display = 'none';
}

const themeBtn = d.getElementById('theme-btn');
const modalTheme = d.getElementById('theme-modal');
const spanTheme = d.getElementsByClassName('close-theme')[0];

themeBtn.onclick = () => {
    modalTheme.style.display = 'block';
}
spanTheme.onclick = () => {
    modalTheme.style.display = 'none';
}

window.onclick = function (event) {
    if (event.target == modalTheme) {
        modalTheme.style.display = 'none';
    }
    if (event.target == modalNew) {
        modalNew.style.display = 'none';
    }
}

const easyGame = d.getElementById('easy-game');
const hardGame = d.getElementById('hard-game');

easyGame.onclick = () => {
    easyMode = true;
    modalNew.style.display = 'none';
    newGame();
}
hardGame.onclick = () => {
    easyMode = false;
    modalNew.style.display = 'none';
    newGame();
}

//===== THEMES =====//

d.getElementById('container-brick').onclick = () => removeTheme('-brick');
d.getElementById('container-wave').onclick = () => removeTheme('-wave');
d.getElementById('container-checker').onclick = () => removeTheme('-checker');

const elementId = ['header', 'foundations', 'title', 'container', 'sidebar', 'theme-btn', 'newgame', 'newtext', 'hard-game', 'easy-game', 'start-bg', 'start-bg2', 'easy3', 'easy4', 'hard3', 'hard4'];
const eleClasses = ['text', 'column', 'foundation', 'start'];

function cardBackAdd(cardback) {
    d.getElementById('stockdown').classList.add(cardback);
    d.getElementById('stockdown2').classList.add(cardback);
    d.getElementById('stockdown3').classList.add(cardback);
}

function cardBackRemove(cardback) {
    d.getElementById('stockdown').classList.remove(cardback);
    d.getElementById('stockdown2').classList.remove(cardback);
    d.getElementById('stockdown3').classList.remove(cardback);
}

function removeClassTheme(ele, theme) {
    for (let i = 0; i < d.getElementsByClassName(ele).length; i++) {
        d.getElementsByClassName(ele)[i].classList.remove(ele + theme);
    }
}
function addClassTheme(ele, theme) {
    for (let i = 0; i < d.getElementsByClassName(ele).length; i++) {
        d.getElementsByClassName(ele)[i].classList.add(ele + theme);
    }
}

function removeTheme(newTheme) {

    elementId.map(ele => d.getElementById(ele).classList.remove(ele + theme));
    eleClasses.map(ele => removeClassTheme(ele, theme));

    removeCards(columns, columnsIds);
    removeCards(foundationArrays, foundationSuits);
    cardBackRemove('cardback' + theme);
    applyTheme(newTheme);

    theme = newTheme;

    if (stockdown.length === 0) {
        stockId.removeChild(d.getElementById('reset'));
        stockId.appendChild(reset.getHTML());
        d.getElementById('reset').addEventListener('click', () => fillStock());
    }

    renderFoundations();
    renderCards();
    getStock();

    modalTheme.style.display = 'none';
}

function applyTheme(theme) {

    elementId.map(ele => d.getElementById(ele).classList.add(ele + theme));
    eleClasses.map(ele => addClassTheme(ele, theme));

    if (stockdown.length > 0) {
        cardBackAdd('cardback' + theme);
    }
}

modalNew.style.display = 'block';

applyTheme(theme);

export { theme };
