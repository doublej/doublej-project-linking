export type IconKey = 'github' | 'substack' | 'link' | 'star';

export type LinkConfig = {
	label: string;
	url: string;
	icon: IconKey;
};

export type ProfileConfig = {
	cta: string;
	color: string;
	showStar: boolean;
	links: LinkConfig[];
};

export type WidgetProfile = {
	id: string;
	name: string;
	config: ProfileConfig;
	createdAt: string;
	updatedAt: string;
};

export type MatchingRule = {
	id: string;
	profileId: string;
	domain: string;
	pathPattern: string;
	priority: number;
	enabled: boolean;
};

export type ProfileWithRules = WidgetProfile & {
	rules: MatchingRule[];
};
