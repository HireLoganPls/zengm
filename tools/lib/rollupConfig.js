const path = require("path");
const alias = require("@rollup/plugin-alias");
const babel = require("@rollup/plugin-babel").default;
const blacklist = require("rollup-plugin-blacklist");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const resolve = require("@rollup/plugin-node-resolve").default;
const replace = require("@rollup/plugin-replace");
const terser = require("@rollup/plugin-terser");
const visualizer = require("rollup-plugin-visualizer").visualizer;
const getSport = require("./getSport");

const extensions = [".mjs", ".js", ".json", ".node", ".ts", ".tsx"];

module.exports = (
	nodeEnv,
	{ blacklistOptions, statsFilename, legacy } = {},
) => {
	const sport = getSport();

	// This gets used in babel.config.mjs, except we don't want it set to "test" in karma because then it will activate @babel/plugin-transform-modules-commonjs
	if (nodeEnv !== "test") {
		process.env.NODE_ENV = nodeEnv;
	}

	const root = path.resolve(__dirname, "../..");

	const plugins = [
		alias({
			resolve: [".json"],
			entries: {
				// This is assumed to be generated prior to rollup being started
				"league-schema": path.resolve(root, "build/files/league-schema.json"),

				"bbgm-polyfills": legacy
					? path.resolve(root, "src/common/polyfills.ts")
					: path.resolve(root, "src/common/polyfills-modern.ts"),

				"bbgm-debug":
					nodeEnv === "production"
						? path.resolve(root, "src/worker/core/debug/prod.ts")
						: path.resolve(root, "src/worker/core/debug/index.ts"),

				"ajv-hack": path.resolve(root, "src/worker/ajvHack/esbuild.js"),
			},
		}),
		replace({
			preventAssignment: true,
			values: {
				"process.env.NODE_ENV": JSON.stringify(nodeEnv),
				"process.env.SPORT": JSON.stringify(sport),
			},
		}),
		babel({
			babelHelpers: "bundled",
			exclude: legacy
				? /^node_modules\/(?!@tanstack\/react-virtual|d3|idb|nanoevents|react-bootstrap|streamsaver?).*$/
				: "node_modules/**",
			extensions: extensions.filter(extension => extension !== ".json"),
			configFile: path.join(
				__dirname,
				`../../babel.config${legacy ? ".legacy" : ""}.js`,
			),
		}),
		json({
			compact: true,
			namedExports: false,
		}),
		commonjs(),
		resolve({
			extensions,
			preferBuiltins: true,
		}),
	];

	if (nodeEnv === "production") {
		plugins.push(
			terser({
				output: {
					comments: /^I DON'T WANT ANY COMMENTS$/,
				},
			}),
		);
	}

	if (blacklistOptions) {
		plugins.splice(1, 0, blacklist(blacklistOptions));
	}

	if (statsFilename) {
		plugins.push(
			visualizer({
				filename: statsFilename,
				gzipSize: true,
				sourcemap: true,
				template: "sunburst",
			}),
		);
	}

	return {
		plugins,
		onwarn(warning, rollupWarn) {
			// I don't like this, but there's too much damn baggage
			if (warning.code !== "CIRCULAR_DEPENDENCY") {
				rollupWarn(warning);
			}
		},
		watch: {
			// https://github.com/rollup/rollup/issues/1666#issuecomment-536227450
			chokidar: {
				usePolling: true,
			},
		},
	};
};
