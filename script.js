// Load XLSX file and process data
function loadXLSX(file, callback) {
    fetch(file)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0]; // Use the first sheet
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const headers = jsonData[0]; // First row is headers
            const results = jsonData.slice(1).map(row => {
                return headers.reduce((obj, header, index) => {
                    obj[header] = row[index];
                    return obj;
                }, {});
            });

            callback(results);
        })
        .catch(error => console.error("Error loading XLSX:", error));
}

// Perform search and display results
function searchWord() {
    const searchTerm = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (searchTerm) {
        saveSearchHistory(searchTerm);

        loadXLSX("dictionary.xlsx", data => {
            const results = data.filter(row => row.Headword.toLowerCase().includes(searchTerm));
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
displaySearchHistory();