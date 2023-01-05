import { theme } from './index.js'

const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const suits = ['♦', '♥', '♠', '♣'];

export default class Deck {
    constructor(cards = makeDeck()) {
        this.cards = cards;
    }
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));
            const temp = this.cards[i];

            this.cards[i] = this.cards[j];
            this.cards[j] = temp;
        }
    }
}

function makeDeck() {
    return suits.flatMap(suit => {
        return values.map(value => {
            return new Card(value, suit);
        });
    });
}

class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
        this.faceup = false;
    }
    get color() {
        return this.suit === '♣' || this.suit === '♠' ? 'black' : 'red';
    }
    getHTML(height, width) {
        const cardDiv = document.createElement('div');
        cardDiv.setAttribute('id', `${this.value}${this.suit}`);

        if (this.faceup) {
            cardDiv.innerText = this.suit;
            cardDiv.classList.add('card', `${this.color}-color${theme}`, height, width);
            if (this.select) cardDiv.classList.add('selected');
            return cardDiv;

        } else {
            cardDiv.classList.add('cardback', `cardback${theme}`, height);
            return cardDiv;
        }
    }
}