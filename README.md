# Reddit Scrubber v0.4.1

This Tampermonkey user script helps mass-delete your own Reddit comments using the old Reddit UI.

>  **USE AT YOUR OWN RISK.** Reddit may rate-limit or block these actions, be sure to use sufficient delay.

>  I AM NOT RESPONSIBLE FOR ANY LEGAL TROUBLE OR ACCOUNT BAN/LIMIT YOU MAY ENCOUNTER, THIS SCRIPT WILL ALSO RUN VERY SLOWLY.

>  At rate of 5 seconds per comment, your account will get locked for password reset after 2 pages

>  Make sure you have an email tied to your account or you wont be able to unlock it if that happens!

## Usage
1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Add `reddit-scrubber.user.js` to Tampermonkey
3. Visit `https://old.reddit.com/user/YOUR_USERNAME/comments`
      OR `https://old.reddit.com/user/YOUR_USERNAME/submitted`
      can omit `old.` if you have not opted into new reddit
4. Let the script run — it will attempt to overwrite and delete comments

## Notes
- Works only on old Reddit layout, it will automatically change page
- Will overwrite comments with gibberish and delete using a time delay at beginning of script, to prevent being rate limited or blocked

## Changes
- Pagenation
- counter changed to live, not timed, only of current page, not total
- Refactored code a bit and added some error checks
- Fixed autostart trigger

## TODO
- Compatibility with RES
- Compatibility with new reddit
- Overwrite and delete posts
- total comment count
- random delays to look more organic
