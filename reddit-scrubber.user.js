// ==UserScript==
// @name         Reddit Scrubber
// @namespace    https://github.com/aaronwi
// @version      0.5.1
// @description  Tapermonkey script to replace Reddit comments with random text and delete them
// @author       aaronwi
// @match        https://old.reddit.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(async function () {
    'use strict';

    const ACTION_DELAY = 10 * 1000; //10 second delay to be safe
    const RANDOM_STRING_LENGTH = 100;
    const TOTAL_ELEMENTS = 25;

    let currentCount = await GM_getValue("currentCount", 0);
    let continueProcessing = await GM_getValue("continueProcessing", false);

    const username = document.querySelector('.user a')?.textContent.trim().toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    let paused = false;

    const urlParams = new URLSearchParams(window.location.search);
    const isPaginated = urlParams.has("count") && urlParams.has("after");
    const isNewTab = urlParams.has("NewTabToDelete");

    //check if paginated and currently processing and continue automation
    if (isPaginated && continueProcessing) {
        await processAllThings();
    
    } else if (isNewTab) { //Check if it's a spawned tab for a self post
        await sleep(1000);
        await deleteSelfPost();

        // try {
        //     const deleteResult = await deleteSelfPost();

        //     if (deleteResult.success) {
        //         // Send message back to opener tab
        //         window.opener.postMessage({
        //             type: 'delete-success',
        //             postId: deleteResult.postId,
        //         }, 'https://old.reddit.com');
        //     } else {
        //         window.opener.postMessage({
        //             type: 'delete-failure',
        //             postId: deleteResult.postId,
        //             reason: deleteResult.reason || "Unknown error"
        //         }, 'https://old.reddit.com');
        //     }
        // } catch (err) {
        //     console.error("Error during deleteSelfPost:", err);
        //     window.opener.postMessage({
        //         type: 'delete-failure',
        //         postId: null,
        //         reason: err.message || "Exception thrown"
        //     }, 'https://old.reddit.com');
        // }
    }

    async function deleteSelfPost() {
        try {
            const postId = document.querySelector('[data-fullname]')?.dataset.fullname;
            if (!postId) return reject(new Error("Could not find postId"));

            // Click edit button
            const editButton = document.querySelector('a.edit-usertext');
            if (!editButton) return false;

            editButton.click();
            await sleep(1000);

            //enter text
            const textarea = document.querySelector('.usertext-edit textarea');
            if (!textarea) throw new Error("Textarea not found");
            
            textarea.value = generateRandomString();
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
            //find and click save
            const saveBtn = document.querySelector('button.save');
            if (!saveBtn) throw new Error("Save button not found");

            saveBtn.click();
            await sleep(ACTION_DELAY);
            

            //Click delete
            const deleteBtn = document.querySelector('form.del-button .togglebutton');
            if (!deleteBtn) throw new Error("Delete button not found");
            deleteBtn.click();
            await sleep(1000); // Let the "yes/no" prompt load

            const confirmDeleteBtn = document.querySelector('form.del-button .yes');
            if (!confirmDeleteBtn) throw new Error("Confirm delete button not found");

            confirmDeleteBtn.click();
            await sleep(1000);
            
            // Inform opener
            // if (window.opener) {
            //     window.opener.postMessage({ type: "postDeleted", postId }, "*");
            // }

            window.close();
            return true;
            
        } catch (err) {
            console.error("Error in deleteSelfPost:", err);
            throw err;
        }
    }


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

    async function processAllThings() {
        //comments use classes: .thing, .comment
        //link posts classes: .thing, link
        //self posts use classes: .thing, .link, .self
        
        //current page things
        const things = document.querySelectorAll('.thing');
        const status = createStatusElement();
        const isLastPage = things.length < TOTAL_ELEMENTS;

        //check if last/blank page
        if (things.length === 0) {
            status.textContent = "No items found on this page.";
            await GM_setValue("continueProcessing", false);
            await GM_setValue("currentCount", 0);
            status.remove();
            return;
        }

        for (let i = 0; i < things.length; i++) {
            
            await waitWhilePaused();
            
            if (!continueProcessing) {
                console.log("Stopped mid-processing.");
                await GM_setValue("continueProcessing", false);
                await GM_setValue("currentCount", 0);
                status.remove();
                return;
            }

            status.textContent = `Processing item ${i + 1} of ${things.length}`;

            const el = things[i];

            if (el.classList.contains("comment")) {
                await processComment(el);
            } else if (el.classList.contains("self")) {
                await processSelfPost(el);
            } else {
                await processLinkPost(el);
            }

            await sleep(ACTION_DELAY);

        }

        // Move to next page if not last page and still processing
        if (!isLastPage && continueProcessing) {

            // Get the last thing to get its ID for next page
            const last = things[things.length - 1];
            const lastId = last?.getAttribute("data-fullname");

            if (lastId) {
                currentCount += 25;  // update local
                await GM_setValue("currentCount", currentCount);  // save persistently
                const nextUrl = `${window.location.pathname}?count=${currentCount}&after=${lastId}`;
                window.location.href = nextUrl;
            } else {
                // End of pagination
                await GM_setValue("continueProcessing", false);
                await GM_setValue("currentCount", 0);
                status.textContent = "Finished processing.";
            } 
        }
    }

    async function processComment(commentElement) {
        try {
            console.log("Processing comment");
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
            const deleteToggle = deleteForm.querySelector('.togglebutton');
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

    async function processSelfPost(postElement) {
        const permalink = `https://old.reddit.com${postElement.dataset.permalink}`;
        const postId = postElement.dataset.fullname;

        // Open new tab
        const newTab = window.open(`${permalink}?NewTabToDelete=true`, "_blank");

        if (!newTab) {
            window.alert("You need to allow popups to delete self posts");
            return;
        }

        //quick hack to just wait for the window to finish processing
        await sleep(10000);
        // Wait for the delete result via postMessage
        //const result = await waitForDeleteMessage(postId);

        // if (result.success) {
        //     console.log(`Self-post ${postId} deleted`);
        // } else {
        //     console.warn(`Failed to delete self-post ${postId}: ${result.reason}`);
        // }
    }

    async function processLinkPost(postElement) {
        // Open delete confirmation
        const deleteForm = postElement.querySelector('form.del-button');
        const deleteToggle = deleteForm.querySelector('.togglebutton');
        deleteToggle.click();
        await sleep(1000); // Let the "yes/no" prompt load

        const yesBtn = deleteForm.querySelector('.yes');
        if (yesBtn && yesBtn.style.display !== 'none') {
            yesBtn.click();
            console.log("Deleted comment.");

            //get the comment id and hide it manually
            const id = postElement.id;
            document.getElementById(id).style.display = 'none';

            return true;
        } else {
            console.warn("Yes button not found or not visible.");
        }

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

    async function addControlButton() {
        if (document.getElementById('processCommentsBtn')) {
            console.log("process comments button exists");
            return;
        }

        // Create the button element
        const btn = document.createElement('button');
        btn.id = 'processCommentsBtn';
        btn.textContent = 'START';
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
        btn.onclick = async function() {
            if (continueProcessing) {
                // Stop processing
                await GM_setValue("continueProcessing", false);
                continueProcessing = false;
                btn.textContent = 'START';
                console.log('Processing stopped by user.');
            } else {
                if (confirm('WARNING: This will overwrite and delete ALL visible comments or posts. Continue?')) {
                    await GM_setValue("continueProcessing", true);
                    continueProcessing = true;
                    await GM_setValue("currentCount", 0);
                    currentCount = 0;
                    paused = false;
                    btn.textContent = 'STOP';
                    await processAllThings();
                }
            }
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

        //Check if we're on the right page for inserting buttons
        
        if (pathname.includes(username)) {
            // Find the target element and insert buttons
            const beforeElement = document.querySelector(".titlebox")
            if (beforeElement) {
                beforeElement.parentNode.insertBefore(btn, beforeElement.nextSibling);
                beforeElement.parentNode.insertBefore(pauseBtn, btn.nextSibling);
            }
        }
    }

    // insert control buttons on loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addControlButton);
    } else {
        addControlButton();
    }
    
})();
