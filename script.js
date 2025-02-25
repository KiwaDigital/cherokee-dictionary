// Load CSV file and process data
function loadCSV(file, callback) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n");
            const headers = rows[0].split(",");
            const results = rows.slice(1).map(row => {
                const values = row.split(",");
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index] || ""; // Ensure empty string for missing values
                    return obj;
                }, {});
            });
            callback(results);
        })
        .catch(error => console.error("Error loading CSV:", error));
}

// Perform search and display results
function searchWord() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (searchTerm) {
        saveSearchHistory(searchTerm);

        loadCSV("dictionary.csv", data => {
            const results = data.filter(row => {
                // Check if each column exists and is a string before calling toLowerCase
                const columnsToSearch = [
                    row.Headword,
                    row["English search 1"],
                    row["English search 2"],
                    row["English search 3"],
                    row["English search 4"],
                    row["Syllabary"]
                ];

                return columnsToSearch.some(column => 
                    typeof column === "string" && column.toLowerCase().includes(searchTerm)
                );
            });

            if (results.length > 0) {
                results.forEach(row => {
                    const resultItem = document.createElement("div");
                    resultItem.className = "result-item";

                    let html = `<h2>${row.Headword}</h2>`;
                    for (const key in row) {
                        if (row[key] && row[key].trim() !== "") {
                            if (key.includes("audio")) {
                                html += `<p><b>${key}:</b></p><audio class="audio-player" controls><source src="${row[key]}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
                            } else {
                                html += `<p><b>${key}:</b> ${row[key]}</p>`;
                            }
                        }
                    }

                    // Add Copy, Favourite, and Share buttons
                    html += `
                        <div class="action-buttons">
                            <button onclick="copyResult('${row.Headword}')">Copy</button>
                            <button onclick="addToFavourites('${row.Headword}')">Favourite</button>
                            <button onclick="shareResult('${row.Headword}')">Share</button>
                        </div>
                        <hr>
                    `;

                    resultItem.innerHTML = html;
                    resultsDiv.appendChild(resultItem);
                });
            } else {
                resultsDiv.innerHTML = "<p>No results found.</p>";
            }
        });
    } else {
        resultsDiv.innerHTML = "<p>Please enter a search term.</p>";
    }
}

// Copy result to clipboard
function copyResult(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert("Copied to clipboard: " + text))
        .catch(() => alert("Failed to copy text."));
}

// Add result to favourites
function addToFavourites(text) {
    let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
    if (!favourites.includes(text)) {
        favourites.push(text);
        localStorage.setItem("favourites", JSON.stringify(favourites));
        alert("Added to favourites: " + text);
    } else {
        alert("Already in favourites: " + text);
    }
}

// Share result with a direct link to the word
function shareResult(text) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(text)}`;
    if (navigator.share) {
        navigator.share({
            title: "Dictionary Result",
            text: `Check out the meaning of "${text}" in the dictionary!`,
            url: shareUrl
        })
        .then(() => console.log("Shared successfully"))
        .catch(error => console.error("Error sharing:", error));
    } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(shareUrl)
            .then(() => alert("Link copied to clipboard: " + shareUrl))
            .catch(() => alert("Failed to copy link."));
    }
}

// Check for a search term in the URL on page load
function checkUrlForSearchTerm() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get("search");
    if (searchTerm) {
        document.getElementById("searchInput").value = searchTerm;
        searchWord();
    }
}

// Toggle mobile menu
document.getElementById("menuIcon").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("active");
});

// Toggle history sidebar
document.getElementById("historyLink").addEventListener("click", () => {
    const historySidebar = document.getElementById("historySidebar");
    historySidebar.style.right = historySidebar.style.right === "0px" ? "-300px" : "0px";
});

// Close history sidebar
document.getElementById("closeHistoryButton").addEventListener("click", () => {
    document.getElementById("historySidebar").style.right = "-300px";
});

// Save search term to history
function saveSearchHistory(term) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    if (!history.includes(term)) {
        history.unshift(term);
        localStorage.setItem("searchHistory", JSON.stringify(history));
        displaySearchHistory();
    }
}

// Display search history
function displaySearchHistory() {
    const historyList = document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    historyList.innerHTML = history.map(term => `<li><a href="#" class="history-term">${term}</a></li>`).join("");

    document.querySelectorAll(".history-term").forEach(term => {
        term.addEventListener("click", (e) => {
            e.preventDefault();
            document.getElementById("searchInput").value = term.textContent;
            searchWord();
        });
    });
}

// Clear search history
function clearSearchHistory() {
    localStorage.removeItem("searchHistory");
    displaySearchHistory();
}

// Add clear history button
const clearHistoryButton = document.createElement("button");
clearHistoryButton.textContent = "Clear History";
clearHistoryButton.addEventListener("click", clearSearchHistory);
document.querySelector(".history-sidebar").appendChild(clearHistoryButton);

// Initialize
checkUrlForSearchTerm(); // Check for a search term in the URL on page load
displaySearchHistory();

const waveformCanvas = document.getElementById('waveform');
        const waveformCtx = waveformCanvas.getContext('2d');
        const meterLevel = document.getElementById('meter-level');
        let analyser;
        let bufferLength;
        let dataArray;

        recordButton.addEventListener('click', async () => {
            // ... (your existing recording start logic) ...

            // Initialize audio analysis
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream); // Use the same stream
            analyser = audioCtx.createAnalyser();
            source.connect(analyser);

            analyser.fftSize = 2048; // Adjust for waveform detail
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            drawWaveform();
            updateMeter(); // Start updating the meter
        });

        stopButton.addEventListener('click', () => {
            // ... (your existing stop logic) ...
            if (analyser) {
                analyser.disconnect(); // Disconnect the analyser
                analyser = null;
            }
        });

        function drawWaveform() {
            if (!analyser) return; // If not recording, exit.

            analyser.getByteTimeDomainData(dataArray);

            waveformCtx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
            waveformCtx.beginPath();
            const sliceWidth = waveformCanvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * waveformCanvas.height / 2;

                if (i === 0) {
                    waveformCtx.moveTo(x, y);
                } else {
                    waveformCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            waveformCtx.strokeStyle = 'blue';  // Waveform color
            waveformCtx.lineTo(waveformCanvas.width, waveformCanvas.height / 2); // Close the line
            waveformCtx.stroke();
            requestAnimationFrame(drawWaveform);
        }

        function updateMeter() {
            if (!analyser) return;

            analyser.getByteFrequencyData(dataArray); // Use frequency data for meter

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const level = (average / 255) * 100; // Normalize to 0-100%

            meterLevel.style.width = level + '%';
            requestAnimationFrame(updateMeter);
        }