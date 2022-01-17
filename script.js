var ticTacToe = (function() {
	var gamePieces = ["O", "X"];
	var gamePlayers = [];
	var currentPlayer = null;
	var startingPlayer = null;
	var gameWinner = null;
	var boardFull = false;

	var gameBoard = (function (){
		let emptyCell = "";
		var isFull = function(){
			return !board.flat().includes(emptyCell);
		};

		var isEmpty = function(){
			return board.flat().every(cell => cell == emptyCell);
		};

		var newBoard = function(){
			return [[emptyCell, emptyCell, emptyCell],
				[emptyCell, emptyCell, emptyCell],
				[emptyCell, emptyCell, emptyCell]];
		};

		var board = newBoard();

		var reset = function() {
			board = newBoard();
		};

		var getBoard = function() {
			let boardCopy = [];
			board.forEach(row => { boardCopy.push(Array.from(row)); });
			console.log("boardCopy is: ");
			console.log(boardCopy);
			return boardCopy;
		};

		var addPiece = function(piece, cell) { 
			let columns = board[0].length;
			let rows = board.length;
			let row = Math.floor(cell / rows);
			let column = cell - (row * 3);
			if (row < rows && 
				column < columns &&
				board[row][column] == emptyCell){
				board[row][column] = piece;
				return true;
			}

			return false;
		};

		var removePieceFrom = function(cellId) {
			let columns = board[0].length;
			let rows = board.length;
			let row = Math.floor(cellId / rows);
			let column = cellId - (row * 3);
			if (row < rows && column < columns){
				board[row][column] = emptyCell;
			}
		};

		var getEmptyCells = function() {
			let emptyCells = [];
			for(let i = 0; i <= 8; i++){
				let row = Math.floor(i / board.length);
				let col = i - (row * 3);
				if(board[row][col] == emptyCell){
					emptyCells.push(i);
				}
			}

			return emptyCells;
		};

		return { isFull: isFull,
			 isEmpty: isEmpty,
			 addPiece: addPiece,
			 removePieceFrom: removePieceFrom,
			 reset: reset,
			 get: getBoard,
			 getEmptyCells: getEmptyCells,
		};
	})(); //End gameBoard

	var winChecker = (function (){
		var getOnlyPositionsOf = function (piece, board) {
			var toBinary = function(a) { return a == piece ? 0b1 : 0b0; };
			let binBoard = [];
			board.forEach(row => {
				binBoard.push(row.map(toBinary));
			});

			return binBoard;
		};

		var winExists = function(board) {
			var win = false;
			for(let player of gamePlayers) {
				let boardPositions = getOnlyPositionsOf(player.piece, board);
				//horizontal wins
				let rowOne, rowTwo, rowThree;
				rowOne = boardPositions[0].reduce((p,n) => p & n); 
				rowTwo = boardPositions[1].reduce((p,n) => p & n);
				rowThree = boardPositions[2].reduce((p,n) => p & n);

				if (rowOne || rowTwo || rowThree){
					return player;
				}
				//vertical wins
				let colOne = 0b1;
				let colTwo = 0b1;
				let colThree = 0b1;
				boardPositions.forEach((row,i,a) => {
					colOne = row[0] & colOne;
					colTwo = row[1] & colTwo;
					colThree = row[2] & colThree;
				});

				if (colOne || colTwo || colThree){
					return player;
				}
				//diagonal wins
				let diagOne = boardPositions[0][0] & boardPositions[1][1] & boardPositions[2][2]; 
				let diagTwo = boardPositions[0][2] & boardPositions[1][1] & boardPositions[2][0];

				if (diagOne || diagTwo) {
					return player;
				}
			}

			return null;
		}

		return { winExists: winExists, };
	})(); //end WinChecker

	var playerCounter = 1;
	function createPlayer(piece, name, isComp = false) {
		var setName = function(str){
			if(str != ""){
				return str;
			}else{
				return isComp ? `Computer ${playerId}` : ` Player ${playerId}`;
			}
		};

		var playerId = playerCounter++;
		var name = setName(name);
		var piece = piece;
		var setPiece = function(p){
			piece = p;	
		};


		var isComputer = isComp;

		return  { player_id: playerId,
			  name: name,
			  setPiece: setPiece,
			  piece: piece,
		          isComputer: isComputer, };
	}; //end createPlayer

	const cellValues = [5,  0, 5,
			    0, 10, 0,
			    5,  0, 5];

	var getMoveFor = function(player){
		if(gameBoard.isEmpty()){//return middle cell if board is empty
			return 4; 
		} else {//otherwise decide by minimax
			let minimaxDepth = 4;
			let moves = gameBoard.getEmptyCells();
			let moveScores = []
			moves.forEach((m) => {
				gameBoard.addPiece(player.piece, m);
				moveScores.push(miniMax(player, 1, minimaxDepth) + cellValues[m]);
				gameBoard.removePieceFrom(m);
			});

			let moveIndex = 0;
			let highestValue = moveScores[moveIndex];
			console.log("moveScores:");
			console.log(moveScores);
			for(let i = 1; i < moveScores.length; i++){
				if(moveScores[i] > highestValue){
					highestValue = moveScores[i];
					moveIndex = i;
				}
			};

			console.log(`move is: ${moves[moveIndex]}`);
			return moves[moveIndex];
		}
	}; //end getMoveFor

	var miniMax = function(player, posNeg, depth) {
		//console.log(`Player: ${player.name}, posNeg: ${posNeg}, depth: ${depth}`);
		if(winChecker.winExists(gameBoard.get())){
			return (depth + 1) * posNeg * 100; //Multiply by depth + 1 to create a sense of urgency. Closer wins have a higher value than farther ones.
		}else if(gameBoard.isFull() || depth <= 0){
			//console.log("board full or depth is 0");
			return 0;
		}else{
			let nextPlayer = gamePlayers.find(p => p != player);
			let scores = [];
			let moves = gameBoard.getEmptyCells();
			//console.log(`Moves:`);
			//console.log(moves);
			moves.forEach((m) => {
				gameBoard.addPiece(nextPlayer.piece, m);
				scores.push(miniMax(nextPlayer, posNeg * -1, depth - 1) + posNeg * cellValues[m]);
				gameBoard.removePieceFrom(m);
			});

			//console.log(`Scores: ${scores}`);
			let returnValue = scores.reduce((prev, next) => prev < next ? prev : next);
			//console.log(`score to return: ${returnValue}`);
			return returnValue;
		}
	}; //end miniMax

	var resetPlayers = function(playerNames = ["Player 1", "Player 2"], playerTypes = [false, false]) {
		playerCounter = 1;
		gamePlayers = [];
		for(let i = 0; i <= 1; i++){
			gamePlayers.push(createPlayer(gamePieces[i], playerNames[i], playerTypes[i]));
		}
	}; //end resetPlayers

	var initializeGame = function() {
		//Get player names. Form event handler calls new game
		boardRenderer.renderPlayerForm();
	}; //End initializeGame

	var newGame = function(){ //skips player creation step, for subsequent replays
		gameBoard.reset();
		if(startingPlayer){
                	currentPlayer =  startingPlayer = gamePlayers.find(p => p != startingPlayer);
		}else{
			currentPlayer = startingPlayer = gamePlayers[0];
		}
		boardFull = false;
		gameWinner = null;

		//initialize board
		boardRenderer.initialize();
		boardRenderer.renderDisplay({nextPlayer: currentPlayer});
		gameDriver();
	}; //end newGame

	var gameDriver = function(){
		if(gameWinner){
			console.log(`Player ${gameWinner} wins!`);
			boardRenderer.renderDisplay({ winStatus: "win", winner: gameWinner});
			boardRenderer.deactivateCells();
			boardRenderer.renderPlayAgain();
		} else if(boardFull) {
			console.log(`It's a draw!`);
			boardRenderer.renderDisplay({winStatus: "draw"});
			boardRenderer.deactivateCells();
			boardRenderer.renderPlayAgain();
		} else {
			if(currentPlayer.isComputer){
				setTimeout(()=>{
					let  move = getMoveFor(currentPlayer);
					let boardCell = document.querySelector(`[data-cell='${move}']`);
					takeTurn.call(boardCell);
				}, 500);
			}else{
				boardRenderer.activateCells();
			}
		}
	}; //end gameDriver

	var takeTurn = function() {
		var chosenCell = this.getAttribute("data-cell");
		if(gameBoard.addPiece(currentPlayer.piece, chosenCell)) {
			//render update
			boardRenderer.updateCell(currentPlayer.piece, chosenCell);
			//check board and win status
			boardFull = gameBoard.isFull();
			gameWinner = winChecker.winExists(gameBoard.get());
			//remove event listener from cell
			boardRenderer.deactivateCells();
		} 
		console.log(`${currentPlayer.name} places ${currentPlayer.piece} at Cell ${chosenCell}`);
		console.log(`Game status: Board is ${gameBoard.isFull() ? "full" : "not full"}, Win ${ gameWinner ? "exists" : "does not exist"}`);
		setTimeout(gameDriver, 100);
		currentPlayer = gamePlayers.find(p => p != currentPlayer);
		boardRenderer.renderDisplay({nextPlayer: currentPlayer});
	}; //end takeTurn

	var boardRenderer = (function(){//module containing all rendering and hydration functions
		var boardContainerId = "tictactoe__container";
		var displayId = "tictactoe__display";
		var boardId = "tictactoe__board";	
		var rowClass = "tictactoe__row";
		var cellClass = "tictactoe__cell";
		var buttonClass = "tictactoe__button";

		var clearScreen = function(){
			let boardContainer = document.getElementById(boardContainerId);
			boardContainer.replaceChildren();
		};

		var renderTitleScreen = function() {
			clearScreen();
			let boardContainer = document.getElementById(boardContainerId);
			let titleContainer = document.createElement("div");
			titleContainer.id = "tictactoe__title-container";
			
			let title = document.createElement("p");
			title.id = "tictactoe__title";
			title.append("Tic Tac Toe");
			titleContainer.appendChild(title);

			let playButton = renderPlayButton();
			titleContainer.appendChild(playButton);

			boardContainer.appendChild(titleContainer);
		};

		var renderPlayerForm = function() {
			clearScreen();
			let boardContainer = document.getElementById(boardContainerId);
			let playerFormContainer = document.createElement("div");
			playerFormContainer.id = "tictactoe__player-form-container";

			let promptEl = document.createElement("p");
			promptEl.append("Enter names for each player:");
			playerFormContainer.appendChild(promptEl);

			for(let i = 1; i <= 2; i++){
				let inputContainerEl = document.createElement("div");
				inputContainerEl.className = "tictactoe__input-container";
				let inputEl = document.createElement("input");
				inputEl.setAttribute("type", "text");
				inputEl.setAttribute("placeholder", `Player ${i}`);
				inputEl.id = `input__player-${i}-name`;

				let radialGroupContainer = document.createElement("div");
				radialGroupContainer.className = "tictactoe__radial-container";
				["player", "computer"].forEach((txt) => {
					let radialContainer = document.createElement("div");
					let radialEl = document.createElement("input");
					radialEl.setAttribute("type", "radio");
					radialEl.id = `player-${i}-type-${txt}`;
					radialEl.name = `player-${i}-type`;
					radialEl.setAttribute("value", txt);
					if(txt == "player"){
						radialEl.setAttribute("checked", true);
					}
					let radialLabel = document.createElement("label");
					radialLabel.setAttribute("for", radialEl);
					radialLabel.innerHTML = txt.charAt(0).toUpperCase() + txt.slice(1);
					radialContainer.appendChild(radialEl);
					radialContainer.appendChild(radialLabel);
					radialGroupContainer.appendChild(radialContainer);
				});
          			
				inputContainerEl.appendChild(inputEl);
				inputContainerEl.appendChild(radialGroupContainer);
				playerFormContainer.appendChild(inputContainerEl);
			}

			let submitBtnEl = document.createElement("button");
			submitBtnEl.append("Submit");
			submitBtnEl.className = buttonClass;
			playerFormContainer.appendChild(submitBtnEl);
			boardContainer.appendChild(playerFormContainer);

			submitBtnEl.addEventListener("click", function(){
				let formInputs = Array.from(playerFormContainer.querySelectorAll("[type='text']"));
				console.log(formInputs);
				let playerNames = formInputs.map(x => x.value);
				let radialInputs = Array.from(playerFormContainer.querySelectorAll("[type='radio']"));
				console.log(radialInputs);
				let playerTypes = [];
				radialInputs.forEach((el) => {
					if(el.checked){
						if(el.value == "player"){
							playerTypes.push(false);
						}else if(el.value == "computer"){
							playerTypes.push(true);
						}
					}
				});
				resetPlayers(playerNames, playerTypes);
				newGame();
			});
		};

		var renderPlayButton = function(buttonText = "Play"){
			let btn = document.createElement("button");
			btn.className = buttonClass;
			btn.append(buttonText);
			btn.addEventListener("click", initializeGame);
			return btn;
		};

		var renderBoard = function(){
			clearScreen();
			let board = gameBoard.get();
			console.log(board);
			let boardContainer = document.getElementById(boardContainerId);
			let boardEl = document.createElement("div");
			boardEl.id = boardId;

			board.forEach((row,rowIndex,a) => {
				let rowEl = document.createElement("div");
				rowEl.className = rowClass;
				row.forEach((val,colIndex,a) => {
					let cell = renderCell(rowIndex, colIndex);
					rowEl.appendChild(cell);
				});
				boardEl.appendChild(rowEl);
			});
			boardContainer.appendChild(boardEl);
		};

		var renderDisplay = function({nextPlayer, winStatus = "", winner} = {}){
			let display = document.getElementById(displayId);
			if(!display){
				display = document.createElement("div");
				display.id = displayId;
				let boardContainer = document.getElementById(boardContainerId);
				boardContainer.insertBefore(display, boardContainer.firstChild);
			}else{
				display.replaceChildren(); //clear display
			}
			
			//Add text to display
			let textContainer = document.createElement("p");
			let statusText = "";
			if(winStatus == "win"){
				statusText = `${winner.name} wins!`;
			}else if(winStatus == "draw"){
				statusText = "It's a draw!";
			}else{
				statusText = `${nextPlayer.name}'s turn (${nextPlayer.piece})`;
			};
			textContainer.innerHTML = statusText;
			display.appendChild(textContainer);

			//Add animated ellipses if computer's turn
			if(nextPlayer && nextPlayer.isComputer){
				console.log("Adding ellipses");
				display.appendChild(renderWaitingEllipses());
			};
		};

		var renderWaitingEllipses = function(){//Returns a container containing animated ellipses
			let animationContainer = document.createElement("div");
			animationContainer.className = "ellipses-container";
			for(let i = 0; i < 3; i++){
				let circleEl = document.createElement("div");
				circleEl.className = `animated-circle animated-circle-${i + 1}`;
				animationContainer.appendChild(circleEl);
			}

			return animationContainer;
		};

		var renderPlayAgain = function(){
			let boardContainer = document.getElementById(boardContainerId);

			let playAgainContainer = document.createElement("div");
			playAgainContainer.id = "tictactoe__play-again";

			let playAgainTextContainer = document.createElement("p");
			playAgainTextContainer.id = "play-again__text";
			playAgainTextContainer.append("Play Again?");
			playAgainContainer.appendChild(playAgainTextContainer);

			let buttonsContainer = document.createElement("div");
			buttonsContainer.id = "play-again__buttons-container";

			let playButton = document.createElement("button");
			playButton.append("Yes");
			playButton.className = buttonClass;
			playButton.addEventListener("click", newGame);
			buttonsContainer.appendChild(playButton);

			let resetButton = document.createElement("button");
			resetButton.append("No");
			resetButton.className = buttonClass;
			resetButton.addEventListener("click", renderTitleScreen);
			buttonsContainer.appendChild(resetButton);

			playAgainContainer.appendChild(buttonsContainer);
			boardContainer.appendChild(playAgainContainer);

		};

		var renderCell = function(cellRow, cellCol) {
			let cell = document.createElement("div")
			cell.className = cellClass;
			cell.setAttribute("data-cell", getCellId(cellRow, cellCol));
			return cell;
		};

		var getCellId = function (cellRow, cellCol) {
			return (3 * cellRow) + cellCol;
		};

		var updateCell = function (value, cellId) {
			let board = document.getElementById(boardId);
			let cell = board.querySelector(`[data-cell='${cellId}']`);
			cell.innerHTML = value;
		};

		var activateCells = function() {
			let cells = Array.from(document.getElementsByClassName("tictactoe__cell"));
			cells.forEach((cell) => { 
				if(cell.innerHTML == "") { 
					cell.addEventListener("click", takeTurn); 
					cell.classList.remove("tictactoe__cell--disabled");
				}
			});
		};

		var deactivateCells = function(func) {
			let cells = Array.from(document.getElementsByClassName("tictactoe__cell"));
			cells.forEach((cell) => { 
				cell.removeEventListener("click", takeTurn);
				cell.classList.add("tictactoe__cell--disabled");
			});
		};

		return { initialize: renderBoard,
			 updateCell: updateCell,
			 renderDisplay: renderDisplay,
			 renderTitleScreen: renderTitleScreen,
			 renderPlayAgain: renderPlayAgain,
			 renderPlayerForm: renderPlayerForm,
			 activateCells: activateCells,
			 deactivateCells: deactivateCells, };
	})(); //End boardRenderer

	return { playGame: initializeGame,
		 showTitleScreen: boardRenderer.renderTitleScreen, };
})(); //end ticTacToe


var main = function() {
	ticTacToe.showTitleScreen();
};

window.addEventListener("load", main);


