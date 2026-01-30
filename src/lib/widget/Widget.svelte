<script lang="ts">
	import type { WidgetLink } from './config.js';
	import { starIcon } from './icons.js';
	import LinkItem from './LinkItem.svelte';

	let {
		links,
		color,
		cta = 'Projects',
		starUrl = null,
		showStar = true,
		starCount = null
	}: {
		links: WidgetLink[];
		color: string;
		cta?: string;
		starUrl?: string | null;
		showStar?: boolean;
		starCount?: string | null;
	} = $props();

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
	<div class="tab">{cta}</div>
	<div class="links">
		{#each links as link}
			<LinkItem {...link} {color} />
		{/each}
		{#if showStar && starUrl}
			<a class="star" href={starUrl} target="_blank" rel="noopener noreferrer">
				<span class="star-icon">{@html starIcon}</span>
				Star on GitHub{#if starCount}&ensp;&middot;&ensp;{starCount}{/if}
			</a>
		{/if}
	</div>
</div>

<style>
	.widget {
		position: fixed;
		bottom: 16px;
		right: 0;
		z-index: 2147483647;
		font-family: system-ui, -apple-system, sans-serif;
		color: white;
		background: var(--accent);
		border-radius: 8px 0 0 8px;
		overflow: hidden;
		display: flex;
		flex-direction: row-reverse;
		max-width: 48px;
		transition: max-width 200ms ease;
		cursor: pointer;
	}

	.widget.open {
		max-width: 320px;
	}

	.tab {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		padding: 12px 6px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		white-space: nowrap;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		max-height: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.links {
		padding: 8px;
		opacity: 0;
		transition: opacity 200ms ease;
		min-width: 0;
	}

	.widget.open .links {
		opacity: 1;
	}

	.star {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		margin-top: 4px;
		border-top: 1px solid rgba(255, 255, 255, 0.15);
		color: white;
		text-decoration: none;
		font-size: 13px;
		font-weight: 600;
		line-height: 1.3;
		border-radius: 4px;
		transition: background 150ms ease;
		white-space: nowrap;
	}

	.star:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.star-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		opacity: 0.85;
	}
</style>
