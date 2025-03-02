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

// Generate Part of Speech Buttons
function generatePartOfSpeechButtons(data) {
    const partOfSpeechButtons = document.getElementById("partOfSpeechButtons");
    const uniquePartsOfSpeech = [...new Set(data.map(row => row["Part of speech"]))]; // Get unique values

    // Clear existing buttons
    partOfSpeechButtons.innerHTML = "";

    // Create a button for each unique Part of Speech
    uniquePartsOfSpeech.forEach(part => {
        if (part.trim() !== "") {
            const button = document.createElement("button");
            button.textContent = part;
            button.addEventListener("click", () => filterByPartOfSpeech(part, data));
            partOfSpeechButtons.appendChild(button);
        }
    });
}

// Filter words by Part of Speech
function filterByPartOfSpeech(partOfSpeech, data) {
    const filteredData = data.filter(row => row["Part of speech"] === partOfSpeech);
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

// Initialize
loadCSV("dictionary.csv", data => {
    generatePartOfSpeechButtons(data); // Generate Part of Speech buttons
    displayWordList(data); // Display full word list initially
});