const { NomicGame, defaultGameConfig } = require("../dist/index.js");

async function autoMergeProposal() {
	const issueNumber = process.argv[2];

	if (!issueNumber) {
		console.error("Usage: node auto-merge-proposal.js <issue-number>");
		process.exit(1);
	}

	const githubConfig = {
		token: process.env.GITHUB_TOKEN,
		owner: process.env.GITHUB_REPOSITORY_OWNER,
		repo: process.env.GITHUB_REPOSITORY_NAME,
		baseBranch: "main",
	};

	try {
		const game = new NomicGame(githubConfig, defaultGameConfig);
		await game.autoMergeProposal(parseInt(issueNumber));
		console.log("Successfully auto-merged proposal");
	} catch (error) {
		console.error("Failed to auto-merge:", error);
		process.exit(1);
	}
}

autoMergeProposal();
