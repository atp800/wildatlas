// Shrinks a square-grid post title only when it would overflow its tile.

const MIN_FONT_SIZE = 9; // px — floor for how small a title may get
const MAX_TILE_HEIGHT = 0.9; // max fraction of the square a title may occupy

const TITLE_SELECTOR = '.post-overlay .post-title';

export function fitPostTitles(): void {
	document.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach((title) => {
		// Reset so the stylesheet (and its media queries) sets the starting size.
		title.style.fontSize = '';

		const tile = title.parentElement;
		if (!tile || title.offsetParent === null) return; // hidden while hovered

		const available = tile.clientHeight * MAX_TILE_HEIGHT;
		let size = parseFloat(getComputedStyle(title).fontSize);

		while (size > MIN_FONT_SIZE && title.scrollHeight > available) {
			size -= 1;
			title.style.fontSize = `${size}px`;
		}
	});
}

let frame = 0;

function scheduleFit(): void {
	if (frame) return;
	frame = requestAnimationFrame(() => {
		frame = 0;
		fitPostTitles();
	});
}

fitPostTitles();
document.fonts?.ready.then(scheduleFit);
window.addEventListener('resize', scheduleFit);
