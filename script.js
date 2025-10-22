class SudokuGame {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.initialBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        this.selectedCell = null;
        this.errors = 0;
        this.timer = 0;
        this.timerInterval = null;
        
        this.init();
    }

    init() {
        this.createBoard();
        this.attachEventListeners();
        this.loadTheme();
        this.newGame();
    }

    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell editable';
            cell.dataset.index = i;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.dataset.index = i;
            
            input.addEventListener('input', (e) => this.handleInput(e));
            input.addEventListener('focus', (e) => this.handleCellFocus(e));
            input.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            cell.appendChild(input);
            boardElement.appendChild(cell);
        }
    }

    attachEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('check').addEventListener('click', () => this.checkSolution());
        document.getElementById('hint').addEventListener('click', () => this.giveHint());
        document.getElementById('solve').addEventListener('click', () => this.solvePuzzle());
        document.getElementById('difficulty').addEventListener('change', () => this.newGame());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
    }

    newGame() {
        this.stopTimer();
        this.errors = 0;
        this.timer = 0;
        this.updateErrors();
        this.updateTimer();
        this.clearMessage();
        
        // Generate a complete valid Sudoku board
        this.generateSolution();
        
        // Create puzzle by removing numbers based on difficulty
        const difficulty = document.getElementById('difficulty').value;
        const cellsToRemove = {
            'easy': 30,
            'medium': 40,
            'hard': 50
        }[difficulty];
        
        this.createPuzzle(cellsToRemove);
        this.renderBoard();
        this.startTimer();
    }

    generateSolution() {
        // Initialize empty board
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        
        // Fill the board using backtracking
        this.solveSudoku(this.solution);
    }

    solveSudoku(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true; // Puzzle solved
        
        const [row, col] = empty;
        const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (let num of numbers) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }

    findEmpty(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    isValid(board, row, col, num) {
        // Check row
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        
        // Check column
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        
        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }

    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    createPuzzle(cellsToRemove) {
        // Copy solution to board and initialBoard
        this.board = this.solution.map(row => [...row]);
        
        // Remove numbers randomly
        let removed = 0;
        while (removed < cellsToRemove) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
        
        this.initialBoard = this.board.map(row => [...row]);
    }

    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            const input = cell.querySelector('input');
            
            if (value !== 0) {
                input.value = value;
                cell.classList.add('fixed');
                cell.classList.remove('editable');
                input.disabled = true;
            } else {
                input.value = '';
                cell.classList.remove('fixed');
                cell.classList.add('editable');
                input.disabled = false;
            }
            
            cell.classList.remove('error', 'correct', 'highlight');
        });
    }

    handleInput(e) {
        const input = e.target;
        const value = input.value;
        
        // Only allow numbers 1-9
        if (value && !/^[1-9]$/.test(value)) {
            input.value = '';
            return;
        }
        
        const index = parseInt(input.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        this.board[row][col] = value ? parseInt(value) : 0;
        
        // Check if the move is valid
        if (value) {
            const cell = input.parentElement;
            if (this.isValid(this.board, row, col, parseInt(value))) {
                cell.classList.remove('error');
                cell.classList.add('correct');
            } else {
                cell.classList.add('error');
                cell.classList.remove('correct');
                this.errors++;
                this.updateErrors();
            }
            
            // Check if puzzle is complete
            if (this.isPuzzleComplete()) {
                this.handleWin();
            }
        }
    }

    handleCellFocus(e) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.remove('selected'));
        e.target.parentElement.classList.add('selected');
    }

    handleKeyDown(e) {
        const index = parseInt(e.target.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        let newIndex = index;
        let delta = 0;
        
        switch(e.key) {
            case 'ArrowUp':
                if (row > 0) delta = -9;
                e.preventDefault();
                break;
            case 'ArrowDown':
                if (row < 8) delta = 9;
                e.preventDefault();
                break;
            case 'ArrowLeft':
                if (col > 0) delta = -1;
                e.preventDefault();
                break;
            case 'ArrowRight':
                if (col < 8) delta = 1;
                e.preventDefault();
                break;
            case 'Backspace':
            case 'Delete':
                e.target.value = '';
                this.board[row][col] = 0;
                e.target.parentElement.classList.remove('error', 'correct');
                break;
        }
        
        if (delta !== 0) {
            const inputs = document.querySelectorAll('.cell input');
            let candidate = newIndex + delta;
            // Helper to check bounds respecting row/col edges for left/right
            const inBounds = (from, to, d) => {
                if (d === -1) return Math.floor(from / 9) === Math.floor(to / 9) && to >= 0; // left, same row
                if (d === 1) return Math.floor(from / 9) === Math.floor(to / 9) && to <= Math.floor(from / 9) * 9 + 8; // right, same row
                if (d === -9) return to >= 0; // up
                if (d === 9) return to < 81; // down
                return false;
            };
            while (inBounds(newIndex, candidate, delta)) {
                if (!inputs[candidate].disabled) {
                    newIndex = candidate;
                    break;
                }
                candidate += delta;
            }
            if (newIndex !== index) {
                inputs[newIndex].focus();
            }
        }
    }

    isPuzzleComplete() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) return false;
                if (!this.isValid(this.board, i, j, this.board[i][j])) return false;
            }
        }
        return true;
    }

    checkSolution() {
        let hasErrors = false;
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            
            if (value !== 0 && !cell.classList.contains('fixed')) {
                if (value === this.solution[row][col]) {
                    cell.classList.add('correct');
                    cell.classList.remove('error');
                } else {
                    cell.classList.add('error');
                    cell.classList.remove('correct');
                    hasErrors = true;
                }
            }
        });
        
        if (hasErrors) {
            this.showMessage('Hay algunos errores. Revisa las celdas marcadas en rojo.', 'error');
        } else if (this.isPuzzleComplete()) {
            this.handleWin();
        } else {
            this.showMessage('¡Vas bien! Continúa resolviendo.', 'info');
        }
    }

    giveHint() {
        // Find an empty cell and fill it with the correct value
        const emptyCells = [];
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push([i, j]);
                }
            }
        }
        
        if (emptyCells.length === 0) {
            this.showMessage('No hay más celdas vacías.', 'info');
            return;
        }
        
        const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const index = row * 9 + col;
        const cells = document.querySelectorAll('.cell');
        const input = cells[index].querySelector('input');
        
        this.board[row][col] = this.solution[row][col];
        input.value = this.solution[row][col];
        cells[index].classList.add('highlight');
        cells[index].classList.add('fixed');
        cells[index].classList.remove('editable');
        input.disabled = true;
        
        setTimeout(() => {
            cells[index].classList.remove('highlight');
        }, 2000);
        
        this.showMessage('¡Pista agregada!', 'info');
    }

    solvePuzzle() {
        this.board = this.solution.map(row => [...row]);
        this.renderBoard();
        this.stopTimer();
        this.showMessage('Puzzle resuelto automáticamente.', 'info');
    }

    handleWin() {
        this.stopTimer();
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.showMessage(`¡Felicitaciones! Completaste el Sudoku en ${minutes}:${seconds.toString().padStart(2, '0')} con ${this.errors} errores.`, 'success');
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateErrors() {
        document.getElementById('errors').textContent = this.errors;
    }

    showMessage(text, type) {
        const messageElement = document.getElementById('message');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        
        if (type !== 'success') {
            setTimeout(() => {
                this.clearMessage();
            }, 3000);
        }
    }

    clearMessage() {
        const messageElement = document.getElementById('message');
        messageElement.textContent = '';
        messageElement.className = 'message';
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
        
        // Save theme preference
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            const themeIcon = document.querySelector('.theme-icon');
            themeIcon.textContent = '☀️';
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
