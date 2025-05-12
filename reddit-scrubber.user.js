// ==UserScript==
// @name         Reddit Scrubber
// @namespace    https://github.com/aaronwi
// @version      0.2
// @description  Tapermonkey script to replace Reddit comments with random text and delete them
// @author       aaronwi
// @match        https://old.reddit.com/user/*/comments/*
// @match        https://old.reddit.com/user/*/comments
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const ACTION_DELAY = 5 * 1000; //5 second delay to be safe
    const RANDOM_STRING_LENGTH = 100;


    function generateRandomString() {
        let result = '';
        for (let i = 0; i < RANDOM_STRING_LENGTH; i++) {
            result += String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }
        return result;
    }

    async function processComment(commentElement) {
        try {
            const editButton = commentElement.querySelector('a.edit-usertext');
            if (!editButton) return false;

            // Click edit
            editButton.click();
            await sleep(1000);

            const textarea = commentElement.querySelector('textarea');
            if (textarea) {
                textarea.value = generateRandomString();
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                const saveBtn = commentElement.querySelector('button.save');
                if (saveBtn) {
                    saveBtn.click();
                    await sleep(ACTION_DELAY);
                }
            }

            // Open delete confirmation
            const deleteForm = commentElement.querySelector('form.del-button');
            if (!deleteForm) {
                console.warn("Delete form not found");
                return false;
            }

            const deleteToggle = deleteForm.querySelector('.togglebutton');
            if (!deleteToggle) {
                console.warn("Delete toggle not found");
                return false;
            }
            deleteToggle.click();
            await sleep(1000); // Let the "yes/no" prompt load

            const yesBtn = deleteForm.querySelector('.yes');
            if (yesBtn && yesBtn.style.display !== 'none') {
                yesBtn.click();
                console.log("Deleted comment.");

                return true;
            } else {
                console.warn("Yes button not found or not visible.");
            }
        } catch (e) {
            console.error("Error processing comment:", e);
        }

        return false;
    }

    async function processAllComments() {
        if (!confirm('WARNING: This will overwrite and delete ALL visible comments. Continue?')) return;

        const comments = document.querySelectorAll('.thing.comment');
        const status = createStatusElement();

        for (let i = 0; i < comments.length; i++) {
            status.textContent = `Processing ${i + 1}/${comments.length}...`;
            await processComment(comments[i]);
            debugger;
            await sleep(ACTION_DELAY);
        }

        status.textContent = `Processed ${comments.length} comments.`;
        setTimeout(() => status.remove(), 4000);
    }

    function createStatusElement() {
        const status = document.createElement('div');
        Object.assign(status.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #ccc',
            zIndex: '9999'
        });
        status.textContent = 'Ready';
        document.body.appendChild(status);
        return status;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log("Script loaded");

    function addControlButton() {
        if (document.getElementById('processCommentsBtn')) {
            console.log("Button already exists, skipping creation");
            return;
        }

        // Create the button element
        const btn = document.createElement('button');
        btn.id = 'processCommentsBtn';
        btn.textContent = 'OVERWRITE & DELETE COMMENTS';
        Object.assign(btn.style, {
            position: 'relative', // Relative to its parent element
            marginLeft: '10px',
            backgroundColor: 'red',
            color: 'white',
            padding: '10px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px',
            boxShadow: '0 0 5px rgba(0,0,0,0.3)',
        });

        btn.onclick = function() {
            console.log("Button clicked");
            // Call your function here
            processAllComments();
        };

        // Find the target element
        const dropdownElement = document.querySelector('.dropdown.lightdrop');
        if (dropdownElement) {
            dropdownElement.parentNode.insertBefore(btn, dropdownElement.nextSibling);
            console.log("Added control button after the dropdown");
        } else {
            console.warn("Dropdown element not found");
        }
    }

    // Use window.onload for more reliable execution
    window.onload = function () {
        addControlButton();
    };
})();
