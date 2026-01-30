/**
 * Build a static widget-manifest.json from profiles and rules JSON files.
 * Denormalizes rules by inlining each rule's profile config.
 *
 * Usage: bun run scripts/build-manifest.ts
 * Output: dist/widget-manifest.json
 */

import { readdir, readFile, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const PROFILES_DIR = 'profiles/profiles';
const RULES_DIR = 'profiles/rules';
const OUT_DIR = 'dist';
const OUT_FILE = join(OUT_DIR, 'widget-manifest.json');

type ProfileConfig = {
	cta: string;
	color: string;
	showStar: boolean;
	links: Array<{ label: string; url: string; icon: string }>;
};

type Profile = {
	id: string;
	name: string;
	config: ProfileConfig;
};

type Rule = {
	id: string;
	profileId: string;
	domain: string;
	pathPattern: string;
	priority: number;
	enabled: boolean;
};

type ManifestRule = {
	domain: string;
	pathPattern: string;
	priority: number;
	enabled: boolean;
	config: ProfileConfig;
};

async function readJsonDir<T>(dir: string): Promise<T[]> {
	try {
		const files = await readdir(dir);
		const items: T[] = [];
		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			const content = await readFile(join(dir, file), 'utf-8');
			items.push(JSON.parse(content) as T);
		}
		return items;
	} catch {
		return [];
	}
}

async function main() {
	const profiles = await readJsonDir<Profile>(PROFILES_DIR);
	const rules = await readJsonDir<Rule>(RULES_DIR);

	const profileMap = new Map(profiles.map((p) => [p.id, p]));

	const manifestRules: ManifestRule[] = [];
	for (const rule of rules) {
		if (!rule.enabled) continue;
		const profile = profileMap.get(rule.profileId);
		if (!profile) continue;

		manifestRules.push({
			domain: rule.domain,
			pathPattern: rule.pathPattern,
			priority: rule.priority,
			enabled: rule.enabled,
			config: profile.config
		});
	}

	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(OUT_FILE, JSON.stringify({ rules: manifestRules }, null, 2));

	console.log(`Built ${OUT_FILE} with ${manifestRules.length} rules`);
}

main();
