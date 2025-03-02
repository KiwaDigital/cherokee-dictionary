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
                row["Entry 1A"],
                row["English search 2"],
                row["English search 3"],
                row["English search 4"],
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
                        } else if (key === "Part of speech") {
                            // Link the "Part of speech" value to a PDF
                            const pdfLink = `path/to/pdf/${row[key].toLowerCase().replace(/\s+/g, '-')}.pdf`;
                            html += `<p><b>${key}:</b> <a href="${pdfLink}" target="_blank">${row[key]}</a></p>`;
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
                    } else if (key === "Part of speech") {
                        // Link the "Part of speech" value to a PDF
                        const pdfLink = `path/to/pdf/${result[key].toLowerCase().replace(/\s+/g, '-')}.pdf`;
                        html += `<p><b>${key}:</b> <a href="${pdfLink}" target="_blank">${result[key]}</a></p>`;
                    } else {
                        html += `<p><b>${key}:</b> ${result[key]}</p>`;
                    }
                }
            }
            fullRangeContent.innerHTML = html;
        }
    });
}