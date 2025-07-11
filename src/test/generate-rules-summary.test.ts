import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Rules Summary Generation", () => {
	const summaryPath = path.join(__dirname, "../../RULES_SUMMARY.md");
	const originalSummary = fs.existsSync(summaryPath)
		? fs.readFileSync(summaryPath, "utf-8")
		: "";

	afterAll(() => {
		// Restore original summary if it existed
		if (originalSummary) {
			fs.writeFileSync(summaryPath, originalSummary);
		} else if (fs.existsSync(summaryPath)) {
			fs.unlinkSync(summaryPath);
		}
	});

	it("should generate a rules summary file", () => {
		// Run the generator
		execSync("npm run generate-rules", { stdio: "pipe" });

		// Check that the file was created
		expect(fs.existsSync(summaryPath)).toBe(true);

		// Read the generated content
		const content = fs.readFileSync(summaryPath, "utf-8");

		// Should contain the expected sections
		expect(content).toContain("# Nomic Rules Summary");
		expect(content).toContain("## Rule Statistics");
		expect(content).toContain("## Tag Index");
		expect(content).toContain("## Detailed Rule List");

		// Check that it contains rule information
		expect(content).toContain("Rule [101]");
		expect(content).toContain("Rule [102]");
		expect(content).toContain("Immutable");
		expect(content).toContain("Mutable");

		// Check for auto-generation timestamp
		expect(content).toContain("This file was automatically generated on");
	});

	it("should include statistics about rules", () => {
		execSync("npm run generate-rules", { stdio: "pipe" });
		const content = fs.readFileSync(summaryPath, "utf-8");

		// Should contain statistics
		expect(content).toMatch(/Total Rules.*\d+/);
		expect(content).toMatch(/Immutable Rules.*\d+/);
		expect(content).toMatch(/Mutable Rules.*\d+/);
		expect(content).toMatch(/Active Rules.*\d+/);
	});

	it("should categorize rules correctly", () => {
		execSync("npm run generate-rules", { stdio: "pipe" });
		const content = fs.readFileSync(summaryPath, "utf-8");

		// Should have separate sections for immutable and mutable rules
		expect(content).toContain("Immutable Rules");
		expect(content).toContain("Mutable Rules");

		// Should list rules in each category
		expect(content).toContain("Rule [101]");
		expect(content).toContain("Rule [202]");
	});

	it("should include detailed rule information", () => {
		execSync("npm run generate-rules", { stdio: "pipe" });
		const content = fs.readFileSync(summaryPath, "utf-8");

		// Should include metadata for each rule
		expect(content).toContain("**Type**:");
		expect(content).toContain("**Status**:");
		expect(content).toContain("**Author**:");
		expect(content).toContain("**Tags**:");
	});
});
