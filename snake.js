
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

Here is the content for your document:

# Visible Shopping Cart: Session Notes

## 1. Brand Landscape
- Visible, Total Wireless, and Straight Talk run on the same core code, with brand differences handled through configuration.
- Some configurable "flavors" are switched on when needed. Whenever a brand configuration changes, the related code must be updated.
- Walmart-side brands (Walmart telephone, WIS / Walmart Information System) came from Verizon's acquisitions.
- Verizon also acquired TrackPhone. Its core is mostly used in Total Wireless, and the same code is used for Visible with configurable flavors.

## 2. Code and Governance
- BAU is the old code. VXP is the new code being developed. VXP is built on CXP and sits under NSA.
- Most repositories extend the CXP code. Plugins and repositories are available here, so most code is taken from here.
- All changes must be accepted by the governance team. Members mentioned: Pooja, Manachandra, Pulki, Praveen Thambi, and the manager.
- Governance rules are strict. For example, when a request needs data from a microservice, the microservice must return all required data in one call, not repeated calls.
- VXP has more flexible standards than BAU, which is the goal. BAU has stricter standards.

## 3. Project Overview
- The Visible shopping cart is a telecom shopping application, similar to Flipkart, for buying devices, wearables, plans, insurance, SIM cards, and home internet/broadband.
- Accessories and variants (e.g., AirPods) are offered through the same flow.

### Plans
- Voice plans, data plans, and ILD (International Long Distance dialing) plans.
- HPP plans are insurance. If a device is lost or stolen, a replacement is offered for a nominal cost, charged monthly.
- Visible Product Plans (VPP) is the Visible name for HPP. Total Wireless calls them HPP.
- Visible plans: Visible, Visible Plus, and Visible Plus Pro, in monthly and annual options.

### SIMs
- Two types: physical SIM and digital SIM (eSIM).
- A physical SIM is bought as a new SIM. An eSIM is free digitally.

### Content Source

- Product data comes from DCM (Digital Catalog Management), managed by Technotree.
- Retrieval is from Azure.
- Product text (stock status, promos, 5G labels) and product images come from DCM. Images are linked in DCM and stored in Amazon S3.
- Variants (e.g., 256GB, 512GB) also come from DCM.

## 4. Environments
- **Dev:** Development branch (SATA.visible.com).
- **SIT1 and SIT2:** QA and testing (SIT1.visible.com).
- **Canary:** Pre-production, tested by business owners and the testing team.
- **Production:** Live site.
- Neelima's access: mainly Dev and SIT1. No access to Canary or production, which testers can access.

## 5. Ways to Get a Device
- **Purchase outright.**
- **Financing (EMI):** Monthly installments, e.g., 36 months with no interest. Eligibility is checked at checkout.
- **Lease/rental:** Pay a monthly amount to use the device, then return it or exchange it.
- **BYOP (Bring Your Own Phone or Product):** The customer brings their own device, and only plans and SIMs are sold. Apple or Android watches can be brought too.
- **Upgrade program:** For example, moving from iPhone 16 to iPhone 18.
- **Trade-in program:** Get an estimate for the old device, then send it in. The device is sold to a third-party agent, and the amount is passed on to Visible.
- **Visible Payback:** A loyalty program.
- **Promo codes:** Applied at the cart for discounts, e.g., a $6 premium discount. Managed by the business team.

## 6. Website Flow (Production Walkthrough)
1. Browse the device list. Out-of-stock items are marked as such.
2. Select a device and capacity. The price shown is the base price after discounts, with taxes and fees included.
3. Add a plan. If none is added, the item is device-only.
4. "Add a plan" asks for the customer's state, and the plan is added based on that state.
5. Add-ons: VPP/HPP insurance, physical or digital SIM, home internet, watches.
6. The cart shows the device, plan, and SIM items, with the pre-tax quotation first.
7. Checkout requires an account (create one or log in). Guest checkout has been removed.
8. Enter a phone number.
9. Sales tax is calculated and shown.
10. Choose a shipping option: standard post, express post, or premium courier such as DTDC. Some options cost extra, and delivery times are shown in business days.
11. Choose a payment method.
12. Pay, then receive an order ID.

A customer can buy a device alone, a plan alone, or both.

## 7. Tangible vs. Intangible
- **Tangible (touchable):** Devices, physical SIMs, home internet devices, and variants.
- **Intangible (not touchable):** Plans, insurance (VPP/HPP), and eSIMs.

## 8. Pricing and Tax
- Example: A TV at 65,000 plus a stabilizer at 5,000 totals 70,000. Adding 10,000 of insurance brings it to 80,000. Checkout then shows the total with taxes.
- Tax types: GST (India context), and municipal and state taxes (US context). Tax is computed by the tax engine.

## 9. Open Items to Confirm
- The exact name of the tax component ("UTE" in the recording).
- The governance team name ("Legion" in the recording).
- The exact shipping charge amount ("$20" was mentioned).
- The exact checkout shipping option names and business-day estimates.
- The exact trade-in partner flow.