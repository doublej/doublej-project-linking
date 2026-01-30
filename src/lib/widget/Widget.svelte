<script lang="ts">
	import type { WidgetLink } from './config.js';
	import LinkItem from './LinkItem.svelte';

	let {
		links,
		color,
		cta = 'Projects'
	}: { links: WidgetLink[]; color: string; cta?: string } = $props();

	let hovered = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="widget"
	class:open={hovered}
	style:--accent={color}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
>
	<div class="surface">
		<div class="panel">
			{#each links as link}
				<LinkItem {...link} {color} />
			{/each}
		</div>
		<div class="triangle">
			<span class="cta">{cta}</span>
		</div>
	</div>
</div>

<style>
	.widget {
		position: fixed;
		bottom: 0;
		right: 0;
		z-index: 2147483647;
		font-family: system-ui, -apple-system, sans-serif;
		color: white;
		pointer-events: none;
	}

	.surface {
		display: flex;
		align-items: flex-end;
		pointer-events: auto;
		transform: translateX(calc(100% - 60px));
		transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.widget.open .surface {
		transform: translateX(0);
	}

	.triangle {
		width: 60px;
		height: 60px;
		flex-shrink: 0;
		background: var(--accent);
		clip-path: polygon(100% 0, 100% 100%, 0 100%);
		position: relative;
		cursor: pointer;
		animation: hint 2s ease-in-out 1s 1;
	}

	@keyframes hint {
		0%,
		100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.3);
		}
	}

	.cta {
		position: absolute;
		bottom: 10px;
		right: 4px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		transform: rotate(-45deg);
		transform-origin: center;
		opacity: 0.9;
		white-space: nowrap;
		pointer-events: none;
	}

	.panel {
		width: 240px;
		padding: 8px;
		background: color-mix(in srgb, var(--accent) 90%, black);
		backdrop-filter: blur(12px);
		clip-path: polygon(24px 0, 100% 0, 100% 100%, 0 100%);
		opacity: 0;
		transition: opacity 250ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.widget.open .panel {
		opacity: 1;
	}
</style>
