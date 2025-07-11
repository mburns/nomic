const { NomicGame, defaultGameConfig } = require("../dist/index.js");

async function checkProposalStatus() {
	const issueNumber = process.argv[2];

	if (!issueNumber) {
		console.error("Usage: node check-proposal-status.js <issue-number>");
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
		const result = await game.checkProposalStatus(parseInt(issueNumber));

		console.log("Proposal Status:", result.status);
		console.log("Can Merge:", result.canMerge);
		if (result.reason) {
			console.log("Reason:", result.reason);
		}

		if (result.canMerge) {
			console.log("✅ Proposal is ready to merge!");
			process.exit(0);
		} else {
			console.log("❌ Proposal is not ready to merge");
			process.exit(1);
		}
	} catch (error) {
		console.error("Error checking proposal status:", error);
		process.exit(1);
	}
}

checkProposalStatus();
