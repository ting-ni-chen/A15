/*設定狀態*/
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}
/*先處理花色 Symbols 常數儲存的資料不會變動所以用大寫 S*/
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

/*getCardElement負責生成卡片內容，包括花色和數字*/
const view = {
  /*getCardElement(index) {
    return `<div class="card back"></div>`渲染牌背元件*/
  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>`/*在元素上設定 data-set*/
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1) /*運算數字時呼叫 transformNumber*/
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <div class="card">
        <p>${number}</p>
        <img src="${symbol}" />
        <p>${number}</p>
      </div>`
  },
 
/*特殊數字轉換 A J Q K */
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
/*displayCards負責選出 #cards 並抽換內容，用 map 迭代陣列，並依序將數字丟進 view.getCardElement()，會變成有 52 張卡片的陣列；
  接著要用 join("") 把陣列合併成一個大字串，才能當成 HTML template 來使用；
  把組合好的 template 用 innerHTML 放進 #cards 元素裡。 */
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  /*view 中新增 flipCard 翻牌函式*/
  flipCards(...cards) { /*...參數轉變成一個陣列來迭代*/
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }

      card.classList.add('back')
      card.innerHTML = null
    })
  },
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  renderScore(score){
    document.querySelector('.score').textContent = `Score: ${score}`
  },
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `You've tried: ${times} times`
  },
  appendWrongAnimation(...cards) { /*為卡片加入 .wrong 類別 */
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div)
  }
}
/*宣告Model,Model是集中管理資料的地方*/
const model = {
  revealedCards: [],
  isRevealedCardsMatched() { /*檢查配對*/
  return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,/*屬於資料管理 放入model內*/

  triedTimes: 0

}
/*controller 來呼叫 utility.getRandomNumberArray，避免 view 和 utility 產生接觸*/
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  /*多個遊戲狀態，用 switch 取代 if/else */
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes((++model.triedTimes)) /*有翻到第二張就要+1 ++要放前面 */
        view.flipCards(card)
        model.revealedCards.push(card)
        /*判斷配對是否成功*/
        if (model.isRevealedCardsMatched()) {
          /*配對成功*/
          view.renderScore((model.score += 10)) /*配對成功才要+10 */
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          /* 配對失敗*/
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)  // add this
          setTimeout(this.resetCards, 1000) /*setTimeout第一個值要回傳 function本身 */
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },
  /*set time out變成一個 function 比較不會亂*/
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits /* 放到controller*/
  }
}
/* Fisher-Yates Shuffle 洗牌演算法*/
/* utility 概念像是外掛函式庫*/
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()) /*生成連續數字陣列 */
    for (let index = number.length - 1; index > 0; index--) { /*取出最後一項 */
      let randomIndex = Math.floor(Math.random() * (index + 1)) /*找到一個隨機項目 */
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]/*交換陣列元素 */
    }
    return number
  }
}

controller.generateCards()
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => { /*放入監聽器 ，讓使用者點擊卡牌時，呼叫 flipCard(card)*/
    controller.dispatchCardAction(card) /*// 取代 view.displayCards()*/
  })
})