import { EventLogService } from "./services/EventLogService";
import { StateProcessor } from "./services/StateProcessor";
import { GitHubService } from "./services/GitHubService";
import {
	formatProposalStatus,
	formatVoteInstructions,
	parseVoteFromComment,
	generateVoteTable,
} from "./services/VoteProcessor";
import type { GameConfig, GitHubConfig } from "./types";
import type { ComputedGameState } from "./types/events";

export class NomicGame {
	public githubService: GitHubService;
	private eventLogService: EventLogService;
	private stateProcessor: StateProcessor;
	private config: GameConfig;

	constructor(githubConfig: GitHubConfig, gameConfig: GameConfig) {
		this.githubService = new GitHubService(githubConfig);
		this.eventLogService = new EventLogService("events/game-events.jsonl", gameConfig);
		this.stateProcessor = new StateProcessor(this.eventLogService);
		this.config = gameConfig;
	}

	async processIssueComment(eventPath: string): Promise<void> {
		try {
			const event = this.githubService.parseEvent(eventPath);
			const issue = event.issue;

			// Get all comments for this issue
			const comments = await this.githubService.getIssueComments(issue.number);

			if (comments.length === 0) {
				console.log(`No comments found for issue #${issue.number}`);
				return;
			}

			// Process the latest comment
			const latestComment = comments[comments.length - 1];
			const vote = parseVoteFromComment(latestComment);

			if (!vote) {
				console.log(
					`No valid vote found in comment for issue #${issue.number}`,
				);
				return;
			}

			// Check if proposal exists, if not create it
			const currentState = await this.stateProcessor.computeCurrentState();
			const proposalKey = issue.number.toString();
			
			if (!currentState.proposals[proposalKey]) {
				// Create proposal_created event
				const proposalCreatedEvent = {
					type: "proposal_created" as const,
					issue_number: issue.number,
					title: issue.title,
					proposer: issue.user.login,
					body: issue.body,
				};
				await this.eventLogService.appendEvent(proposalCreatedEvent);

				// Ensure proposer is registered as a player
				if (!currentState.players[issue.user.login]) {
					const playerJoinedEvent = {
						type: "player_joined" as const,
						username: issue.user.login,
						joined_via: "proposal" as const,
						first_action_issue: issue.number,
					};
					await this.eventLogService.appendEvent(playerJoinedEvent);
				}
			}

			// Ensure voter is registered as a player
			if (!currentState.players[vote.voter]) {
				const voterJoinedEvent = {
					type: "player_joined" as const,
					username: vote.voter,
					joined_via: "vote" as const,
					first_action_issue: issue.number,
				};
				await this.eventLogService.appendEvent(voterJoinedEvent);
			}

			// Create vote_cast event
			const voteCastEvent = {
				type: "vote_cast" as const,
				issue_number: issue.number,
				voter: vote.voter,
				vote: vote.vote,
				comment_id: latestComment.id,
			};
			await this.eventLogService.appendEvent(voteCastEvent);

			// Check if proposal should be resolved
			const mergeCheck = await this.stateProcessor.canMergeProposal(issue.number, {
				requiredVotes: this.config.requiredVotes,
				requiredMajority: this.config.requiredMajority,
			});

			let statusChanged = false;
			const updatedState = await this.stateProcessor.computeCurrentState();
			const proposal = updatedState.proposals[proposalKey];

			if (proposal) {
				// Determine if proposal should be resolved
				const votes = Object.values(proposal.votes);
				const totalVotes = votes.length;
				const forVotes = votes.filter(v => v === "FOR").length;
				const againstVotes = votes.filter(v => v === "AGAINST").length;

				if (totalVotes >= this.config.requiredVotes) {
					const majority = forVotes / totalVotes;
					const newStatus = majority >= this.config.requiredMajority ? "passed" : "failed";

					if (proposal.status === "open" && newStatus !== "open") {
						// Create proposal_resolved event
						await this.eventLogService.appendEvent({
							type: "proposal_resolved" as const,
							issue_number: issue.number,
							status: newStatus,
							final_votes: {
								for: forVotes,
								against: againstVotes,
								total: totalVotes,
							},
						});

						// Award points
						await this.awardPoints(issue.number, newStatus, proposal.proposer, proposal.votes);

						// Advance turn
						await this.eventLogService.appendEvent({
							type: "turn_advanced" as const,
							new_turn: updatedState.current_turn + 1,
							triggered_by_issue: issue.number,
						});

						statusChanged = true;
					}
				}
			}

			// Update issue status and labels
			await this.updateIssueStatus(issue.number);

			// Update scoreboard
			await this.updateScoreboard();

			// Update GitHub status check
			await this.updateProposalStatusCheck(issue.number);

			// Update PR body with vote information
			await this.updatePullRequestBody(issue.number);

			// If status changed, add a comment with the new status
			if (statusChanged) {
				const finalState = await this.stateProcessor.computeCurrentState();
				const finalProposal = finalState.proposals[proposalKey];
				if (finalProposal) {
					const statusMessage = formatProposalStatus({
						...finalProposal,
						mergeCheck,
					});
					await this.githubService.addComment(issue.number, statusMessage);
				}
			}

			console.log(
				`Processed ${vote.vote} vote from @${vote.voter} for issue #${issue.number}`,
			);
		} catch (error) {
			console.error("Error processing issue comment:", error);
			throw error;
		}
	}

	private async awardPoints(
		issueNumber: number,
		status: "passed" | "failed",
		proposer: string,
		votes: Record<string, "FOR" | "AGAINST">
	): Promise<void> {
		// Award points to proposer
		if (status === "passed") {
			await this.eventLogService.appendEvent({
				type: "points_awarded" as const,
				player: proposer,
				points: this.config.pointsForSuccessfulProposal,
				reason: "Successful proposal",
				related_issue: issueNumber,
			});
		} else {
			await this.eventLogService.appendEvent({
				type: "points_awarded" as const,
				player: proposer,
				points: this.config.pointsForParticipation,
				reason: "Proposal participation",
				related_issue: issueNumber,
			});
		}

		// Award points to voters
		for (const [voter, vote] of Object.entries(votes)) {
			if (voter === proposer) continue; // Proposer already got points

			const votedWithMajority = 
				(status === "passed" && vote === "FOR") ||
				(status === "failed" && vote === "AGAINST");

			const points = votedWithMajority 
				? this.config.pointsForVotingWithMajority 
				: this.config.pointsForParticipation;

			const reason = votedWithMajority 
				? "Voting with majority" 
				: "Voting participation";

			await this.eventLogService.appendEvent({
				type: "points_awarded" as const,
				player: voter,
				points,
				reason,
				related_issue: issueNumber,
			});
		}
	}

	async processIssueOpened(eventPath: string): Promise<void> {
		try {
			const event = this.githubService.parseEvent(eventPath);
			const issue = event.issue;

			// Create proposal_created event
			await this.eventLogService.appendEvent({
				type: "proposal_created" as const,
				issue_number: issue.number,
				title: issue.title,
				proposer: issue.user.login,
				body: issue.body,
			});

			// Ensure proposer is registered as a player
			const currentState = await this.stateProcessor.computeCurrentState();
			if (!currentState.players[issue.user.login]) {
				await this.eventLogService.appendEvent({
					type: "player_joined" as const,
					username: issue.user.login,
					joined_via: "proposal" as const,
					first_action_issue: issue.number,
				});
			}

			// Add voting instructions to the issue
			const instructions = formatVoteInstructions();
			await this.githubService.addComment(issue.number, instructions);

			// Add proposal label
			await this.githubService.addLabels(issue.number, ["proposal"]);

			// Create initial pending status check
			await this.updateProposalStatusCheck(issue.number);

			console.log(`Added voting instructions to issue #${issue.number}`);
		} catch (error) {
			console.error("Error processing issue opened:", error);
			throw error;
		}
	}

	async processIssueClosed(eventPath: string): Promise<void> {
		try {
			const event = this.githubService.parseEvent(eventPath);
			const issue = event.issue;

			// Create proposal_resolved event if not already resolved
			const currentState = await this.stateProcessor.computeCurrentState();
			const proposal = currentState.proposals[issue.number.toString()];

			if (proposal && proposal.status === "open") {
				const votes = Object.values(proposal.votes);
				const forVotes = votes.filter(v => v === "FOR").length;
				const againstVotes = votes.filter(v => v === "AGAINST").length;

				await this.eventLogService.appendEvent({
					type: "proposal_resolved" as const,
					issue_number: issue.number,
					status: "closed" as const,
					final_votes: {
						for: forVotes,
						against: againstVotes,
						total: forVotes + againstVotes,
					},
				});
			}

			// Remove proposal label
			await this.githubService.removeLabel(issue.number, "proposal");

			console.log(`Closed proposal for issue #${issue.number}`);
		} catch (error) {
			console.error("Error processing issue closed:", error);
			throw error;
		}
	}

	async checkProposalStatus(issueNumber: number): Promise<{
		canMerge: boolean;
		reason?: string;
		status: string;
	}> {
		const mergeCheck = await this.stateProcessor.canMergeProposal(issueNumber, {
			requiredVotes: this.config.requiredVotes,
			requiredMajority: this.config.requiredMajority,
		});

		const proposal = await this.stateProcessor.getProposalState(issueNumber);

		return {
			canMerge: mergeCheck.canMerge,
			reason: mergeCheck.reason,
			status: proposal?.status || "unknown",
		};
	}

	async autoMergeProposal(issueNumber: number): Promise<void> {
		const mergeCheck = await this.stateProcessor.canMergeProposal(issueNumber, {
			requiredVotes: this.config.requiredVotes,
			requiredMajority: this.config.requiredMajority,
		});

		if (!mergeCheck.canMerge) {
			throw new Error(`Cannot merge proposal: ${mergeCheck.reason}`);
		}

		// Find the associated PR
		const _issue = await this.githubService.getIssue(issueNumber);

		// In a real implementation, you'd need to find the PR associated with this issue
		// For now, we'll assume the PR number is the same as the issue number
		try {
			await this.githubService.mergePullRequest(issueNumber);
			console.log(`Auto-merged PR #${issueNumber}`);
		} catch (error) {
			console.error(`Failed to auto-merge PR #${issueNumber}:`, error);
			throw error;
		}
	}

	private async updateIssueStatus(issueNumber: number): Promise<void> {
		const proposal = await this.stateProcessor.getProposalState(issueNumber);
		if (!proposal) return;

		// Update labels based on status
		const currentLabels = ["proposal"];

		if (proposal.status === "passed") {
			currentLabels.push("passed");
			await this.githubService.removeLabel(issueNumber, "failed");
		} else if (proposal.status === "failed") {
			currentLabels.push("failed");
			await this.githubService.removeLabel(issueNumber, "passed");
		} else {
			await this.githubService.removeLabel(issueNumber, "passed");
			await this.githubService.removeLabel(issueNumber, "failed");
		}

		// Update the labels
		await this.githubService.addLabels(issueNumber, currentLabels);
	}

	private async updateScoreboard(): Promise<void> {
		const leaderboard = await this.stateProcessor.getPlayerLeaderboard();
		const gameState = await this.stateProcessor.computeCurrentState();
		const proposalStats = await this.stateProcessor.getProposalStats();

		// Generate scoreboard content
		let scoreboard = "# Nomic Game Scoreboard\n\n";
		scoreboard += "Welcome to the Nomic game! This scoreboard tracks player participation, proposals, and voting activity.\n\n";
		scoreboard += "## Current Standings\n\n";
		scoreboard += "User | Points | Proposals | Passed | Votes Cast | Last Active\n";
		scoreboard += "---- | ------ | --------- | ------ | ---------- | ------------\n";

		for (const player of leaderboard) {
			const lastActive = player.last_active ? new Date(player.last_active).toLocaleDateString() : "Never";
			scoreboard += `@${player.username} | ${player.points} | ${player.proposals_submitted} | ${player.proposals_passed} | ${player.votes_cast} | ${lastActive}\n`;
		}

		scoreboard += "\n## Game Statistics\n\n";
		scoreboard += `- **Total Players**: ${leaderboard.length}\n`;
		scoreboard += `- **Total Proposals**: ${proposalStats.total}\n`;
		scoreboard += `- **Active Proposals**: ${proposalStats.open}\n`;
		scoreboard += `- **Current Turn**: ${gameState.current_turn}\n`;

		scoreboard += "\n## How to Play\n\n";
		scoreboard += "1. **Create a Proposal**: Open a GitHub Issue with your rule change proposal\n";
		scoreboard += "2. **Vote on Proposals**: Comment on issues using formats like `VOTE: FOR` or `I vote AGAINST`\n";
		scoreboard += "3. **Track Progress**: Watch the automated updates as votes are processed\n";
		scoreboard += "4. **Earn Points**: Get points for successful proposals and voting with the majority\n";

		scoreboard += "\n## Voting Formats\n\n";
		scoreboard += "- `VOTE: FOR` or `VOTE: AGAINST`\n";
		scoreboard += "- `I vote FOR` or `I vote AGAINST`\n";
		scoreboard += "- `My vote is FOR` or `My vote is AGAINST`\n";
		scoreboard += "- `Voting FOR` or `Voting AGAINST`\n";
		scoreboard += "- `✅ FOR` or `❌ AGAINST`\n";

		scoreboard += "\n## Scoring System\n\n";
		scoreboard += `- **Successful Proposal**: ${this.config.pointsForSuccessfulProposal} points\n`;
		scoreboard += `- **Voting with Majority**: ${this.config.pointsForVotingWithMajority} points\n`;
		scoreboard += `- **Participation**: ${this.config.pointsForParticipation} point\n`;

		scoreboard += "\n*This scoreboard is automatically updated by the Nomic game system.*\n";

		// Update the scoreboard file in the repository
		const existingFile = await this.githubService.getFile("SCOREBOARD.md");

		if (existingFile) {
			await this.githubService.updateFile(
				"SCOREBOARD.md",
				"Update scoreboard",
				scoreboard,
				existingFile.sha,
			);
		} else {
			await this.githubService.createFile(
				"SCOREBOARD.md",
				"Create scoreboard",
				scoreboard,
			);
		}
	}

	async getGameStats(): Promise<{
		totalPlayers: number;
		totalProposals: number;
		activeProposals: number;
		currentTurn: number;
	}> {
		const state = await this.stateProcessor.computeCurrentState();
		const proposalStats = await this.stateProcessor.getProposalStats();

		return {
			totalPlayers: Object.keys(state.players).length,
			totalProposals: proposalStats.total,
			activeProposals: proposalStats.open,
			currentTurn: state.current_turn,
		};
	}

	private async updateProposalStatusCheck(issueNumber: number): Promise<void> {
		try {
			const mergeCheck = await this.stateProcessor.canMergeProposal(issueNumber, {
				requiredVotes: this.config.requiredVotes,
				requiredMajority: this.config.requiredMajority,
			});
			const proposal = await this.stateProcessor.getProposalState(issueNumber);

			if (!proposal) {
				console.log(`No proposal found for issue #${issueNumber}`);
				return;
			}

			// Get the commit SHA for the status check
			const sha = await this.githubService.getCommitSha(issueNumber);
			if (!sha) {
				console.log(`Could not get commit SHA for issue #${issueNumber}`);
				return;
			}

			const context = `nomic/proposal-${issueNumber}`;
			let state: "pending" | "success" | "failure";
			let description: string;

			if (mergeCheck.canMerge) {
				state = "success";
				description = `Proposal ready to merge (${mergeCheck.forVotes}/${mergeCheck.currentVotes} votes, ${(mergeCheck.majority * 100).toFixed(1)}% majority)`;
			} else if (proposal.status === "failed") {
				state = "failure";
				description = "Proposal failed";
			} else if (proposal.status === "closed") {
				state = "failure";
				description = "Proposal closed";
			} else {
				state = "pending";
				description = mergeCheck.reason || "Waiting for votes";
			}

			await this.githubService.createStatusCheck(sha, context, state, description);
		} catch (error) {
			console.error(`Failed to update status check for issue #${issueNumber}:`, error);
		}
	}

	private async updatePullRequestBody(issueNumber: number): Promise<void> {
		try {
			const proposal = await this.stateProcessor.getProposalState(issueNumber);
			if (!proposal) return;

			const mergeCheck = await this.stateProcessor.canMergeProposal(issueNumber, {
				requiredVotes: this.config.requiredVotes,
				requiredMajority: this.config.requiredMajority,
			});

			// Generate vote table
			const voteTable = generateVoteTable(proposal.votes);

			// Create status section
			const statusSection = formatProposalStatus({
				...proposal,
				mergeCheck,
			});

			// Try to update the PR body
			const pr = await this.githubService.getPullRequest(issueNumber);
			if (pr) {
				let newBody = pr.body || "";

				// Remove existing vote table and status if present
				newBody = newBody.replace(/## Vote Status[\s\S]*?(?=##|$)/g, "");
				newBody = newBody.replace(/## Voting Results[\s\S]*?(?=##|$)/g, "");

				// Add new vote information
				newBody += "\n\n## Vote Status\n\n";
				newBody += statusSection;
				newBody += "\n\n## Voting Results\n\n";
				newBody += voteTable;

				await this.githubService.updatePullRequest(issueNumber, {
					body: newBody.trim(),
				});
			}
		} catch (error) {
			console.error(`Failed to update PR body for issue #${issueNumber}:`, error);
		}
	}
}

export async function main(): Promise<void> {
	const githubConfig = {
		token: process.env.GITHUB_TOKEN || "",
		owner: process.env.GITHUB_REPOSITORY_OWNER || "",
		repo: process.env.GITHUB_REPOSITORY?.split("/")[1] || "",
		baseBranch: "main",
	};

	const gameConfig = {
		requiredVotes: 3,
		requiredMajority: 0.5,
		pointsForSuccessfulProposal: 3,
		pointsForVotingWithMajority: 2,
		pointsForParticipation: 1,
		autoMergeEnabled: true,
		branchProtectionEnabled: true,
	};

	const game = new NomicGame(githubConfig, gameConfig);
	const eventName = process.env.GITHUB_EVENT_NAME;
	const eventPath = process.env.GITHUB_EVENT_PATH || "";

	console.log(`Processing GitHub event: ${eventName}`);

	try {
		switch (eventName) {
			case "issue_comment":
				await game.processIssueComment(eventPath);
				break;
			case "issues": {
				const event = game.githubService.parseEvent(eventPath);
				if (event.action === "opened") {
					await game.processIssueOpened(eventPath);
				} else if (event.action === "closed") {
					await game.processIssueClosed(eventPath);
				}
				break;
			}
			default:
				console.log(`Unhandled event type: ${eventName}`);
		}
	} catch (error) {
		console.error("Error processing event:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main().catch(console.error);
}
