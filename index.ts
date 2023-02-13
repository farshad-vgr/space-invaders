const tutorialSection = document.getElementById("tutorial-section") as HTMLElement;
const tutorialBtn = document.getElementById("tutorial-btn") as HTMLButtonElement;
const levelButtons = document.querySelectorAll(".level-btn") as NodeListOf<HTMLButtonElement>;
const gameBoard = document.getElementById("game-board") as HTMLDivElement;
const resultsDisplay = document.getElementById("results") as HTMLHeadingElement;

// The level-buttons are disabled when tutorial modal is showing
for (const btn of levelButtons) {
	btn.disabled = true;
}

// A class to build sound objects
class Sound {
	private readonly sound: HTMLAudioElement;
	public constructor(src: string) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.style.display = "none";
		document.body.appendChild(this.sound);
	}
	public playSound(): void {
		this.sound.play();
	}
	public stopSound(): void {
		this.sound.pause();
	}
}

// Build objects from the Sound class with a proper sound source for different parts of the game
const backgroundSound: Sound = new Sound("assets/sounds/bgSound.mp3");
const startSound: Sound = new Sound("assets/sounds/start.mp3");
const invadersMoveSound: Sound = new Sound("assets/sounds/invadersMove.mp3");
const shootSound: Sound = new Sound("assets/sounds/shoot.mp3");
const explodeSound: Sound = new Sound("assets/sounds/explode.mp3");
const winSound: Sound = new Sound("assets/sounds/win.mp3");
const gameOverSound: Sound = new Sound("assets/sounds/gameOver.mp3");

let scores: number = 0; // A variable to hold the game score
const width: number = 15; // Number of cells in each row and column
let currentShooterIndex: number; // An index in a row to place the shooter
let direction: number = 1; // Invader's movement direction(1 for moving to the right and -1 for left)
let isGoingRight: boolean = true; // Invader's movement direction
let aliensInterval: number; // This variable is to clear the interval effect
// An array of starting index positions for aliens(three rows of aliens)
const fixedAlienPositions: readonly number[] = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
];
let alienPositions: number[] = [...fixedAlienPositions]; // Alive alien's index
let alienPositionsLength: number = alienPositions?.length; // total 30
let alienRemovedPositions: number[] = []; // Removed alien's index will push to this array

// Fill the gameboard with divs(total number of divs are 15*15=225)
for (let i = 0; i < width ** 2; i++) {
	gameBoard.appendChild(document.createElement("div"));
}

// Each div in the gameboard is a square, using a spread operator to put these divs in an array
const squares: readonly Element[] = [...document.querySelectorAll(".game-board div")];
const squaresLength: number = squares?.length; // total 225

// Aliens starting positions will be pushed to selected square(selected index)
for (let i = 0; i < alienPositionsLength; i++) {
	squares[alienPositions[i]].classList.add("invader");
}

// This function handles the shooter's movement to the left or right with arrows on the keyboard
function moveShooter(event: KeyboardEvent): void {
	switch (event.key) {
		case "ArrowLeft":
			// First, check if the shooter has an empty cell on the left side then it can move
			if (currentShooterIndex % width !== 0) {
				squares[currentShooterIndex].classList.remove("shooter"); // Remove shooter from current cell
				squares[--currentShooterIndex].classList.add("shooter"); // Add shooter to this cell
			}
			break;
		case "ArrowRight":
			// First, check if the shooter has an empty cell on the right side then it can move
			if (currentShooterIndex % width < width - 1) {
				squares[currentShooterIndex].classList.remove("shooter"); // Remove shooter from current cell
				squares[++currentShooterIndex].classList.add("shooter"); // Add shooter to this cell
			}
			break;
	}
}

// This function handles shoots
function shoot(event: KeyboardEvent): void {
	// A shoot and sound will be executed when the up arrow of the keyboard press
	if (event.key === "ArrowUp") {
		let currentLaserIndex: number = currentShooterIndex;
		const laserInterval: number = setInterval(moveLaser, 100); // The laser position will be updated each 100 ms
		shootSound?.playSound();

		// This function updates the shooter's laser index from bottom of the gameboard to top
		function moveLaser(): void {
			squares[currentLaserIndex].classList.remove("laser");
			currentLaserIndex -= width; // The laser's position moves up one row

			if (currentLaserIndex < 0) {
				clearInterval(laserInterval); // If the laser reached the top of the gameboard it will be stopped
			} else {
				squares[currentLaserIndex].classList.add("laser");

				// If the laser hits an alien this block will be executed
				if (squares[currentLaserIndex].classList.value === "invader laser") {
					squares[currentLaserIndex].classList.remove("laser"); // Remove laser shape
					squares[currentLaserIndex].classList.remove("invader"); // Remove alien shape
					squares[currentLaserIndex].classList.add("boom"); // Add an explode shape
					explodeSound?.playSound();

					// Remove explode shape after 200 ms to clean the cell
					setTimeout(() => squares[currentLaserIndex].classList.remove("boom"), 200);

					clearInterval(laserInterval); // Clear the interval after explosion

					alienRemovedPositions?.push(alienPositions?.indexOf(currentLaserIndex)); // Remove alien

					scores++;

					resultsDisplay.innerHTML = `Score: ${scores ?? 15}/30`;

					// End of the game when all 30 aliens were removed
					if (scores === 30) {
						resultsDisplay.innerHTML = `<span style="color: lightgreen">"YOU WON!"</span>`;
						winSound?.playSound();
						clearInterval(aliensInterval); // Stop the movement of aliens

						// The app does not listen to user actions anymore
						document.removeEventListener("keydown", moveShooter);
						document.removeEventListener("keydown", shoot);
					}
				}
			}
		}
	}
}

// This function handles alien's movements
function moveAliens(): void {
	const isOnLeftEdge: boolean = alienPositions[0] % width === 0;
	const isOnRightEdge: boolean = alienPositions[alienPositionsLength - 1] % width === width - 1;

	// This loop hides removed aliens
	for (let i = 0; i < alienPositionsLength; i++) {
		if (!alienRemovedPositions?.includes(i)) {
			squares[alienPositions[i]].classList.remove("invader");
		}
	}

	// Change in movement direction(from right to left) depends on the alien's position
	if (isOnRightEdge && isGoingRight) {
		invadersMoveSound?.playSound();

		// All the alien's position moves down one row
		for (let i = 0; i < alienPositionsLength; i++) {
			alienPositions[i] += width + 1;
			direction = -1;
			isGoingRight = false;
		}
	} else if (isOnLeftEdge && !isGoingRight) {
		invadersMoveSound?.playSound();

		// All the alien's position moves down one row
		for (let i = 0; i < alienPositionsLength; i++) {
			alienPositions[i] += width - 1;
			direction = 1;
			isGoingRight = true;
		}
	}

	// Changing alien's current cell index one by one(to right or left depends on direction value)
	for (let i = 0; i < alienPositionsLength; i++) {
		alienPositions[i] += direction;
	}

	// If the aliens reached the down of the gameboard the game will be over
	for (let i = 0; i < alienPositionsLength; i++) {
		if (!alienRemovedPositions?.includes(i)) {
			// 209 is the last allowed index of squares that aliens can be there(one row up shooter's row)
			if (alienPositions[i] > 209) {
				resultsDisplay.innerHTML = `<span style="color: red">"GAME OVER!"</span>`;
				gameOverSound?.playSound();
				clearInterval(aliensInterval); // Stop the movement of aliens

				// The app does not listen to user actions anymore
				document.removeEventListener("keydown", moveShooter);
				document.removeEventListener("keydown", shoot);
			}
			squares[alienPositions[i]].classList.add("invader");
		}
	}

	// If the aliens hit the shooter the game will be over
	if (squares[currentShooterIndex].classList.value === "shooter invader") {
		resultsDisplay.innerHTML = `<span style="color: red">"GAME OVER!"</span>`;
		gameOverSound?.playSound();
		clearInterval(aliensInterval); // Stop the movement of aliens

		squares[currentShooterIndex].classList.add("boom"); // Shooter exploded shape

		// The app does not listen to user actions anymore
		document.removeEventListener("keydown", moveShooter);
		document.removeEventListener("keydown", shoot);
	}
}

// This function starts a new game with default values(kind of restart-function)
function gameStarter(level: number): void {
	scores = 0;
	resultsDisplay.innerHTML = `Score: ${scores ?? 15}/30`;
	currentShooterIndex = width ** 2 - Math.ceil(width / 2); // Center index of last row
	direction = 1;
	isGoingRight = true;
	clearInterval(aliensInterval);
	alienPositions = [...fixedAlienPositions];
	alienPositionsLength = alienPositions.length;
	alienRemovedPositions?.splice(0);

	// Remove all shapes from the gameboard
	for (let i = 0; i < squaresLength; i++) {
		squares[i].classList.remove("invader", "shooter", "laser", "boom");
	}

	// Aliens starting positions will be pushed to selected square(selected index)
	for (let i = 0; i < alienPositionsLength; i++) {
		squares[alienPositions[i]].classList.add("invader");
	}

	// Add shooter to the bottom of the gameboard
	squares[currentShooterIndex].classList.add("shooter");

	// This interval updates the position of aliens depending on the game level
	aliensInterval = setInterval(moveAliens, level);
}

// Set values and starting the game are here
tutorialBtn.addEventListener("click", () => {
	tutorialSection.style.display = "none";

	// The level-buttons will be enabled after that tutorial modal was closed
	for (const btn of levelButtons) {
		btn.disabled = false;
	}

	// This function adds a listener to each game-level button
	function eventListenerAdder(btn: HTMLButtonElement, time: number = 1000): void {
		btn.addEventListener("click", () => {
			// The app listens to user actions when a key is pressed and then calls the proper function
			document.addEventListener("keydown", moveShooter);
			document.addEventListener("keydown", shoot);
			gameStarter(time); // Each game runs with a time parameter to determine the alien's movement speed
			startSound?.playSound();
		});
	}

	// Set a timer for each game-level button from easy to hard(depending on the default time)
	let defaultTime: number = 1000;
	for (const btn of levelButtons) {
		eventListenerAdder(btn, defaultTime); // Set a listener for the level button with proper time
		defaultTime = defaultTime / 2; // The default time will be half in each loop
	}

	backgroundSound?.playSound(); // Playing sound in the background needs the user interaction
});
