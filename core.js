// Initialize archive from localStorage
let archive = JSON.parse(localStorage.getItem("archive")) || [];
let bookID_Number = parseInt(localStorage.getItem("bookID_Number")) || 1000;

// Save archive + ID
function saveArchive() {
    localStorage.setItem("archive", JSON.stringify(archive));
    localStorage.setItem("bookID_Number", bookID_Number);
}   

// // // // // HELPER FUNCTIONS // // // // //

// Shelf lookup map
const shelfMap = {
    "Shelf 1": "A",
    "Shelf 2": "B",
    "Shelf 3": "C",
    "Shelf 4": "D",
    "Shelf 5": "E",
    "Default": "X"
};

function getShelfLetter(shelfName) {
    if (!shelfName) return shelfMap["Default"];

    shelfName = shelfName.trim();
    return shelfMap[shelfName] || shelfMap["Default"];
}

function colorStatusCells() {
    document.querySelectorAll('#archiveDisplay td.status').forEach(td => {
        if(td.textContent.toLowerCase() === 'available') {
            td.classList.add('status-available');
        } else {
            td.classList.add('status-unavailable');
        }
    });
}

function displayArchive() {
    let container = document.getElementById("archiveDisplay");

    // Clear previous content
    if (archive.length === 0) {
        container.innerHTML = "<p>No books in archive.</p>"; // use =, not +=
        return;
    }

    let tableHTML = `
        <table class="archive-table">
            <thead>
                <tr>
                    <th>Book Details</th>
                    <th>Copy ID</th>
                    <th>Location</th>
                    <th>History (max 5)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    archive.forEach(book => {

        // Format details block (ID + Title + Author)
        let details = `
            <div class="book-details">
                <b>${book.Title}</b><br>
                ${book.Author}<br>
                ID: ${book.ID}
            </div>
        `;

        book.Copies.forEach((copy, index) => {

            // Limit history to 5 items
            let historyList = copy.History.slice(0, 5)
                .map(h => `<li>${h}</li>`).join("");

            // First copy row shows the details column
            if (index === 0) {
                tableHTML += `
                    <tr class="copy-row">
                        <td rowspan="${book.Copies.length}" class="details-cell">
                            ${details}
                        </td>
                        <td>${copy.CopyID}</td>
                        <td>${copy.Location || "—"}</td>
                        <td><ul class="history-list">${historyList}</ul></td>
                        <td class="status">${copy.Status}</td>

                    </tr>
                `;
            }
            // Additional copies only show copy info
            else {
                tableHTML += `
                    <tr class="copy-row">
                        <td>${copy.CopyID}</td>
                        <td>${copy.Location || "—"}</td>
                        <td><ul class="history-list">${historyList}</ul></td>
                        <td class="status">${copy.Status}</td>
                    </tr>
                `;
            }
        });
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML; // <-- replace content instead of appending
    colorStatusCells();
}

function deleteCopy_Multiple(inpBookID, inpCopyIDs) {

    const bookID = inpBookID.value.trim();
    const copyIDsInput = inpCopyIDs.value.trim();

    if (!copyIDsInput) {
        alert("Please enter at least one Copy ID.");
        return false;
    }

    // Normalize input
    const copyIDs = copyIDsInput.split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

    const bookIndex = archive.findIndex(b => b.ID === bookID);
    if (bookIndex === -1) {
        alert("Book ID not found.");
        return false;
    }

    const book = archive[bookIndex];
    const beforeCount = book.Copies.length;

    // Remove all matching copy IDs in ONE pass
    book.Copies = book.Copies.filter(copy => !copyIDs.includes(copy.CopyID));

    const removedCount = beforeCount - book.Copies.length;

    if (removedCount === 0) {
        //alert("No matching Copy IDs found.");
        return false;
    }

    saveArchive();        // save ONCE
    displayArchive();     // render ONCE

    return true;
}



// // // // // MAIN FUNCTIONS // // // // //

function addBook(inpTitle, inpAuthor, inpCopiesN, inpLocation) {

    let title = inpTitle.value.trim()
    let author = inpAuthor.value.trim()
    let copiesN = parseInt(inpCopiesN.value)
    let location = inpLocation.value.trim()

    let shelfLetter = getShelfLetter(location)

    // Validation
    if (title === "" || author === "" || isNaN(copiesN) || copiesN <= 0) {
        alert("Please provide valid book details."); return false;
    }

    // Generate new BookID
    let newNum = bookID_Number++
    let bookID = "B" + newNum

    // Generate the copies array
    let copies = []
    for (let i = 1; i <= copiesN; i++) {

        let copyNum = String(i).padStart(3, '0')    // e.g., 001, 002
        let copyID = copyNum + shelfLetter         //e.g., 001A, 002A

        // Create copy object
        let copyObject = { CopyID: copyID, Location: location, History: [], Status: "Available" }
        // Push to copies array
        copies.push(copyObject)
    }

    // Create book object
    let newBook = { Title: title, Author: author, ID: bookID, Location: location, Copies: copies }

    archive.push(newBook); saveArchive(); displayArchive();

    // Clear input fields
    inpTitle.value = ""; inpAuthor.value = ""; inpCopiesN.value = ""; inpLocation.value = ""
    return true
}

function removeBook(inpBookID) {

    let bookID = inpBookID.value.trim()
    let index = archive.findIndex(book => book.ID === bookID)

    if (index === -1) { alert("Book ID not found."); return false; }

    // Remove entire book from archive
    archive.splice(index, 1); saveArchive(); displayArchive(); return true
}

function deleteCopy(inpBookID, inpCopyID) {
    // Grab input values
    let bookID = inpBookID.value.trim()
    let copyID = inpCopyID.value.trim()

    // Find book and copy indices
    let bookIndex = archive.findIndex(book => book.ID === bookID)
    if (bookIndex === -1) { alert("Book ID not found."); return false; }

    let book = archive[bookIndex];

    let copyIndex = book.Copies.findIndex(copy => copy.CopyID === copyID)
    if (copyIndex === -1) { alert("Copy ID not found."); return false; }

    // Remove copy from book's copies array
    book.Copies.splice(copyIndex, 1); saveArchive(); displayArchive(); return true
}

function addCopy(inpBookID, inpCopiesN) {

    let bookID_toFind = inpBookID.value.trim();
    let bookIndex = archive.findIndex(book => book.ID === bookID_toFind);

    if (bookIndex === -1) { alert("Book ID not found."); return false }

    let book = archive[bookIndex];

    // FIX: remove shelfLocation (it does not exist)
    let location_toUse = book.Copies[0]?.Location || "Default";
    let shelfLetter = getShelfLetter(location_toUse);

    let currentCopiesN = book.Copies.length;
    let copies_toAddN = parseInt(inpCopiesN.value);

    for (let i = 1; i <= copies_toAddN; i++) {
        let copyNum = String(currentCopiesN + i).padStart(3, '0');
        let copyID = copyNum + shelfLetter;

        let copyObject = { 
            CopyID: copyID,
            Location: location_toUse,  // <-- ADD THIS so display shows location
            History: [],
            Status: "Available"
        };

        book.Copies.push(copyObject);
    }

    saveArchive();
    displayArchive();
    return true;
}

function editBook(inpBookID, inpNewTitle, inpNewAuthor, inpNewLocation) {
    let bookID = inpBookID.value.trim()
    let newTitle = inpNewTitle.value.trim()
    let newAuthor = inpNewAuthor.value.trim()
    let newLocation = inpNewLocation.value.trim()

    let bookIndex = archive.findIndex(book => book.ID === bookID)
    if (bookIndex === -1) { alert("Book ID not found."); return false; }
    let book = archive[bookIndex]
    if (newTitle !== "") book.Title = newTitle
    if (newAuthor !== "") book.Author = newAuthor
    if (newLocation !== "") {
        book.Location = newLocation
        let shelfLetter = getShelfLetter(newLocation)

        // Update each copy's ID to reflect new shelf letter
        book.Copies.forEach((copy, index) => {
            let copyNum = String(index + 1).padStart(3, '0') // e.g., 001, 002
            copy.CopyID = copyNum + shelfLetter
            copy.Location = newLocation
        });
    }

    saveArchive(); displayArchive(); return true;
}

// // // // // // // DOM Content Loaded // // // // // // //

document.addEventListener("DOMContentLoaded", () => {

    // Display archive on page load
    displayArchive();

    // --- Add Book Form ---
    const addBookForm = document.getElementById("addBookForm");
    if (addBookForm) {
        const bookTitle = document.getElementById("bookTitle");
        const bookAuthor = document.getElementById("bookAuthor");
        const numCopies = document.getElementById("numCopies");
        const shelfSelect = document.getElementById("shelfSelect");

        addBookForm.addEventListener("submit", (e) => {
            e.preventDefault();
            addBook(bookTitle, bookAuthor, numCopies, shelfSelect);
        });
    }

    // --- Remove Book Form ---
    const removeBookForm = document.getElementById("removeBookForm");
    if (removeBookForm) {
        const removeBookID = document.getElementById("removeBookID");

        removeBookForm.addEventListener("submit", (e) => {
            e.preventDefault();
            removeBook(removeBookID);
            removeBookID.value = "";  // clear input after removal
        });
    }

    // --- Edit Book Form ---
    const editBookForm = document.getElementById("editBookForm");
    if (editBookForm) {
        editBookForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const inpBookID = document.getElementById("editBookID");
            const inpNewTitle = document.getElementById("editTitle");
            const inpNewAuthor = document.getElementById("editAuthor");
            const inpNewLocation = document.getElementById("editLocation");

            const result = editBook(inpBookID, inpNewTitle, inpNewAuthor, inpNewLocation);
            if (result) {
                alert("Book updated successfully!");
                editBookForm.reset(); // clear the form
            }
        });
    }

    // --- Add Copy Form ---
    const addCopyForm = document.getElementById("addCopyForm");
    if (addCopyForm) {
        addCopyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const bookID = document.getElementById("addBookID");
            const count  = document.getElementById("addCopyCount");

            if (addCopy(bookID, count)) {
                alert("Copies added!");
                bookID.value = "";
                count.value = "";
            }
        });
    }

    // --- Remove Copies Form ---
    const removeCopyForm = document.getElementById("removeCopyForm");
    if (removeCopyForm) {
        removeCopyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const bookIDInput = document.getElementById("removeBookID");
            const copyIDsInput = document.getElementById("removeCopyIDs");

            deleteCopy_Multiple(bookIDInput, copyIDsInput);
            // Optional: clear inputs
            // bookIDInput.value = "";
            // copyIDsInput.value = "";
        });
    }

});


