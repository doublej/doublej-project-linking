import { mount } from 'svelte';
import Widget from './Widget.svelte';
import { parseConfig } from './config.js';

const scriptEl =
	(document.currentScript as HTMLScriptElement | null) ??
	document.querySelector<HTMLScriptElement>(
		'script[data-github], script[data-substack], script[data-projects]'
	);

function init() {
	if (!scriptEl) return;

	const config = parseConfig(scriptEl);
	if (!config) return;

	const host = document.createElement('div');
	host.id = 'doublej-widget';
	document.body.appendChild(host);

	const shadow = host.attachShadow({ mode: 'closed' });

	mount(Widget, {
		target: shadow,
		props: { links: config.links, color: config.color, cta: config.cta }
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
