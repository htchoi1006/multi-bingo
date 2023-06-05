import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
// import socket from './socket';
import './Bingo.css';

const socket = io('http://localhost:3000');  

const Bingo = () => {
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [bingoCard, setBingoCard] = useState(generateBingoCard());
  const [isMyTurn, setIsMyTurn] = useState(false);  

  useEffect(() => {
    socket.on('gameState', (newGameState) => {
      setCalledNumbers(newGameState.calledNumbers);
      setIsMyTurn(newGameState.currentPlayer === socket.id);  
    });

    return () => {
      socket.off('gameState');
    };
  }, []);

  function generateBingoCard() {
    const card = [];
    for (let i = 0; i < 5; i++) {
      const column = [];
      for (let j = 0; j < 5; j++) {
        let num;
        do {
          num = Math.floor(Math.random() * 15) + 1 + 15 * i;
        } while (column.includes(num));
        column.push(num);
      }
      card.push(column);
    }
    return card;
  }


  const onClickNumber = (row, col) => {
    const newCard = [...bingoCard];
    const number = newCard[row][col];
    if (number > 0) {  
      callNumber(number);  
    }
    newCard[row][col] *= -1;
    setBingoCard(newCard);
  };


  const callNumber = (number) => {  
    if (isMyTurn) { 
      if (!calledNumbers.includes(number)) {
        socket.emit('numberCalled', number);
      }
    }
  };

  return (
    <div className="Bingo">
      <div className="bingo-card">
        {bingoCard.map((row, rowIndex) => (
          row.map((number, colIndex) => {
            const isSelected = calledNumbers.includes(Math.abs(number)); 
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`bingo-cell${isSelected ? ' selected' : ''}`} 
                onClick={() => onClickNumber(rowIndex, colIndex)}
              >
                {Math.abs(number)}
              </div>
            );
          })
        ))}
      </div>

      <div className="called-numbers">
        <h2>상대가 부른 숫자:</h2>
        {calledNumbers.join(', ')}
      </div>


      <button className="call-number-button" onClick={callNumber}>숫자 선택 완료</button>
    </div>
  );
};

export default Bingo;
