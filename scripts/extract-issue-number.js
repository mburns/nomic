const fs = require("node:fs");

function extractIssueNumber() {
	const prTitle = process.env.PR_TITLE || "";
	const prBody = process.env.PR_BODY || "";

	// Extract issue number from PR title (assuming format: "Proposal #123: Title")
	let issueNumber = prTitle.match(/#(\d+)/)?.[1];

	if (!issueNumber) {
		// Try to extract from PR body
		issueNumber = prBody.match(/#(\d+)/)?.[1];
	}

	if (!issueNumber) {
		console.error("No issue number found in PR title or body");
		console.error("PR_TITLE:", prTitle);
		console.error("PR_BODY:", prBody);
		process.exit(1);
	}

	console.log("Issue number:", issueNumber);

	// Write to GitHub Actions output file
	const outputFile = process.env.GITHUB_OUTPUT;
	if (outputFile) {
		fs.appendFileSync(outputFile, `issue_number=${issueNumber}\n`);
	}
}

extractIssueNumber();
