
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





I need you to create a complete working local dashboard project in my current VS Code workspace.

IMPORTANT:
Do not just explain the code.
Do not give me snippets.
Actually CREATE/UPDATE all required files in the workspace.

PROJECT NAME:
python_testing

REQUIRED FOLDER STRUCTURE:

python_testing/
│
├── dashboard/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
│
├── data/
│   ├── input/
│   │   └── .gitkeep
│   └── output/
│       └── .gitkeep
│
├── requests/
│
├── scripts/
│   ├── build_dashboard.py
│   └── Start-Dashboard.ps1
│
├── secrets/
│   └── secrets.local.json.example
│
├── .gitignore
└── README.md


MAIN REQUIREMENT:

I will place MULTIPLE response JSON files inside:

data/input/

For example:

data/input/response1.json
data/input/response2.json
data/input/response3.json
data/input/response4.json

The application must automatically read ALL .json files present in data/input/.

It must NOT depend on a fixed filename such as response.json.

It must combine/process all JSON files and generate ONE dashboard.

If I add another JSON file later, I should only need to put it into data/input/ and rerun the application.

DASHBOARD REQUIREMENT:

Create a professional dark blue dashboard similar to the Product Hierarchy dashboard shown in my reference.

Title:

Product Hierarchy (Parent & Bundled Children)

The main table must have these columns:

1. CATEGORY NAME
2. LEVEL & CODE / NAME / BUNDLE INFO
3. PRIMARY EXT. SYSTEM ID
4. TOTAL AVAILABLE COUNT
5. BUNDLED AVAILABLE COUNT
6. STOCK STATUS

The UI should look professional and modern, with:
- dark blue background
- blue/cyan highlights
- rounded cards
- clean table
- filters
- badges
- responsive design
- good spacing
- professional enterprise dashboard appearance


FILTERS:

Add filters above the table:

Category Name
- dropdown
- All Categories option
- automatically populate categories from the JSON data

Level & Code / Name / Bundle Info
- text search

Primary Ext. System ID
- text search

Total Available Count
- filter

Bundled Available Count
- filter

Stock Status
- dropdown
- All Status
- In Stock
- Out of Stock
- Unknown


PARENT / CHILD:

The data can contain parent products and bundled children.

Display parent records in the main table.

If a parent has children, show:
- expandable arrow
- number of children
- BUNDLE: true badge when applicable

When the arrow is clicked, display the child records underneath the parent.

Child rows should be visually indented.


JSON DETAILS:

Each record should have a JSON button.

When clicked:
- open a modal
- display the original/raw JSON for that record
- show the code/name in the modal title
- provide Copy JSON button


EXPORT:

Add an "Export XLSX" button.

It should export the processed dashboard records into:

data/output/product-hierarchy.xlsx

Also generate:

data/output/product-hierarchy.csv


AUTOMATIC JSON PROCESSING:

Create:

scripts/build_dashboard.py

This script must:

1. Find every *.json file in data/input/
2. Read each JSON file
3. Handle JSON objects and arrays
4. Search nested JSON structures
5. Extract product records
6. Detect parent and child relationships where possible
7. Extract the dashboard fields
8. Combine records from ALL input files
9. Remove duplicate records where appropriate
10. Generate:

data/output/dashboard-data.json
data/output/product-hierarchy.csv
data/output/product-hierarchy.xlsx

Do NOT require external Python packages if possible.

Use Python standard library wherever possible.

The field names in real API responses may differ slightly.

Therefore implement flexible field detection / aliases for fields such as:

Category:
category
categoryName
category_name
productCategory
productCategoryName

Code:
code
productCode
productOfferingCode
productOfferingId
offeringCode
sku
partNumber
id

Name:
name
productName
productOfferingName
offeringName
displayName
description

Bundle:
isBundle
bundle
bundleFlag
isBundled

External System ID:
primaryExternalSystemId
externalSystemId
primaryExtSystemId
externalId
extSystemId

Available count:
availableCount
totalAvailable
totalAvailableCount
available
inventoryCount
quantityAvailable
stockCount

Bundled available count:
bundledAvailableCount
bundledAvailable
bundleAvailableCount
bundleAvailable
availableBundledCount

Stock status:
stockStatus
status
stock
inventoryStatus
availabilityStatus

Also search nested objects such as:

primaryExternalSystem
externalSystem
inventory
stock
productAttributes
genericInputAttributes

Do not assume that all fields are at the root level.


IMPORTANT UI BEHAVIOR:

When the dashboard starts, it should load:

data/output/dashboard-data.json

Display:
- number of JSON files processed
- number of records
- number of categories

Add:
- Reset Filters button
- Refresh button
- pagination
- rows per page: 10, 25, 50, 100


STARTUP:

Create:

scripts/Start-Dashboard.ps1

It must:

1. Detect Python
2. Run build_dashboard.py
3. Start a local HTTP server
4. Open the dashboard in the browser

Use:

python -m http.server 8000

Dashboard URL:

http://localhost:8000/dashboard/


The script should work when executed from the project root.

I want to be able to run:

.\scripts\Start-Dashboard.ps1

If PowerShell execution policy causes an issue, also tell me the exact command:

powershell -ExecutionPolicy Bypass -File .\scripts\Start-Dashboard.ps1


IMPORTANT:

The dashboard must NOT use hardcoded sample records for the actual application.

It must derive the displayed data from the JSON files in:

data/input/

Create a small sample JSON only if necessary for testing, but clearly separate it from the real input data.

Also create a README.md explaining:

1. Where to put JSON files
2. How to start the dashboard
3. How all JSON files are processed
4. Where generated files are created
5. How to troubleshoot errors

After creating all files:

1. Check the complete folder structure.
2. Check Python syntax.
3. Run the Python processing script.
4. Verify dashboard-data.json is generated.
5. Verify XLSX and CSV are generated.
6. Verify the dashboard can load the generated data.
7. Fix any errors you find.

DO NOT STOP AFTER WRITING THE CODE.

Actually create the files and test them.

At the end, tell me exactly what command I should run in the VS Code terminal to start the application.

