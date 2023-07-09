import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './Bingo.css';

const socket = io('http://localhost:3000');

const Bingo = () => {
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [bingoCard, setBingoCard] = useState(() => generateBingoCard());
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    socket.on('gameState', (newGameState) => {
      setCalledNumbers(newGameState.calledNumbers);
      setIsMyTurn(newGameState.currentPlayer === socket.id);
      setCurrentPlayer(newGameState.currentPlayer);
    });

    checkForBingo();

    return () => {
      socket.off('gameState');
    };
  }, [bingoCard, calledNumbers]);


  const checkForBingo = () => {
    const markedCard = bingoCard.map(row => row.map(number => calledNumbers.includes(Math.abs(number))));
    const transposedCard = markedCard[0].map((col, i) => markedCard.map(row => row[i]));
    const diagonals = [markedCard, markedCard.slice().reverse()].map(card => card.map((row, i) => row[i]));

    const hasBingo = [...markedCard, ...transposedCard, ...diagonals].some(row => row.every(cell => cell));

    if (hasBingo) {
      socket.emit('bingo');
      alert('게임에서 이겼습니다.');
    }
  };

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
    const number = Math.abs(bingoCard[row][col]);
    setSelectedNumber(number);
    setSelectedCell({ row, col });
  };

  const markNumber = (row, col) => {
    const newCard = [...bingoCard];
    newCard[row][col] *= -1;
    setBingoCard(newCard);
  };

  const callNumber = () => {
    if (isMyTurn && selectedNumber) {
      if (!calledNumbers.includes(selectedNumber)) {
        socket.emit('numberCalled', selectedNumber);
        setSelectedNumber(null);
        setSelectedCell(null);
      }
    }
  };

  return (
    <div className="Bingo">
      <div className="bingo-card">
        {bingoCard.map((row, rowIndex) => (
          row.map((number, colIndex) => {
            const isSelected = calledNumbers.includes(Math.abs(number));
            const isHighlighted = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`bingo-cell${isSelected ? ' selected' : ''}${isHighlighted ? ' highlighted' : ''}`}
                onClick={() => {
                  onClickNumber(rowIndex, colIndex);
                  markNumber(rowIndex, colIndex);
                }}
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

      <div className="turn-indicator">
        <h2>현재 차례: {currentPlayer === socket.id ? '나' : '상대방'}</h2>
      </div>

      <button className="call-number-button" onClick={callNumber}>숫자 선택 완료</button>
    </div>
  );
};

export default Bingo;
