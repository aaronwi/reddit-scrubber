// ==UserScript==
// @name         Reddit Scrubber
// @namespace    https://github.com/aaronwi
// @version      0.3
// @description  Tapermonkey script to replace Reddit comments with random text and delete them
// @author       aaronwi
// @match        https://old.reddit.com/user/*/comments/*
// @match        https://old.reddit.com/user/*/comments
// @match        https://*.reddit.com/user/*/comments/*
// @match        https://*.reddit.com/user/*/comments
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const ACTION_DELAY = 5 * 1000; //5 second delay to be safe
    const RANDOM_STRING_LENGTH = 100;
    let paused = false;

    console.log("Script executed.");
    function generateRandomString() {
        let result = '';
        for (let i = 0; i < RANDOM_STRING_LENGTH; i++) {
            result += String.fromCharCode(33 + Math.floor(Math.random() * 94));
        }
        return result;
    }

    function waitWhilePaused() {
        return new Promise(resolve => {
            const check = () => {
                if (!paused) {
                    resolve();
                } else {
                    setTimeout(check, 500);  // Check every 500ms
                }
            };
            check();
        });
    }

    async function processComment(commentElement) {
        try {
            console.log("Processing comments.");
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

                //get the comment id and hide it manually
                const id = commentElement.id;
                document.getElementById(id).style.display = 'none';

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
            await waitWhilePaused();
            await processComment(comments[i]);
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

    function addControlButton() {
        if (document.getElementById('processCommentsBtn')) {
            console.log("process comments button exists");
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
            processAllComments();
        };

        // Pause/Resume button
        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'pauseResumeBtn';
        pauseBtn.textContent = 'Pause';
        Object.assign(pauseBtn.style, {
            position: 'relative',
            marginLeft: '10px',
            backgroundColor: 'orange',
            color: 'black',
            padding: '10px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '5px',
            boxShadow: '0 0 5px rgba(0,0,0,0.3)',
        });
        pauseBtn.onclick = function () {
            paused = !paused;
            pauseBtn.textContent = paused ? 'Resume' : 'Pause';
            console.log(paused ? 'Paused' : 'Resumed');
        };

        // Find the target element and insert buttons
        const dropdownElement = document.querySelector('.dropdown.lightdrop');
        if (dropdownElement) {

            dropdownElement.parentNode.insertBefore(btn, dropdownElement.nextSibling);
            dropdownElement.parentNode.insertBefore(pauseBtn, btn.nextSibling);
            console.log("inserted buttons");
        } else {
            console.warn("Dropdown element not found");
        }
    }

    // insert control buttons on loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addControlButton);
    } else {
        addControlButton();
    }
})();
