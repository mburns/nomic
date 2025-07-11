import type { GitHubComment, VoteType } from "../types";

const VOTE_PATTERNS = [
	/^VOTE:\s*(FOR|AGAINST)$/i,
	/^I vote (FOR|AGAINST)$/i,
	/^My vote is (FOR|AGAINST)$/i,
	/^Voting (FOR|AGAINST)$/i,
	/^✅ (FOR|AGAINST)$/i,
	/^❌ (FOR|AGAINST)$/i,
];

export function parseVoteFromComment(comment: GitHubComment): {
	voter: string;
	vote: VoteType;
} | null {
	const body = comment.body.trim();

	for (const pattern of VOTE_PATTERNS) {
		const match = body.match(pattern);
		if (match) {
			const vote = match[1].toUpperCase() as VoteType;
			return {
				voter: comment.user.login,
				vote,
			};
		}
	}

	return null;
}

export function isValidVote(vote: string): vote is VoteType {
	return vote === "FOR" || vote === "AGAINST";
}

export function formatVoteSummary(votes: Record<string, VoteType>): string {
	const forVotes = Object.values(votes).filter((v) => v === "FOR").length;
	const againstVotes = Object.values(votes).filter(
		(v) => v === "AGAINST",
	).length;
	const totalVotes = forVotes + againstVotes;

	if (totalVotes === 0) {
		return "No votes cast yet.";
	}

	const forVoters = Object.entries(votes)
		.filter(([_, vote]) => vote === "FOR")
		.map(([voter, _]) => `@${voter}`)
		.join(", ");

	const againstVoters = Object.entries(votes)
		.filter(([_, vote]) => vote === "AGAINST")
		.map(([voter, _]) => `@${voter}`)
		.join(", ");

	let summary = `**Vote Summary:** ${forVotes} FOR, ${againstVotes} AGAINST\n\n`;

	if (forVotes > 0) {
		summary += `**FOR:** ${forVoters}\n`;
	}

	if (againstVotes > 0) {
		summary += `**AGAINST:** ${againstVoters}\n`;
	}

	const majority = forVotes / totalVotes;
	summary += `\n**Majority:** ${(majority * 100).toFixed(1)}% FOR`;

	return summary;
}

export function formatVoteInstructions(): string {
	return `## How to Vote

To vote on this proposal, comment with one of the following formats:

- \`VOTE: FOR\` or \`VOTE: AGAINST\`
- \`I vote FOR\` or \`I vote AGAINST\`
- \`My vote is FOR\` or \`My vote is AGAINST\`
- \`Voting FOR\` or \`Voting AGAINST\`
- \`✅ FOR\` or \`❌ AGAINST\`

**Note:** Only one vote per person is allowed. Your most recent vote will be counted.`;
}

export function formatProposalStatus(proposal: {
	status: string;
	requiredVotes: number;
	requiredMajority: number;
	votes: Record<string, VoteType>;
	mergeCheck?: {
		canMerge: boolean;
		reason?: string;
		requiredVotes: number;
		currentVotes: number;
		requiredMajority: number;
		currentMajority: number;
	};
}): string {
	const totalVotes = Object.keys(proposal.votes).length;
	const forVotes = Object.values(proposal.votes).filter(
		(v) => v === "FOR",
	).length;
	const againstVotes = Object.values(proposal.votes).filter(
		(v) => v === "AGAINST",
	).length;

	let status = `## Proposal Status: ${proposal.status.toUpperCase()}\n\n`;
	status += `- **Required Votes:** ${proposal.requiredVotes}\n`;
	status += `- **Current Votes:** ${totalVotes}\n`;
	status += `- **Required Majority:** ${(proposal.requiredMajority * 100).toFixed(1)}%\n`;

	if (totalVotes > 0) {
		const currentMajority = forVotes / (forVotes + againstVotes);
		status += `- **Current Majority:** ${(currentMajority * 100).toFixed(1)}% FOR\n`;
	}

	// Add detailed mergeability information
	if (proposal.mergeCheck) {
		status += `\n## Merge Status\n`;
		if (proposal.mergeCheck.canMerge) {
			status += `✅ **Ready to merge!**\n`;
		} else {
			status += `❌ **Cannot merge**\n`;
			if (proposal.mergeCheck.reason) {
				status += `\n**Reason:** ${proposal.mergeCheck.reason}\n`;
			}

			// Add specific details about what's missing
			if (
				proposal.mergeCheck.currentVotes < proposal.mergeCheck.requiredVotes
			) {
				const missingVotes =
					proposal.mergeCheck.requiredVotes - proposal.mergeCheck.currentVotes;
				status += `- Need ${missingVotes} more vote(s) (${proposal.mergeCheck.currentVotes}/${proposal.mergeCheck.requiredVotes})\n`;
			}

			if (
				proposal.mergeCheck.currentMajority <
				proposal.mergeCheck.requiredMajority
			) {
				const currentPercent = (
					proposal.mergeCheck.currentMajority * 100
				).toFixed(1);
				const requiredPercent = (
					proposal.mergeCheck.requiredMajority * 100
				).toFixed(1);
				status += `- Insufficient majority: ${currentPercent}% FOR (need ${requiredPercent}%)\n`;
			}
		}
	}

	if (proposal.status === "open") {
		if (totalVotes < proposal.requiredVotes) {
			status += `\n⏳ **Waiting for ${
				proposal.requiredVotes - totalVotes
			} more vote(s)**`;
		} else {
			const currentMajority = forVotes / (forVotes + againstVotes);
			if (currentMajority < proposal.requiredMajority) {
				status += `\n❌ **Insufficient majority** (need ${(
					proposal.requiredMajority * 100
				).toFixed(1)}%, have ${(currentMajority * 100).toFixed(1)}%)`;
			} else {
				status += `\n✅ **Ready to merge!**`;
			}
		}
	} else if (proposal.status === "passed") {
		status += `\n🎉 **Proposal PASSED!**`;
	} else if (proposal.status === "failed") {
		status += `\n❌ **Proposal FAILED**`;
	}

	return status;
}

export function generateVoteTable(votes: Record<string, VoteType>): string {
	const forVotes = Object.entries(votes)
		.filter(([_, vote]) => vote === "FOR")
		.map(([voter, _]) => voter);
	const againstVotes = Object.entries(votes)
		.filter(([_, vote]) => vote === "AGAINST")
		.map(([voter, _]) => voter);

	const totalVotes = forVotes.length + againstVotes.length;
	const forCount = forVotes.length;
	const againstCount = againstVotes.length;

	let table = "## Vote Summary\n\n";
	table += "| Vote | Count | Voters |\n";
	table += "|------|-------|--------|\n";
	table += `| ✅ FOR | ${forCount} | ${forVotes.length > 0 ? forVotes.map(v => `@${v}`).join(", ") : "None"} |\n`;
	table += `| ❌ AGAINST | ${againstCount} | ${againstVotes.length > 0 ? againstVotes.map(v => `@${v}`).join(", ") : "None"} |\n`;
	table += `| **Total** | **${totalVotes}** | |\n\n`;

	if (totalVotes > 0) {
		const majority = forCount / totalVotes;
		table += `**Current Majority:** ${(majority * 100).toFixed(1)}% FOR\n\n`;
	}

	return table;
}
