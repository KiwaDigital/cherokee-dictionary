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
function searchWord(searchTerm = null) {
    const searchInput = document.getElementById("searchInput");
    const searchTermValue = searchTerm || searchInput.value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!searchTermValue) {
        resultsDiv.innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    if (!searchTerm) {
        saveSearchHistory(searchTermValue);
    }

    loadCSV("dictionary.csv", data => {
        const results = data.filter(row => {
            const columnsToSearch = [
                row.Headword,
                row["Translation 1A"],
                row["English gloss 1"],
                row["English gloss 2"],
                row["English gloss 3"],
                row["English gloss 4"],
                row.Syllabary,
                row.Practical,
                row["Compare 1"],
                row["Compare 2"],
                row["Compare 3"],
                row["Compare 4"]
            ];

            return columnsToSearch.some(column => 
                typeof column === "string" && column.toLowerCase().includes(searchTermValue)
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
                        } else if (key === "Practical" || key.startsWith("Compare")) {
                            // Add click event to 'Practical' and 'Compare' values
                            html += `<p><b>${key}:</b> <span class="searchable" onclick="searchWord('${row[key].toLowerCase()}')">${row[key]}</span></p>`;
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

// Add CSS for the clickable 'Practical' and 'Compare' values
const style = document.createElement('style');
style.innerHTML = `
    .searchable {
        color: blue;
        text-decoration: underline;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

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

        // Add click event listeners to history terms
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

// Display search history
function displaySearchHistory() {
    const historyList = document.getElementById("historyList");
    try {
        const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
        historyList.innerHTML = history.map(term => `<li><a href="#" class="history-term">${term}</a></li>`).join("");

        // Add click event listeners to history terms
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

// Toggle history sidebar visibility
function toggleHistorySidebar() {
    const historySidebar = document.getElementById("historySidebar");
    if (historySidebar.style.display === "block") {
        historySidebar.style.display = "none"; // Hide sidebar
    } else {
        historySidebar.style.display = "block"; // Show sidebar
        displaySearchHistory(); // Load and display history
    }
}

// Add event listener to the history link/button
document.getElementById("historyLink").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default link behavior
    toggleHistorySidebar(); // Toggle the history sidebar
});

// Close history sidebar when the close button is clicked
document.getElementById("closeHistoryButton").addEventListener("click", () => {
    document.getElementById("historySidebar").style.display = "none";
});

document.getElementById("historyLink").addEventListener("click", (e) => {
    e.preventDefault();
    console.log("History link clicked"); // Debugging
    toggleHistorySidebar();
});

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
                        html += `<p><b>${key}:</b></p><audio class="audio-player" controls><source src="Audio/${result[key]}" type="audio/mpeg">Your browser does not support the audio element.</audio>`;
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

// Add result to favourites
function addToFavourites(text) {
    try {
        let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
        if (!favourites.includes(text)) {
            favourites.push(text);
            localStorage.setItem("favourites", JSON.stringify(favourites));
            alert("Added to favourites: " + text);
            displayFavourites(); // Update the favourites list
        } else {
            alert("Already in favourites: " + text);
        }
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Display favourites
function displayFavourites() {
    const favouritesList = document.getElementById("favouritesList");
    try {
        const favourites = JSON.parse(localStorage.getItem("favourites")) || [];
        favouritesList.innerHTML = favourites.map(term => `
            <li>
                <a href="#" class="favourite-term">${term}</a>
                <button onclick="removeFromFavourites('${term}')">Remove</button>
            </li>
        `).join("");

        document.querySelectorAll(".favourite-term").forEach(term => {
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

// Remove from favourites
function removeFromFavourites(term) {
    try {
        let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
        favourites = favourites.filter(item => item !== term);
        localStorage.setItem("favourites", JSON.stringify(favourites));
        displayFavourites(); // Update the favourites list
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Clear favourites
function clearFavourites() {
    try {
        localStorage.removeItem("favourites");
        displayFavourites(); // Update the favourites list
    } catch (error) {
        console.error("Error accessing localStorage:", error);
    }
}

// Toggle favourites sidebar
document.getElementById("favouritesLink").addEventListener("click", () => {
    const favouritesSidebar = document.getElementById("favouritesSidebar");
    favouritesSidebar.style.right = favouritesSidebar.style.right === "0px" ? "-300px" : "0px";
});

// Close favourites sidebar
document.getElementById("closeFavouritesButton").addEventListener("click", () => {
    document.getElementById("favouritesSidebar").style.right = "-300px";
});

// Add clear favourites button
const clearFavouritesButton = document.createElement("button");
clearFavouritesButton.textContent = "Clear Favourites";
clearFavouritesButton.addEventListener("click", clearFavourites);
document.querySelector(".favourites-sidebar").appendChild(clearFavouritesButton);

// Initialize
displayFavourites(); // Display favourites on page load

// Get the modal
const modal = document.getElementById("creditsModal");

// Get the button that opens the modal
const btn = document.getElementById("creditsButton");

// Get the <span> element that closes the modal
const span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
modal.style.display = "block";
	};

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
	modal.style.display = "none";
	};

// When the user clicks anywhere outside the modal, close it
window.onclick = function(event) {
	if (event.target === modal) {
		modal.style.display = "none";
	}
        };
        
        // JavaScript to handle the video modal
        const videoModal = document.getElementById("videoModal");
        const videoButton = document.getElementById("videoButton");
        const closeModal = document.getElementsByClassName("close")[0];

        // Open the modal when the "Watch Video" button is clicked
        videoButton.onclick = function(event) {
            event.preventDefault();
            videoModal.style.display = "flex";
        };

        // Close the modal when the close button is clicked
        closeModal.onclick = function() {
            videoModal.style.display = "none";
        };

        // Close the modal when clicking outside the modal content
        window.onclick = function(event) {
            if (event.target === videoModal) {
                videoModal.style.display = "none";
            }
        };
        
        // Full-Screen Functionality
        const fullscreenButton = document.getElementById('fullscreenButton');

        fullscreenButton.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen(); // Request full-screen mode
                fullscreenButton.innerHTML = '<i class="fas fa-compress"></i>'; // Change icon to compress
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen(); // Exit full-screen mode
                    fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>'; // Change icon back to expand
                }
            }
        });

        // Listen for full-screen change events
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                fullscreenButton.innerHTML = '<i class="fas fa-expand"></i>'; // Reset icon if exiting full-screen
            }
        });