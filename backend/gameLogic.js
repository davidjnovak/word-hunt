const fs = require('fs').promises;
const path = require('path');

class WordHuntGame {
  constructor() {
    this.allEnglishWords = new Set();
    this.tenLetterWords = [];
    this.commonLetters = 'ETAOINSHRDLUCMWFGYPBVKJXQZ';
    this.weights = {
      'E': 13, 'T': 9, 'A': 8, 'O': 8, 'I': 7, 'N': 7, 'S': 6, 'H': 6, 'R': 6,
      'D': 4, 'L': 4, 'U': 3, 'C': 3, 'M': 3, 'W': 2, 'F': 2, 'G': 2, 'Y': 2,
      'P': 2, 'B': 1, 'V': 1, 'K': 1, 'J': 1, 'X': 1, 'Q': 1, 'Z': 1
    };
    this.weightedLetters = this.generateWeightedLetters();
  }

  async loadDictionary() {
    try {
      const data = await fs.readFile(path.join(__dirname, 'englishwords.txt'), 'utf8');
      this.allEnglishWords = new Set(data.split('\n').map(word => word.trim().toUpperCase()));
      this.tenLetterWords = [...this.allEnglishWords].filter(word => word.length === 10);
      console.log("Dictionary loaded successfully");
    } catch (error) {
      console.error("Error loading dictionary:", error);
    }
  }

  generateWeightedLetters() {
    return Object.entries(this.weights).flatMap(([letter, weight]) => Array(weight).fill(letter));
  }

  generateBoard() {
    const board = Array(4).fill().map(() => Array(4).fill(''));
    
    if (this.tenLetterWords.length > 0) {
      const word = this.tenLetterWords[Math.floor(Math.random() * this.tenLetterWords.length)];
      console.log(`Inserting word: ${word}`);

      const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      let row = Math.floor(Math.random() * 4);
      let col = Math.floor(Math.random() * 4);
      board[row][col] = word[0];
      const usedPositions = [[row, col]];

      for (let i = 1; i < word.length; i++) {
        const possibleMoves = directions
          .map(([dr, dc]) => [row + dr, col + dc])
          .filter(([r, c]) => r >= 0 && r < 4 && c >= 0 && c < 4 && board[r][c] === '');

        if (possibleMoves.length === 0) {
          console.log("Failed to place the word.");
          return this.generateBoard();
        }

        [row, col] = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        board[row][col] = word[i];
        usedPositions.push([row, col]);
      }
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === '') {
          board[i][j] = this.weightedLetters[Math.floor(Math.random() * this.weightedLetters.length)];
        }
      }
    }

    return board;
  }

  findAllValidWords(board) {
    const validWords = [];
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

    const dfs = (i, j, word, visited) => {
      if (word.length === 10) return;

      word += board[i][j];
      visited.add(`${i},${j}`);

      if (this.allEnglishWords.has(word) && !validWords.includes(word)) {
        validWords.push(word);
      }

      for (const [di, dj] of directions) {
        const ni = i + di, nj = j + dj;
        if (ni >= 0 && ni < 4 && nj >= 0 && nj < 4 && !visited.has(`${ni},${nj}`)) {
          dfs(ni, nj, word, new Set(visited));
        }
      }
    };

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        dfs(i, j, '', new Set());
      }
    }

    return validWords;
  }

  calculateScore(words) {
    const scoringTable = {
      3: 100, 4: 400, 5: 800, 6: 1400, 7: 1800, 8: 2200, 9: 2600
    };

    return words.reduce((score, word) => {
      const length = word.length;
      return score + (length > 9 ? 2600 : (scoringTable[length] || 0));
    }, 0);
  }

  validateWord(word, board) {
    if (!this.allEnglishWords.has(word.toUpperCase())) return false;

    const used = new Set();
    const dfs = (i, j, index) => {
      if (index === word.length) return true;
      if (i < 0 || i >= 4 || j < 0 || j >= 4 || used.has(`${i},${j}`)) return false;
      if (board[i][j].toUpperCase() !== word[index].toUpperCase()) return false;

      used.add(`${i},${j}`);
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          if (dfs(i + di, j + dj, index + 1)) return true;
        }
      }
      used.delete(`${i},${j}`);
      return false;
    };

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (dfs(i, j, 0)) return true;
      }
    }
    return false;
  }
}

module.exports = WordHuntGame;