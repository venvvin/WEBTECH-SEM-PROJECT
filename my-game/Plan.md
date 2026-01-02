# School Day Journey - Project Concept

## Project Overview
We are building this project using **Svelte**. The core concept involves a schoolboy setting off from home to school on a bus for his first day. Along the way, he encounters various difficulties (levels), such as packing a backpack, paying the fare, playing games with classmates, etc.

**Key Technical & Design Goals:**
*   **Mobile Adaptation:** The graphics must be easily adaptable for mobile devices. We will request the user to rotate their phone horizontally at the start of the game.
*   **Assets:** Images will be generated via AI. For specific mini-games, we may use draggable elements sourced from the internet.
*   **Transitions:** We will insert specific GIF events (created by us as slideshows) between levels (e.g., a video of the bus driving further after a successful level).

## Gameplay Structure
*   **Total Levels:** 8 distinct interactions.
*   **Difficulty Tiers:** 3 logical stages.
*   **Randomization:** To respect the random order requirement while avoiding immediate high difficulty, levels are shuffled **only within their specific difficulty tier**.
*   **Health System:** The player has a specific number of hearts. Hearts are lost upon mistakes across different levels. If all hearts are lost, the game is over.

### Difficulty Logic Breakdown
1.  **Tier 1:** Getting ready for school (at home/near home).
2.  **Tier 2:** Bus ride (en route to school).
3.  **Tier 3:** School entrance (final challenge).

---

## Detailed Level Descriptions

### Tier 1: Getting Ready (3 Random Mini-Games)

**a) "Don't Forget Your Diary"**
*   **Scenario:** A general view of a backpack with various items scattered around (some needed for school, some not).
*   **UI:** A checklist window appears showing required items (e.g., "- Writing supplies, - Snack, - Hygiene products").
*   **Mechanic:** The player uses a finger/mouse to drag items into the backpack.
    *   Correct item: Screen glows green, item count updates.
    *   Incorrect item: Screen glows red, 1 heart is lost.
*   **Rules:** The player has a 2-mistake allowance (or similar logic implied by hearts).

**b) "Make Breakfast"**
*   **Scenario:** A cutting board and a fridge filled with ingredients. A step-by-step recipe is displayed.
*   **Mechanic:**
    *   Drag ingredients from the fridge to the board.
    *   **Cutting:** Tap/Click the product to cut it (sound effect plays). After a set number of cuts, the sprite changes (e.g., a whole tomato becomes a slice).
*   **Goal:** Assemble a sandwich strictly following the step-by-step instructions.

**c) "Dress Yourself"**
*   **Scenario:** A wardrobe with three outfits: 1. Dirty, 2. Proper School Uniform, 3. Weird/Costume.
*   **Mechanic:**
    *   Select the correct outfit (No margin for error allowed here).
    *   **Ironing:** Once selected, the player must "iron" the clothes using a finger/mouse. The fabric looks wrinkled initially; as the player rubs over it, the color/texture changes to smooth.
*   **Goal:** Fully iron the outfit to get dressed.

### Transition 1 -> 2: The Maze
*   **Scenario:** Walking to the bus stop.
*   **Mechanic:** A maze game.
    *   **Controls:** Arrow keys on Desktop / On-screen arrows on Mobile.
*   **Goal:** Reach the point marking the bus entrance.

---

### Tier 2: The Bus Ride (2 Random Mini-Games)

**d) "Fix the Wires"**
*   **Scenario:** The bus wires have broken; help the driver.
*   **Mechanic:** Wires are located on both sides of the screen.
*   **Goal:** Connect matching colors (similar to the *Among Us* task).

**e) "Pay the Fare"**
*   **Scenario:** Enter the correct PIN code for the card.
*   **Mechanic:** A message from "Mom" appears on the right side of the screen (simulated phone) revealing a code for a few seconds.
*   **Goal:** The player must memorize the code and type it into the keypad. This repeats for three different codes.

### Transition 2 -> 3: Cross the Road
*   **Scenario:** Traffic lights changing colors.
*   **Mechanic:** Press the "Go" button only when the light is Green.
    *   **Red:** Game Over visual (car accident/hit).
    *   **Yellow:** Text warning "Wait!".

---

### Tier 3: School Entrance (1 Final Level)

**f) The Memory Game**
*   **Scenario:** The player stands at the school entrance, unsure which classroom to go to. An NPC (classmate) approaches: *"If you beat me, I'll take you to the classroom."*
*   **Mechanic:** Find pairs of cards.
    *   Cards lie face down. Clicking flips them.
    *   If a pair is found, they remain face up.
*   **Goal:** Find all pairs within a specific time limit.

---

## Game End & Statistics
If all levels are completed and hearts remain:
1.  **Ending:** A cutscene/slideshow plays showing them arriving at the classroom (logical conclusion).
2.  **Statistics:** A summary screen displays:
    *   Total Play Time.
    *   Sequence of levels played.
    *   Number of mistakes made.
    *   Remaining hearts.
    *   *Comparison:* "Better/Worse than previous attempt."
3.  **Print Feature:** The statistics page can be printed.
4.  **Final Menu:**
    *   Play Again.
    *   Close Game.
    *   Save Score for Next Time.