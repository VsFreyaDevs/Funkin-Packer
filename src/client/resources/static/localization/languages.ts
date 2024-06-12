type Language = {
	lang: string;
	name: string;
}

export const languages: Language[] = [
	{ "lang": "en", "name": "english" },
	{ "lang": "de", "name": "deutsch"},
	{ "lang": "es", "name": "español" },
	{ "lang": "ru", "name": "русский"},
	{ "lang": "zh-cn", "name": "简体中文"}
] as const;