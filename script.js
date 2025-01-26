class GameScoreBoard {
    constructor() {
        this.runners = ['CN', 'Show', 'Rick', 'Apple'];
        this.currentRanking = new Array(4).fill(null);
        this.gameHistory = [];
        this.isGameActive = false;
        this.rankingComplete = false;
        this.rewardSettings = {
            1: 2,
            2: 1,
            3: -1,
            4: -2
        };

        this.initializeEventListeners();
        this.loadRewardSettings();
        this.updateRunnerButtons();
    }

    initializeEventListeners() {
        document.getElementById('newRun').addEventListener('click', () => this.handleNewRun());
        document.getElementById('reset').addEventListener('click', () => this.resetRanking());

        const runnerButtons = document.querySelectorAll('.runner-btn');
        runnerButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleRunnerClick(e));
        });

        const rewardCells = document.querySelectorAll('.reward-cell');
        rewardCells.forEach((cell, index) => {
            cell.addEventListener('input', (e) => this.handleRewardChange(e, index + 1));
            cell.addEventListener('blur', (e) => this.validateRewardCell(e.target));
            cell.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });

        const runnerNameCells = document.querySelectorAll('.runner-name-cell');
        runnerNameCells.forEach((cell, index) => {
            cell.addEventListener('input', (e) => this.handleRunnerNameChange(e, index));
            cell.addEventListener('blur', (e) => this.validateRunnerName(e.target));
            cell.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        });
    }

    handleRunnerNameChange(event, index) {
        const cell = event.target;
        const newName = cell.textContent.trim();
        
        if (newName && newName.length <= 10) {
            const oldName = this.runners[index];
            this.runners[index] = newName;
            cell.classList.remove('invalid');
            
            // Update runner button text only, keep position-based color
            const button = document.querySelector(`.runner-btn[data-position="${index + 1}"]`);
            if (button) {
                button.textContent = newName;
                button.dataset.runner = newName;
            }

            // Update any existing rankings with new name
            const rankCells = document.querySelectorAll('.rank-cell');
            rankCells.forEach(rankCell => {
                if (rankCell.textContent === oldName) {
                    rankCell.textContent = newName;
                }
            });

            // Update score table with new name but keep scores by position
            this.updateScoreTable();
        } else {
            cell.classList.add('invalid');
        }
    }

    validateRunnerName(cell) {
        const name = cell.textContent.trim();
        if (!name || name.length > 10) {
            cell.textContent = cell.dataset.default;
            cell.classList.remove('invalid');
        }
    }

    updateRunnerButtons() {
        const buttons = document.querySelectorAll('.runner-btn');
        buttons.forEach((button, index) => {
            const runner = this.runners[index];
            button.textContent = runner;
            button.dataset.runner = runner;
            button.dataset.position = index + 1;
        });
    }

    loadRewardSettings() {
        const rewardCells = document.querySelectorAll('.reward-cell');
        rewardCells.forEach((cell, index) => {
            cell.textContent = this.rewardSettings[index + 1];
        });
    }

    handleRewardChange(event, rank) {
        const cell = event.target;
        const value = parseInt(cell.textContent);
        
        if (!isNaN(value)) {
            this.rewardSettings[rank] = value;
            cell.classList.remove('invalid');
            this.updateScoreTable();
        } else {
            cell.classList.add('invalid');
        }
    }

    validateRewardCell(cell) {
        const value = parseInt(cell.textContent);
        if (isNaN(value)) {
            const rank = Array.from(cell.parentElement.parentElement.children).indexOf(cell.parentElement) + 1;
            cell.textContent = this.rewardSettings[rank];
            cell.classList.remove('invalid');
        }
    }

    handleNewRun() {
        if (!this.isGameActive) {
            this.startNewRun();
        } else if (this.rankingComplete) {
            this.processCompletedRun();
            this.startNewRun();
        }
    }

    startNewRun() {
        this.isGameActive = true;
        this.rankingComplete = false;
        this.currentRanking = new Array(4).fill(null);
        this.resetTableState();
        this.enableAllRunnerButtons();
    }

    resetRanking() {
        this.startNewRun();
    }

    resetTableState() {
        const rankCells = document.querySelectorAll('.rank-cell');
        rankCells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('filled');
            // Remove position-based classes
            for (let i = 1; i <= 4; i++) {
                cell.classList.remove(`runner-cell-pos-${i}`);
            }
        });
    }

    enableAllRunnerButtons() {
        const runnerButtons = document.querySelectorAll('.runner-btn');
        runnerButtons.forEach(button => {
            button.disabled = false;
        });
    }

    handleRunnerClick(event) {
        if (!this.isGameActive || this.rankingComplete) return;
        
        const button = event.target;
        const runner = button.dataset.runner;
        const position = button.dataset.position;

        const emptyIndex = this.currentRanking.indexOf(null);
        if (emptyIndex !== -1) {
            this.currentRanking[emptyIndex] = position; // Store position instead of runner name
            
            const rankCells = document.querySelectorAll('.rank-cell');
            const cell = rankCells[emptyIndex];
            cell.textContent = runner;
            cell.classList.add('filled');
            cell.classList.add(`runner-cell-pos-${position}`);
            
            button.disabled = true;

            if (!this.currentRanking.includes(null)) {
                this.rankingComplete = true;
            }
        }
    }

    processCompletedRun() {
        // Create a score record using positions
        const scores = {};
        for (let i = 0; i < 4; i++) {
            scores[i + 1] = 0; // Initialize scores for each position (1-4)
        }

        // Calculate scores based on positions
        this.currentRanking.forEach((position, rankIndex) => {
            scores[position] = this.rewardSettings[rankIndex + 1];
        });

        this.gameHistory.unshift(scores);
        this.updateScoreTable();
        this.isGameActive = false;
        this.rankingComplete = false;
    }

    calculateTotalScores() {
        const totals = {};
        // Initialize totals for each position
        for (let i = 0; i < 4; i++) {
            const position = i + 1;
            totals[position] = this.gameHistory.reduce((sum, run) => sum + (run[position] || 0), 0);
        }
        return totals;
    }

    getSortedPositions() {
        const totals = this.calculateTotalScores();
        return Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
    }

    updateScoreTable() {
        const scoreTable = document.getElementById('scoreTable');
        const tbody = scoreTable.querySelector('tbody');
        tbody.innerHTML = '';

        const totals = this.calculateTotalScores();
        const sortedPositions = this.getSortedPositions();

        // Add total row
        const totalRow = document.createElement('tr');
        totalRow.classList.add('total-row');
        totalRow.innerHTML = '<td>Total</td>';
        sortedPositions.forEach(position => {
            totalRow.innerHTML += `<td>${totals[position]}</td>`;
        });
        tbody.appendChild(totalRow);

        // Add individual run rows
        this.gameHistory.forEach((run, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${this.gameHistory.length - index}</td>`;
            sortedPositions.forEach(position => {
                row.innerHTML += `<td>${run[position] || 0}</td>`;
            });
            tbody.appendChild(row);
        });

        // Update header with current runner names in sorted order
        const headerRow = scoreTable.querySelector('thead tr');
        headerRow.innerHTML = '<th>Run</th>';
        sortedPositions.forEach(position => {
            const runnerIndex = position - 1;
            headerRow.innerHTML += `<th>${this.runners[runnerIndex]}</th>`;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gameScoreBoard = new GameScoreBoard();
});
