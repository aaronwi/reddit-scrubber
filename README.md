# Reddit Scrubber

This Tampermonkey user script helps mass-delete your own Reddit comments using the old Reddit UI.

>  Use at your own risk. Reddit may rate-limit or block these actions, be sure to use sufficient delay.

## Usage
1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Add `reddit-scrubber.user.js` to Tampermonkey
3. Visit `https://www.reddit.com/user/YOUR_USERNAME/comments`
4. Let the script run — it will attempt to overwrite and delete comments

## Notes
- Works only on old Reddit layout, and only currently visible comments, must manually change page
- Will overwrite comments with gibberish and delete using a time delay at beginning of script, to prevent being rate limited or blocked

## TODO
- Pagenation
- Compatibility with RES
- Compatibility with new reddit
- Update DOM to show the comment was deleted
