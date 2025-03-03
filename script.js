// Load CSV file and process data
function loadCSV(file, callback) {
    fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
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

    if (!searchTerm) {
        resultsDiv.innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    saveSearchHistory(searchTerm);

    loadCSV("dictionary.csv", data => {
        const results = data.filter(row => {
            const columnsToSearch = [
                row.Headword,
                row["Translation 1A"],
                row.Syllabary
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
                            html += `<p><b>${key}:</b></p><audio class="audio-player" controls><source src="Audio/${row[key]}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
                        } else {
                            html += `<p><b>${key}:</b> ${row[key]}</p>`;
                        }
                    }
                }

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
}

// Generate Part of Speech Dropdown
function generatePartOfSpeechDropdown(data) {
    const partOfSpeechDropdown = document.getElementById("partOfSpeechDropdown");
    const uniquePartsOfSpeech = [...new Set(data.map(row => row["Part of speech"]))]; // Get unique values

    // Clear existing options
    partOfSpeechDropdown.innerHTML = "";

    // Add a default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Part of Speech";
    partOfSpeechDropdown.appendChild(defaultOption);

    // Create an option for each unique Part of Speech
    uniquePartsOfSpeech.forEach(part => {
        if (part.trim() !== "") {
            const option = document.createElement("option");
            option.value = part;
            option.textContent = part;
            partOfSpeechDropdown.appendChild(option);
        }
    });

    // Add event listener to filter data when an option is selected
    partOfSpeechDropdown.addEventListener("change", (event) => {
        const selectedPartOfSpeech = event.target.value;
        filterByPartOfSpeech(selectedPartOfSpeech, data);
    });
}

// Filter words by Part of Speech
function filterByPartOfSpeech(partOfSpeech, data) {
    let filteredData;
    if (partOfSpeech) {
        filteredData = data.filter(row => row["Part of speech"] === partOfSpeech);
    } else {
        filteredData = data; // Show all data if no part of speech is selected
    }
    displayWordList(filteredData);
}

// Display full list of Headwords and English Search 1
function displayWordList(data) {
    const wordListItems = document.getElementById("wordListItems");
    wordListItems.innerHTML = data.map(row => `
        <li onclick="displayFullRange('${row.Headword}')">
            <strong>${row.Headword}</strong>: ${row["Entry 1A"]}
        </li>
    `).join("");
}

// Initialize
loadCSV("dictionary.csv", data => {
    generatePartOfSpeechDropdown(data); // Generate Part of Speech dropdown
    displayWordList(data); // Display full word list initially
});

// Copy result to clipboard
function copyResult(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert("Copied to clipboard: " + text))
        .catch(() => alert("Failed to copy text."));
}

// Add result to favourites
function addToFavourites(text) {
    try {
        let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
        if (!favourites.includes(text)) {
            favourites.push(text);
            localStorage.setItem("favourites", JSON.stringify(favourites));
            alert("Added to favourites: " + text);
        } else {
            alert("Already in favourites: " + text);
        }
    } catch (error) {
        console.error("Error accessing localStorage:", error);
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
    try {
        let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
        if (!history.includes(term)) {
            history.unshift(term);
            localStorage.setItem("searchHistory", JSON.stringify(history));
            displaySearchHistory();
        }
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Display search history
function displaySearchHistory() {
    const historyList = document.getElementById("historyList");
    try {
        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
        historyList.innerHTML = history.map(term => `<li><a href="#" class="history-term">${term}</a></li>`).join("");

        document.querySelectorAll(".history-term").forEach(term => {
            term.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("searchInput").value = term.textContent;
                searchWord();
            });
        });
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Clear search history
function clearSearchHistory() {
    try {
        localStorage.removeItem("searchHistory");
        displaySearchHistory();
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Add clear history button
const clearHistoryButton = document.createElement("button");
clearHistoryButton.textContent = "Clear History";
clearHistoryButton.addEventListener("click", clearSearchHistory);
document.querySelector(".history-sidebar").appendChild(clearHistoryButton);

// Initialize
checkUrlForSearchTerm(); // Check for a search term in the URL on page load
displaySearchHistory();

// Display full list of Headwords and English Search 1
function displayWordList(data) {
    const wordListItems = document.getElementById("wordListItems");
    wordListItems.innerHTML = data.map(row => `
        <li onclick="displayFullRange('${row.Headword}')">
            <strong>${row.Headword}</strong>: ${row["Translation 1A"]}
        </li>
    `).join("");
}

// Display full range of data for a selected word
function displayFullRange(headword) {
    loadCSV("dictionary.csv", data => {
        const result = data.find(row => row.Headword === headword);
        if (result) {
            const fullRangeContent = document.getElementById("fullRangeContent");
            let html = `<h3>${result.Headword}</h3>`;
            for (const key in result) {
                if (result[key] && result[key].trim() !== "") {
                    if (key.includes("audio")) {
                        html += `<p><b>${key}:</b></p><audio class="audio-player" controls><source src="${result[key]}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
                    } else {
                        html += `<p><b>${key}:</b> ${result[key]}</p>`;
                    }
                }
            }
            fullRangeContent.innerHTML = html;
        }
    });
}

// Initialize
loadCSV("dictionary.csv", data => {
    displayWordList(data);
});