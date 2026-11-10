
 let inputDir = { x: 0, y: 0 };
const foodSound = new Audio('food.mp3');
const gameOverSound = new Audio('gameover.mp3');
const moveSound = new Audio('move.mp3');
let musicSound = new Audio('music.mp3');
let speed = 2;
let score = 0;  // Initialize score to 0
let lastPaintTime = 0;
let snakeArr = [
    { x: 13, y: 13 }
];
let food = { x: 6, y: 9 };

// Select elements for the game over modal and score box
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');

// Function to update the score on the screen
function updateScore() {
    document.getElementById('scorebox').textContent = "Score: " + score;
}

// Main game function
function main(ctime) {
    window.requestAnimationFrame(main);

    // Control game speed
    if ((ctime - lastPaintTime) / 1000 < 1 / speed) {
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(snake) {
    for (let i = 1; i < snakeArr.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            return true;
        }
    }
    if (snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0) {
        return true;
    }
}

function gameEngine() {
    musicSound.play();

    // Game Over Logic
    if (isCollide(snakeArr)) {
        gameOverSound.play();
        musicSound.pause();
        inputDir = { x: 0, y: 0 };

        // Display the game over modal and the score
        finalScoreDisplay.textContent = "Score: " + score; 
        gameOverModal.style.display = 'flex';  // Show the modal
        updateScore(); // Update score display after game over
    }

    // If snake eats the food
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {
        snakeArr.unshift({ x: snakeArr[0].x + inputDir.x, y: snakeArr[0].y + inputDir.y });
        foodSound.play();

        // Generate new food coordinates
        let a = 2;
        let b = 16;
        food = { x: Math.round(a + (b - a) * Math.random()), y: Math.round(a + (b - a) * Math.random()) };

        score += 10; 
        updateScore(); // Update score display after eating food
    }

    // Moving the snake
    for (let a = snakeArr.length - 2; a >= 0; a--) {
        snakeArr[a + 1] = { ...snakeArr[a] };
    }
    snakeArr[0].x = snakeArr[0].x + inputDir.x;
    snakeArr[0].y = snakeArr[0].y + inputDir.y;

    // Display snake and food
    board.innerHTML = "";
    snakeArr.forEach((e, index) => {
        let snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        if (index == 0) {
            snakeElement.classList.add('head');
        } else {
            snakeElement.classList.add('snake');
        }
        board.appendChild(snakeElement);
    });

    // Display food
    let foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    board.appendChild(foodElement);
}

// Keyboard control logic
window.addEventListener('keydown', e => {
    inputDir = { x: 0, y: 1 }; // Start the game
    moveSound.play();
    switch (e.key) {
        case "ArrowUp":
            inputDir.x = 0;
            inputDir.y = -1;
            break;
        case "ArrowDown":
            inputDir.x = 0;
            inputDir.y = 1;
            break;
        case "ArrowRight":
            inputDir.x = 1;
            inputDir.y = 0;
            break;
        case "ArrowLeft":
            inputDir.x = -1;
            inputDir.y = 0;
            break;
        default:
            break;
    }
});

// Play Again Button Click
playAgainBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';  
    score = 0;
    snakeArr = [{ x: 13, y: 13 }];  
    inputDir = { x: 0, y: 0 }; 
    updateScore();  
    window.requestAnimationFrame(main);  
});

// Start the game loop
window.requestAnimationFrame(main);
#hi

Visible Shopping Cart – KT Notes

1. Overall Customer Journey

The customer visits visible.com (SOE) and selects a device, plan or wearable. The selected items are added to the shopping cart, followed by checkout, where the customer reviews the cart details, applies promotional offers, enters shipping information and submits the order.

2. Shopping Cart Actions

The process starts with CreateCart / AddToCart, which creates a cart and generates a unique Cart ID. The same Cart ID is used for all subsequent operations.

When the customer adds or modifies items, UpdateCart is triggered. The customer can then proceed to checkout to view all selected cart items.

Other actions include AddPromo, RemovePromo, ShippingAddress and SubmitAction (Validate), which validates and submits the order.

3. Intermediate Actions

The following actions are performed between checkout and order submission:

- RetrieveCart: Retrieves the current cart details.
- CartQuotation: Retrieves pricing details of all cart items, including devices, plans and wearables.
- RevenueAllocation: Handles item-level revenue distribution and applicable tax details.

4. Backend Request Flow

SOE sends requests in JSON/XML format to the Intermediate Service, which orchestrates and modifies the requests into the format expected by VXP services.

The request then reaches VXP Shopping Aggregate, which acts as the main entry point and coordinates calls to Shopping Cart Domain and Shipping Services.

Request Flow:

SOE → Intermediate Service → VXP Shopping Aggregate → VXP Shopping Cart Domain

Shipping Services also integrates with the Shopping Aggregate and can have a direct entry from SOE.

5. VXP Microservices

The three main services discussed during KT are:

1. VXP Shopping Aggregate: Main entry point for shopping-related requests and service orchestration.
2. VXP Shopping Cart Domain: Handles shopping cart-related business operations.
3. VXP Shipping Services: Handles shipping-related operations.

6. Other Backend Components

- BRM: Deals
- CustomerDomainService: PartyInfo
- ProductService: Product-related operations
- DCMAdapter: DCM integration

7. Post-Order Process

Once the order is submitted, jBPM handles the post-order workflow, including SIM activation and fleet tracking. The process continues until the customer receives the device or plan.

Overall Understanding

SOE handles customer interactions, the Intermediate Service manages request orchestration, and VXP services handle shopping cart, quotation and shipping operations. The Shopping Aggregate coordinates the backend service calls, while jBPM manages the post-order activation and tracking process.