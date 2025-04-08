document.addEventListener("DOMContentLoaded", () => {
  const symbols = ["🍒", "🍋", "🍇", "🍉", "🍊", "⭐️", "💎"];
  const slotElements = document.querySelectorAll('#slot span');
  const resultText = document.getElementById('result');
  const coinDisplay = document.getElementById('coins');
  const spinButton = document.getElementById('spinButton');
  const betSelect = document.getElementById('betSelect');
  const debugWinBtn = document.getElementById('debugWinBtn');
  const autoSpinButton = document.getElementById('autoSpinButton');
  const resetButton = document.getElementById('resetButton');
  const collectWinButton = document.getElementById('collectWinButton');
  const riskWinButton = document.getElementById('riskWinButton');

  let coins = 1000;
  let autoSpinInterval = null;
  const spinCost = 50;
  const paytable = { 3: 100, 4: 200, 5: 500 };
  let currentWinAmount = 0;
  let isDebugMode = false;
  let debugSpinCount = 0;
  const maxDebugSpins = 5;

  function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
  }

  function playSound(type) {
    const audio = new Audio();
    if (type === 'spin') {
      audio.src = './sounds/spin.mp3'; // Spielothek-Sound für Drehen
    } else if (type === 'win') {
      audio.src = './sounds/win.mp3'; // Gewinnsound
    } else if (type === 'coin') {
      audio.src = './sounds/coin.mp3'; // Sound für Coins
    }
    audio.play();
  }

  function updateCoins(amount) {
    coins += amount;
    coinDisplay.textContent = coins;
    checkSpinState();
  }

  function checkSpinState() {
    spinButton.disabled = coins < spinCost;
  }

  function flashWinEffect() {
    document.body.classList.add('flash-win');
    setTimeout(() => {
      document.body.classList.remove('flash-win');
    }, 400);
  }

  function addCoins() {
    updateCoins(10);
    resultText.textContent = "🪙 +10 Coins aufgeladen!";
    playSound('coin'); // Spiele den Coin-Sound ab
  }

  function resetGame() {
    coins = 1000;
    updateCoins(0);
    resultText.textContent = "Spiel zurückgesetzt!";
  }

  function toggleDebugMode() {
    isDebugMode = !isDebugMode; // Toggle debug mode
    const debugBtn = document.getElementById('debugWinBtn');
    if (isDebugMode) {
      resultText.textContent = "🛠️ Debug-Modus aktiviert!";
      debugBtn.textContent = "❌ Debug OFF";
    } else {
      resultText.textContent = "🛠️ Debug-Modus deaktiviert!";
      debugBtn.textContent = "✅ Debug ON";
    }
  }

  function getWinningSymbols() {
    const winStrength = Math.floor(Math.random() * 3) + 3; // Random win level: 3, 4, or 5
    const winningSymbol = getRandomSymbol(); // Choose a random symbol for the win
    const result = Array(5).fill(null);

    // Fill the first N slots with the winning symbol
    for (let i = 0; i < winStrength; i++) {
      result[i] = winningSymbol;
    }

    // Fill remaining slots with random symbols
    for (let i = winStrength; i < result.length; i++) {
      result[i] = getRandomSymbol();
    }

    return result;
  }

  function showWinDecisionPopup(amount) {
    currentWinAmount = amount;
    document.getElementById('winPopupAmount').textContent = amount;
    document.getElementById('winPopup').style.display = 'flex';
    spinButton.disabled = true; // Disable spin button while popup is active
  }

  function collectWin() {
    updateCoins(currentWinAmount);
    resultText.textContent = `💰 ${currentWinAmount} Coins gesammelt!`;
    closeWinPopup();
  }

  function riskWin() {
    const isWin = Math.random() < 0.5; // 50/50 chance
    if (isWin) {
      currentWinAmount *= 2;
      document.getElementById('winPopupAmount').textContent = currentWinAmount;
      resultText.textContent = `🎉 Risiko gewonnen! Neuer Gewinn: ${currentWinAmount} Coins`;
    } else {
      currentWinAmount = 0;
      resultText.textContent = "💥 Risiko verloren! Kein Gewinn.";
      closeWinPopup();
    }
  }

  function closeWinPopup() {
    document.getElementById('winPopup').style.display = 'none';
    spinButton.disabled = false; // Re-enable spin button
  }

  function spin() {
    const bet = parseInt(betSelect.value);
    if (coins < bet) {
      resultText.textContent = "❌ Nicht genug Coins!";
      return;
    }

    updateCoins(-bet);
    resultText.textContent = "";
    playSound('spin'); // Spielothek-Sound abspielen
    spinButton.disabled = true; // Disable spin button during spin

    const delays = [300, 600, 900, 1200, 1500]; // Staggered stop times
    let result = [];

    slotElements.forEach((el, index) => {
      el.classList.add('spinning'); // Add spinning visual effect
      let spinInterval = setInterval(() => {
        el.textContent = getRandomSymbol(); // Change symbol quickly
      }, 100); // Change every 100ms

      setTimeout(() => {
        clearInterval(spinInterval); // Stop spinning after delay

        if (isDebugMode) {
          // Force guaranteed win logic
          if (result.length === 0) {
            result = getWinningSymbols(); // Generate the forced winning combination
          }
          el.textContent = result[index]; // Set the forced symbol
        } else {
          // Normal random logic
          el.textContent = getRandomSymbol();
          result[index] = el.textContent;
        }

        el.classList.remove('spinning'); // Remove spinning effect

        if (index === slotElements.length - 1) {
          // Evaluate result after the last reel stops
          setTimeout(() => {
            const winCount = calculateWin(result);
            if (winCount >= 3) {
              const winAmount = paytable[winCount] || 0;
              resultText.textContent = `🎉 Gewinn! +${winAmount} Coins!`;
              showWinDecisionPopup(winAmount); // Show win decision popup
            } else {
              resultText.textContent = "😅 Kein Gewinn. Weiterdrehen!";
              spinButton.disabled = false; // Re-enable spin button
            }
          }, 200);
        }
      }, delays[index]); // Staggered stop for each reel
    });
  }

  function handleRiskPhase(winAmount) {
    spinButton.disabled = true; // Disable spin during risk phase
    document.getElementById('riskPhase').style.display = 'block';
    document.getElementById('riskAmount').textContent = winAmount;
  }

  function handleRisk(action) {
    if (action === 'collect') {
      updateCoins(currentWinAmount);
      resultText.textContent = `💰 ${currentWinAmount} Coins gesammelt!`;
      resetRiskPhase();
    } else if (action === 'risk') {
      const isWin = Math.random() < 0.5; // 50/50 chance
      if (isWin) {
        currentWinAmount *= 2;
        document.getElementById('riskAmount').textContent = currentWinAmount;
        resultText.textContent = `🎉 Risiko gewonnen! Neuer Gewinn: ${currentWinAmount} Coins`;
      } else {
        currentWinAmount = 0;
        resultText.textContent = "💥 Risiko verloren! Kein Gewinn.";
        resetRiskPhase();
      }
    }
  }

  function resetRiskPhase() {
    currentWinAmount = 0;
    document.getElementById('riskPhase').style.display = 'none';
    spinButton.disabled = false; // Re-enable spin button
  }

  function calculateWin(result) {
    let count = 1;
    for (let i = 1; i < result.length; i++) {
      if (result[i] === result[i - 1]) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  function highlightWinningSymbols(count) {
    for (let i = 0; i < count; i++) {
      slotElements[i].classList.add('highlight');
      setTimeout(() => slotElements[i].classList.remove('highlight'), 1000);
    }
  }

  function toggleAutoSpin() {
    const autoSpinButton = document.getElementById('autoSpinButton');
    if (autoSpinInterval) {
      clearInterval(autoSpinInterval);
      autoSpinInterval = null;
      autoSpinButton.textContent = "Auto Spin";
    } else {
      autoSpinButton.textContent = "Stop Auto Spin";
      autoSpinInterval = setInterval(() => {
        if (!spinButton.disabled) {
          spin();
        }
      }, 100); // Trigger spins quickly
    }
  }

  // Event listeners für die Buttons
  spinButton.addEventListener('click', spin);
  debugWinBtn.addEventListener('click', toggleDebugMode);
  autoSpinButton.addEventListener('click', toggleAutoSpin);
  resetButton.addEventListener('click', resetGame);
  collectWinButton.addEventListener('click', collectWin);
  riskWinButton.addEventListener('click', riskWin);

  checkSpinState();
});