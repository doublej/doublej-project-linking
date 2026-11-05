#!/usr/bin/env bun
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Ensure we run from the project root so relative storage paths work
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(projectRoot);

import { loadAllProfiles, loadAllRules, saveProfile, saveRule, deleteProfile, deleteRule, loadProfile, loadRulesByProfile } from './lib/server/profiles/storage.js';
import { calculateSpecificity } from './lib/shared/matcher.js';
import type { WidgetProfile, MatchingRule } from './lib/server/profiles/types.js';

const DEFAULTS = {
	domain: 'doublej.github.io',
	cta: 'Projects',
	color: '#e63946',
	otherProjectsUrl: 'https://l.jurrejan.com/doublej-gh'
};

function usage(): never {
	console.log(`Usage:
  widget-link list                        List all profiles and rules
  widget-link add <slug> --repo <url>     Create profile + rule for a GitHub project
  widget-link remove <slug>               Delete profile and its rules
  widget-link deploy                      Build, commit, and push to trigger deploy

Options for 'add':
  --repo <url>       GitHub repo URL (required)
  --domain <domain>  Override domain (default: ${DEFAULTS.domain})
  --name <name>      Profile display name (default: derived from slug)
  --color <hex>      Accent color (default: ${DEFAULTS.color})
  --no-star          Disable star count
  --no-other         Skip "See my other projects" link`);
	process.exit(1);
}

function slugToName(slug: string): string {
	return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseArgs(args: string[]): Record<string, string | boolean> {
	const result: Record<string, string | boolean> = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--no-star') { result.noStar = true; continue; }
		if (arg === '--no-other') { result.noOther = true; continue; }
		if (arg.startsWith('--') && i + 1 < args.length) {
			result[arg.slice(2)] = args[++i];
		}
	}
	return result;
}

async function list() {
	const [profiles, rules] = await Promise.all([loadAllProfiles(), loadAllRules()]);

	if (profiles.length === 0) {
		console.log('No profiles found.');
		return;
	}

	for (const p of profiles) {
		const profileRules = rules.filter(r => r.profileId === p.id);
		const ruleInfo = profileRules.map(r => `${r.domain}${r.pathPattern}`).join(', ') || 'no rules';
		const links = p.config.links.map(l => l.url).join(', ');
		console.log(`  ${p.id}  "${p.name}"  [${ruleInfo}]  links: ${links}`);
	}
}

async function add(slug: string, args: string[]) {
	const opts = parseArgs(args);
	const repo = opts.repo as string;
	if (!repo) { console.error('Error: --repo is required'); process.exit(1); }

	const existing = await loadProfile(slug);
	if (existing) { console.error(`Error: profile "${slug}" already exists`); process.exit(1); }

	const domain = (opts.domain as string) || DEFAULTS.domain;
	const name = (opts.name as string) || slugToName(slug);
	const color = (opts.color as string) || DEFAULTS.color;
	const showStar = !opts.noStar;

	const links = [
		{ label: 'View project on GitHub', url: repo, icon: 'github' as const }
	];
	if (!opts.noOther) {
		links.push({ label: 'See my other projects', url: DEFAULTS.otherProjectsUrl, icon: 'link' as const });
	}

	const now = new Date().toISOString();
	const profile: WidgetProfile = {
		id: slug,
		name,
		config: { cta: DEFAULTS.cta, color, showStar, links },
		createdAt: now,
		updatedAt: now
	};

	const pathPattern = `/${slug}/**`;
	const rule: MatchingRule = {
		id: `${slug}-rule`,
		profileId: slug,
		domain,
		pathPattern,
		priority: calculateSpecificity(pathPattern),
		enabled: true
	};

	await Promise.all([saveProfile(profile), saveRule(rule)]);
	console.log(`Created profile "${name}" (${slug})`);
	console.log(`Created rule: ${domain}${pathPattern} → ${slug}`);
}

async function remove(slug: string) {
	const profile = await loadProfile(slug);
	if (!profile) { console.error(`Error: profile "${slug}" not found`); process.exit(1); }

	const rules = await loadRulesByProfile(slug);
	await Promise.all([
		deleteProfile(slug),
		...rules.map(r => deleteRule(r.id))
	]);
	console.log(`Deleted profile "${profile.name}" and ${rules.length} rule(s)`);
}

function exec(args: string[]): string {
	const result = Bun.spawnSync(args, { stdout: 'pipe', stderr: 'pipe' });
	if (result.exitCode !== 0) {
		const err = result.stderr.toString().trim();
		throw new Error(`Command failed: ${args.join(' ')}\n${err}`);
	}
	return result.stdout.toString().trim();
}

async function deploy() {
	// Check for uncommitted profile/rule changes
	const status = exec(['git', 'status', '--porcelain', 'profiles/']);
	if (!status) {
		console.log('No profile changes to deploy.');
		return;
	}

	console.log('Building static assets...');
	exec(['bun', 'run', 'build:static']);

	console.log('Staging changes...');
	exec(['git', 'add', 'profiles/', 'dist/']);

	const diff = exec(['git', 'diff', '--cached', '--name-only']);
	const changed = diff.split('\n').filter(Boolean);
	console.log(`Staged: ${changed.join(', ')}`);

	const msg = 'update: widget profiles';
	exec(['git', 'commit', '-m', msg]);
	console.log(`Committed: "${msg}"`);

	console.log('Pushing to main...');
	exec(['git', 'push']);
	console.log('Pushed — GitHub Actions will deploy shortly.');
}

const [command, ...rest] = process.argv.slice(2);

switch (command) {
	case 'list': await list(); break;
	case 'add': {
		const slug = rest[0];
		if (!slug || slug.startsWith('--')) usage();
		await add(slug, rest.slice(1));
		break;
	}
	case 'remove': {
		const slug = rest[0];
		if (!slug) usage();
		await remove(slug);
		break;
	}
	case 'deploy': await deploy(); break;
	default: usage();
}
