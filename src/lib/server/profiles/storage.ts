import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import type { WidgetProfile, MatchingRule } from './types.js';

const PROFILES_DIR = 'profiles/profiles';
const RULES_DIR = 'profiles/rules';

export async function loadProfile(id: string): Promise<WidgetProfile | null> {
	try {
		const path = join(PROFILES_DIR, `${id}.json`);
		const content = await readFile(path, 'utf-8');
		return JSON.parse(content) as WidgetProfile;
	} catch {
		return null;
	}
}

export async function saveProfile(profile: WidgetProfile): Promise<void> {
	const path = join(PROFILES_DIR, `${profile.id}.json`);
	await writeFile(path, JSON.stringify(profile, null, 2), 'utf-8');
}

export async function loadAllProfiles(): Promise<WidgetProfile[]> {
	try {
		const files = await readdir(PROFILES_DIR);
		const profiles: WidgetProfile[] = [];

		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			const id = file.replace('.json', '');
			const profile = await loadProfile(id);
			if (profile) profiles.push(profile);
		}

		return profiles;
	} catch {
		return [];
	}
}

export async function deleteProfile(id: string): Promise<void> {
	const { unlink } = await import('fs/promises');
	const path = join(PROFILES_DIR, `${id}.json`);
	await unlink(path);
}

export async function loadRule(id: string): Promise<MatchingRule | null> {
	try {
		const path = join(RULES_DIR, `${id}.json`);
		const content = await readFile(path, 'utf-8');
		return JSON.parse(content) as MatchingRule;
	} catch {
		return null;
	}
}

export async function saveRule(rule: MatchingRule): Promise<void> {
	const path = join(RULES_DIR, `${rule.id}.json`);
	await writeFile(path, JSON.stringify(rule, null, 2), 'utf-8');
}

export async function loadAllRules(): Promise<MatchingRule[]> {
	try {
		const files = await readdir(RULES_DIR);
		const rules: MatchingRule[] = [];

		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			const id = file.replace('.json', '');
			const rule = await loadRule(id);
			if (rule) rules.push(rule);
		}

		return rules;
	} catch {
		return [];
	}
}

export async function loadRulesByProfile(profileId: string): Promise<MatchingRule[]> {
	const allRules = await loadAllRules();
	return allRules.filter((r) => r.profileId === profileId);
}

export async function deleteRule(id: string): Promise<void> {
	const { unlink } = await import('fs/promises');
	const path = join(RULES_DIR, `${id}.json`);
	await unlink(path);
}
