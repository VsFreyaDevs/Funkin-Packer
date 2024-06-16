declare const PROFILER: string;
declare const PLATFORM: "web" | "electron";
declare const DEBUG: string;

declare module "*.mst" {
	const value: string;
	export default value;
}