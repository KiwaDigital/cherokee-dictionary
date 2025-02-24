// Load the CSV file
function loadCSV(file, callback) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n");
            const headers = rows[0].split(",");
            const results = rows.slice(1).map(row => {
                const values = row.split(",");
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            });
            callback(results);
        })
        .catch(error => console.error("Error loading CSV:", error));
}

// Search function
function searchWord() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    if (searchTerm) {
        // Save the search term to history
        saveSearchHistory(searchTerm);

        loadCSV("dictionary.csv", data => {
            const results = data.filter(row => row.Headword.toLowerCase().includes(searchTerm));
            if (results.length > 0) {
                results.forEach(row => {
                    const resultItem = document.createElement("div");
                    resultItem.className = "result-item";

                    let html = `<h2>${row.Headword}</h2>`;
                    for (const key in row) {
                        // Skip empty fields
                        if (row[key] && row[key].trim() !== "") {
                            if (key.includes("audio")) {
                                html += `<p><b>${key}:</b></p>`;
                                html += `<audio class="audio-player" controls><source src="${row[key]}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
                            } else {
                                html += `<p><b>${key}:</b> ${row[key]}</p>`;
                            }
                        }
                    }
                    html += "<hr>";
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

// Toggle Menu
document.getElementById("menuIcon").addEventListener("click", () => {
    const navLinks = document.getElementById("navLinks");
    navLinks.classList.toggle("active");
});

// Toggle History Sidebar
document.getElementById("historyLink").addEventListener("click", () => {
    const historySidebar = document.getElementById("historySidebar");
    historySidebar.style.right = historySidebar.style.right === "0px" ? "-300px" : "0px";
});

// Save Search History
function saveSearchHistory(term) {
    let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    history.unshift(term); // Add to the beginning of the array
    localStorage.setItem("searchHistory", JSON.stringify(history));
    displaySearchHistory();
}

// Display Search History
function displaySearchHistory() {
    const historyList = document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
    historyList.innerHTML = history.map(term => `<li>${term}</li>`).join("");
}

// Clear Search History
function clearSearchHistory() {
    localStorage.removeItem("searchHistory");
    displaySearchHistory();
}

// Add Clear History Button
const clearHistoryButton = document.createElement("button");
clearHistoryButton.textContent = "Clear History";
clearHistoryButton.addEventListener("click", clearSearchHistory);
document.querySelector(".history-sidebar").appendChild(clearHistoryButton);

// Initialize
displaySearchHistory();