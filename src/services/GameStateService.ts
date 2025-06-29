import * as fs from "node:fs";
import * as yaml from "js-yaml";
import {
	type GameConfig,
	type GameState,
	GameStateSchema,
	type PlayerScore,
	type ProposalVotes,
	type VoteType,
} from "../types";

export class GameStateService {
	private statePath: string;
	private config: GameConfig;

	constructor(statePath: string = "game-state.yaml", config: GameConfig) {
		this.statePath = statePath;
		this.config = config;
	}

	async loadGameState(): Promise<GameState> {
		try {
			if (!fs.existsSync(this.statePath)) {
				return this.createInitialGameState();
			}

			const content = fs.readFileSync(this.statePath, "utf-8");
			const data = yaml.load(content) as unknown;
			return GameStateSchema.parse(data);
		} catch (error) {
			console.error("Error loading game state:", error);
			return this.createInitialGameState();
		}
	}

	async saveGameState(state: GameState): Promise<void> {
		try {
			const content = yaml.dump(state);
			fs.writeFileSync(this.statePath, content, "utf-8");
		} catch (error) {
			console.error("Error saving game state:", error);
			throw error;
		}
	}

	private createInitialGameState(): GameState {
		return {
			players: {},
			proposals: {},
			gameRules: [],
			currentTurn: 1,
			lastUpdated: new Date().toISOString(),
		};
	}

	async processVote(
		issueNumber: number,
		voter: string,
		vote: VoteType,
		issueTitle: string,
		proposer: string,
	): Promise<{
		state: GameState;
		proposalUpdated: boolean;
		statusChanged: boolean;
	}> {
		const state = await this.loadGameState();
		const proposalKey = issueNumber.toString();

		// Initialize proposal if it doesn't exist
		if (!state.proposals[proposalKey]) {
			state.proposals[proposalKey] = {
				issueNumber,
				title: issueTitle,
				proposer,
				votes: {},
				status: "open",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				requiredVotes: this.config.requiredVotes,
				requiredMajority: this.config.requiredMajority,
			};
		}

		const proposal = state.proposals[proposalKey];
		const oldStatus = proposal.status;

		// Update vote
		proposal.votes[voter] = vote;
		proposal.updatedAt = new Date().toISOString();

		// Check if proposal should be resolved
		const newStatus = this.calculateProposalStatus(proposal);
		proposal.status = newStatus;

		// Update player stats
		this.updatePlayerStats(state, voter, proposal, oldStatus !== newStatus);

		// Update game state
		state.lastUpdated = new Date().toISOString();
		if (newStatus === "passed" || newStatus === "failed") {
			state.currentTurn += 1;
		}

		await this.saveGameState(state);

		return {
			state,
			proposalUpdated: true,
			statusChanged: oldStatus !== newStatus,
		};
	}

	private calculateProposalStatus(
		proposal: ProposalVotes,
	): "open" | "passed" | "failed" | "closed" {
		const totalVotes = Object.keys(proposal.votes).length;

		if (totalVotes < proposal.requiredVotes) {
			return "open";
		}

		const forVotes = Object.values(proposal.votes).filter(
			(v) => v === "FOR",
		).length;
		const againstVotes = Object.values(proposal.votes).filter(
			(v) => v === "AGAINST",
		).length;

		const majority = forVotes / (forVotes + againstVotes);

		if (majority >= proposal.requiredMajority) {
			return "passed";
		} else {
			return "failed";
		}
	}

	private updatePlayerStats(
		state: GameState,
		voter: string,
		proposal: ProposalVotes,
		statusChanged: boolean,
	): void {
		// Initialize player if doesn't exist
		if (!state.players[voter]) {
			state.players[voter] = {
				username: voter,
				points: 0,
				proposalsSubmitted: 0,
				proposalsPassed: 0,
				votesCast: 0,
				lastActive: new Date().toISOString(),
			};
		}

		const player = state.players[voter];
		player.lastActive = new Date().toISOString();
		player.votesCast += 1;

		// Award points if status changed
		if (statusChanged) {
			const forVotes = Object.values(proposal.votes).filter(
				(v) => v === "FOR",
			).length;
			const againstVotes = Object.values(proposal.votes).filter(
				(v) => v === "AGAINST",
			).length;
			const _totalVotes = forVotes + againstVotes;

			if (proposal.status === "passed") {
				// Award points for successful proposal
				if (voter === proposal.proposer) {
					player.points += this.config.pointsForSuccessfulProposal;
					player.proposalsSubmitted += 1;
					player.proposalsPassed += 1;
				} else {
					// Award points for voting with majority
					const voterVote = proposal.votes[voter];
					if (voterVote === "FOR") {
						player.points += this.config.pointsForVotingWithMajority;
					} else {
						player.points += this.config.pointsForParticipation;
					}
				}
			} else if (proposal.status === "failed") {
				// Award points for failed proposal
				if (voter === proposal.proposer) {
					player.points += this.config.pointsForParticipation;
					player.proposalsSubmitted += 1;
				} else {
					// Award points for voting with majority
					const voterVote = proposal.votes[voter];
					if (voterVote === "AGAINST") {
						player.points += this.config.pointsForVotingWithMajority;
					} else {
						player.points += this.config.pointsForParticipation;
					}
				}
			}
		}
	}

	async closeProposal(issueNumber: number): Promise<GameState> {
		const state = await this.loadGameState();
		const proposalKey = issueNumber.toString();

		if (state.proposals[proposalKey]) {
			state.proposals[proposalKey].status = "closed";
			state.proposals[proposalKey].closedAt = new Date().toISOString();
			state.proposals[proposalKey].updatedAt = new Date().toISOString();
			state.lastUpdated = new Date().toISOString();

			await this.saveGameState(state);
		}

		return state;
	}

	async getProposal(issueNumber: number): Promise<ProposalVotes | null> {
		const state = await this.loadGameState();
		return state.proposals[issueNumber.toString()] || null;
	}

	async getAllProposals(): Promise<ProposalVotes[]> {
		const state = await this.loadGameState();
		return Object.values(state.proposals);
	}

	async getPlayerScore(username: string): Promise<PlayerScore | null> {
		const state = await this.loadGameState();
		return state.players[username] || null;
	}

	async getAllPlayerScores(): Promise<PlayerScore[]> {
		const state = await this.loadGameState();
		return Object.values(state.players).sort((a, b) => b.points - a.points);
	}

	async updateScoreboard(): Promise<string> {
		const players = await this.getAllPlayerScores();

		let scoreboard = "# Scoreboard\n\n";
		scoreboard +=
			"User | Points | Proposals | Passed | Votes Cast | Last Active\n";
		scoreboard +=
			"---- | ------ | --------- | ------ | ---------- | ------------\n";

		for (const player of players) {
			const lastActive = new Date(player.lastActive).toLocaleDateString();
			scoreboard += `@${player.username} | ${player.points} | ${player.proposalsSubmitted} | ${player.proposalsPassed} | ${player.votesCast} | ${lastActive}\n`;
		}

		return scoreboard;
	}

	async canMergeProposal(issueNumber: number): Promise<{
		canMerge: boolean;
		reason?: string;
		requiredVotes: number;
		currentVotes: number;
		requiredMajority: number;
		currentMajority: number;
	}> {
		const proposal = await this.getProposal(issueNumber);

		if (!proposal) {
			return {
				canMerge: false,
				reason: "Proposal not found",
				requiredVotes: this.config.requiredVotes,
				currentVotes: 0,
				requiredMajority: this.config.requiredMajority,
				currentMajority: 0,
			};
		}

		const totalVotes = Object.keys(proposal.votes).length;
		const forVotes = Object.values(proposal.votes).filter(
			(v) => v === "FOR",
		).length;
		const againstVotes = Object.values(proposal.votes).filter(
			(v) => v === "AGAINST",
		).length;

		const hasEnoughVotes = totalVotes >= proposal.requiredVotes;
		const hasMajority =
			forVotes / (forVotes + againstVotes) >= proposal.requiredMajority;

		return {
			canMerge: hasEnoughVotes && hasMajority,
			reason:
				hasEnoughVotes && hasMajority
					? undefined
					: "Insufficient votes or majority",
			requiredVotes: proposal.requiredVotes,
			currentVotes: totalVotes,
			requiredMajority: proposal.requiredMajority,
			currentMajority: forVotes / (forVotes + againstVotes),
		};
	}
}
