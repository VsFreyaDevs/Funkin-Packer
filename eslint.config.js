const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const globals = require("globals");

module.exports = [
	js.configs.all,
	{
		//files: ["src/*.js", "src/*.jsx"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: {
					jsx: true
				}
			},
			globals: {
				...globals.browser,
				...globals.node,
				Atomics: "readonly",
				SharedArrayBuffer: "readonly",
				PLATFORM: "readonly",
				APP: "readonly",
				PROFILER: "readonly",
				DEBUG: "readonly",
			},
		},
		plugins: {
			react
		},
		rules: {
			"no-undef": "error",
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					caughtErrors: "none"
				}
			],
			"no-implicit-globals": "warn",
			"no-magic-numbers": "off",
			"curly": "off",
			"one-var": "off",
			"no-plusplus": "off",
			"id-length": "off",
			"max-params": "off",
			"multiline-comment-style": "off",
			"sort-keys": "off",
			"capitalized-comments": "off",
			"prefer-const": "off", // maybe good
			"func-style": "off",
			"max-statements": "off",
			"no-param-reassign": "off",
			"vars-on-top": "off",
			"no-ternary": "off",
			"sort-imports": "off",
			"no-underscore-dangle": "off",
			"no-useless-assignment": "off",
			"prefer-template": "off",
			"func-names": "off",
			"no-inline-comments": "off",
			"line-comment-position": "off",
			"max-lines-per-function": "off",
			"no-negated-condition": "off",
			"no-bitwise": "off",
			"no-continue": "off",
			"no-undefined": "off",
			"class-methods-use-this": "off",
			"no-implicit-coercion": "off",
			"no-nested-ternary": "off",
			"complexity": "off",
			"default-case": "warn",
			"consistent-this": "off",
			"init-declarations": "off",
			"sort-vars": "off",
			"prefer-named-capture-group": "off",
			"require-unicode-regexp": "off",
			"no-console": "off",
			"prefer-destructuring": "off",
			"prefer-spread": "off",
			"no-useless-constructor": "off",
			"max-lines": "off",
			"no-shadow": "off",
			"no-warning-comments": "off",
			"no-await-in-loop": "off",
		}
	}
];