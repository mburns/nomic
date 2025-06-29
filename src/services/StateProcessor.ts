import {
	EventLogEntry,
	ComputedGameState,
	ComputedPlayerState,
	ComputedProposalState,
	ComputedRuleState,
	GameEvent,
} from "../types/events";
import { EventLogService } from "./EventLogService";

export class StateProcessor {
	private eventLogService: EventLogService;

	constructor(eventLogService: EventLogService) {
		this.eventLogService = eventLogService;
	}

	/**
	 * Compute the current game state from all events
	 */
	async computeCurrentState(): Promise<ComputedGameState> {
		const events = await this.eventLogService.readAllEvents();
		
		const state: ComputedGameState = {
			players: {},
			proposals: {},
			rules: {},
			current_turn: 1,
			game_started_at: new Date().toISOString(),
			last_updated: new Date().toISOString(),
			event_count: events.length,
		};

		// Process events in chronological order
		for (const entry of events) {
			this.processEvent(state, entry);
		}

		// Update last_updated timestamp
		if (events.length > 0) {
			state.last_updated = events[events.length - 1].event.timestamp;
		}

		return state;
	}

	/**
	 * Process a single event and update the state
	 */
	private processEvent(state: ComputedGameState, entry: EventLogEntry): void {
		const event = entry.event;

		switch (event.type) {
			case "game_started":
				this.processGameStarted(state, event);
				break;
			case "proposal_created":
				this.processProposalCreated(state, event);
				break;
			case "vote_cast":
				this.processVoteCast(state, event);
				break;
			case "proposal_resolved":
				this.processProposalResolved(state, event);
				break;
			case "rule_enacted":
				this.processRuleEnacted(state, event);
				break;
			case "rule_repealed":
				this.processRuleRepealed(state, event);
				break;
			case "rule_amended":
				this.processRuleAmended(state, event);
				break;
			case "rule_transmuted":
				this.processRuleTransmuted(state, event);
				break;
			case "player_joined":
				this.processPlayerJoined(state, event);
				break;
			case "points_awarded":
				this.processPointsAwarded(state, event);
				break;
			case "turn_advanced":
				this.processTurnAdvanced(state, event);
				break;
			default:
				console.warn(`Unknown event type: ${(event as any).type}`);
		}
	}

	private processGameStarted(state: ComputedGameState, event: GameEvent & { type: "game_started" }): void {
		state.game_started_at = event.timestamp;
		state.current_turn = 1;
		
		// Initialize rules from the initial set
		for (const ruleId of event.initial_rules) {
			state.rules[ruleId] = {
				rule_id: ruleId,
				title: `Rule ${ruleId}`,
				content: `Initial rule ${ruleId}`,
				rule_type: ruleId.startsWith("1") ? "immutable" : "mutable",
				status: "active",
				author: "system",
				enacted_at: event.timestamp,
				amendment_history: [],
				transmutation_history: [],
			};
		}
	}

	private processProposalCreated(state: ComputedGameState, event: GameEvent & { type: "proposal_created" }): void {
		// Ensure player exists
		this.ensurePlayerExists(state, event.proposer, event.timestamp);

		// Create proposal
		state.proposals[event.issue_number.toString()] = {
			issue_number: event.issue_number,
			title: event.title,
			proposer: event.proposer,
			status: "open",
			votes: {},
			created_at: event.timestamp,
		};

		// Update player stats
		state.players[event.proposer].proposals_submitted++;
		state.players[event.proposer].last_active = event.timestamp;
	}

	private processVoteCast(state: ComputedGameState, event: GameEvent & { type: "vote_cast" }): void {
		// Ensure player exists
		this.ensurePlayerExists(state, event.voter, event.timestamp);

		// Update proposal votes
		const proposalKey = event.issue_number.toString();
		if (state.proposals[proposalKey]) {
			state.proposals[proposalKey].votes[event.voter] = event.vote;
		}

		// Update player stats
		state.players[event.voter].votes_cast++;
		state.players[event.voter].last_active = event.timestamp;
	}

	private processProposalResolved(state: ComputedGameState, event: GameEvent & { type: "proposal_resolved" }): void {
		const proposalKey = event.issue_number.toString();
		if (state.proposals[proposalKey]) {
			state.proposals[proposalKey].status = event.status;
			state.proposals[proposalKey].resolved_at = event.timestamp;
			state.proposals[proposalKey].final_vote_count = event.final_votes;

			// Update proposer stats if passed
			if (event.status === "passed") {
				const proposer = state.proposals[proposalKey].proposer;
				if (state.players[proposer]) {
					state.players[proposer].proposals_passed++;
				}
			}
		}
	}

	private processRuleEnacted(state: ComputedGameState, event: GameEvent & { type: "rule_enacted" }): void {
		state.rules[event.rule_id] = {
			rule_id: event.rule_id,
			title: event.title,
			content: event.content,
			rule_type: event.rule_type,
			status: "active",
			author: event.author,
			enacted_at: event.timestamp,
			amendment_history: [],
			transmutation_history: [],
		};
	}

	private processRuleRepealed(state: ComputedGameState, event: GameEvent & { type: "rule_repealed" }): void {
		if (state.rules[event.rule_id]) {
			state.rules[event.rule_id].status = "repealed";
			state.rules[event.rule_id].repealed_at = event.timestamp;
		}
	}

	private processRuleAmended(state: ComputedGameState, event: GameEvent & { type: "rule_amended" }): void {
		if (state.rules[event.rule_id]) {
			// Add to amendment history
			state.rules[event.rule_id].amendment_history.push({
				content: event.new_content,
				amended_by: event.amended_by,
				amended_at: event.timestamp,
				event_id: event.id,
			});

			// Update current content
			state.rules[event.rule_id].content = event.new_content;
		}
	}

	private processRuleTransmuted(state: ComputedGameState, event: GameEvent & { type: "rule_transmuted" }): void {
		if (state.rules[event.rule_id]) {
			// Add to transmutation history
			state.rules[event.rule_id].transmutation_history.push({
				old_type: event.old_type,
				new_type: event.new_type,
				transmuted_by: event.transmuted_by,
				transmuted_at: event.timestamp,
				event_id: event.id,
			});

			// Update current type
			state.rules[event.rule_id].rule_type = event.new_type;
		}
	}

	private processPlayerJoined(state: ComputedGameState, event: GameEvent & { type: "player_joined" }): void {
		this.ensurePlayerExists(state, event.username, event.timestamp);
	}

	private processPointsAwarded(state: ComputedGameState, event: GameEvent & { type: "points_awarded" }): void {
		// Ensure player exists
		this.ensurePlayerExists(state, event.player, event.timestamp);

		// Award points
		state.players[event.player].points += event.points;
		state.players[event.player].last_active = event.timestamp;

		// Add to point history
		state.players[event.player].point_history.push({
			points: event.points,
			reason: event.reason,
			timestamp: event.timestamp,
			event_id: event.id,
		});
	}

	private processTurnAdvanced(state: ComputedGameState, event: GameEvent & { type: "turn_advanced" }): void {
		state.current_turn = event.new_turn;
	}

	private ensurePlayerExists(state: ComputedGameState, username: string, timestamp: string): void {
		if (!state.players[username]) {
			state.players[username] = {
				username,
				points: 0,
				proposals_submitted: 0,
				proposals_passed: 0,
				votes_cast: 0,
				first_seen: timestamp,
				last_active: timestamp,
				point_history: [],
			};
		}
	}

	/**
	 * Get current state for a specific player
	 */
	async getPlayerState(username: string): Promise<ComputedPlayerState | null> {
		const state = await this.computeCurrentState();
		return state.players[username] || null;
	}

	/**
	 * Get current state for a specific proposal
	 */
	async getProposalState(issueNumber: number): Promise<ComputedProposalState | null> {
		const state = await this.computeCurrentState();
		return state.proposals[issueNumber.toString()] || null;
	}

	/**
	 * Get current state for a specific rule
	 */
	async getRuleState(ruleId: string): Promise<ComputedRuleState | null> {
		const state = await this.computeCurrentState();
		return state.rules[ruleId] || null;
	}

	/**
	 * Get all active rules
	 */
	async getActiveRules(): Promise<ComputedRuleState[]> {
		const state = await this.computeCurrentState();
		return Object.values(state.rules).filter(rule => rule.status === "active");
	}

	/**
	 * Get all players sorted by points
	 */
	async getPlayerLeaderboard(): Promise<ComputedPlayerState[]> {
		const state = await this.computeCurrentState();
		return Object.values(state.players).sort((a, b) => b.points - a.points);
	}

	/**
	 * Get proposal statistics
	 */
	async getProposalStats(): Promise<{
		total: number;
		open: number;
		passed: number;
		failed: number;
		closed: number;
	}> {
		const state = await this.computeCurrentState();
		const proposals = Object.values(state.proposals);

		return {
			total: proposals.length,
			open: proposals.filter(p => p.status === "open").length,
			passed: proposals.filter(p => p.status === "passed").length,
			failed: proposals.filter(p => p.status === "failed").length,
			closed: proposals.filter(p => p.status === "closed").length,
		};
	}

	/**
	 * Check if a proposal can be merged based on current votes and rules
	 */
	async canMergeProposal(issueNumber: number, config: {
		requiredVotes: number;
		requiredMajority: number;
	}): Promise<{
		canMerge: boolean;
		reason?: string;
		currentVotes: number;
		forVotes: number;
		againstVotes: number;
		majority: number;
	}> {
		const proposal = await this.getProposalState(issueNumber);
		
		if (!proposal) {
			return {
				canMerge: false,
				reason: "Proposal not found",
				currentVotes: 0,
				forVotes: 0,
				againstVotes: 0,
				majority: 0,
			};
		}

		if (proposal.status !== "open") {
			return {
				canMerge: false,
				reason: `Proposal is ${proposal.status}`,
				currentVotes: 0,
				forVotes: 0,
				againstVotes: 0,
				majority: 0,
			};
		}

		const votes = Object.values(proposal.votes);
		const forVotes = votes.filter(v => v === "FOR").length;
		const againstVotes = votes.filter(v => v === "AGAINST").length;
		const totalVotes = forVotes + againstVotes;
		const majority = totalVotes > 0 ? forVotes / totalVotes : 0;

		if (totalVotes < config.requiredVotes) {
			return {
				canMerge: false,
				reason: `Insufficient votes (${totalVotes}/${config.requiredVotes})`,
				currentVotes: totalVotes,
				forVotes,
				againstVotes,
				majority,
			};
		}

		if (majority < config.requiredMajority) {
			return {
				canMerge: false,
				reason: `Insufficient majority (${(majority * 100).toFixed(1)}% < ${(config.requiredMajority * 100).toFixed(1)}%)`,
				currentVotes: totalVotes,
				forVotes,
				againstVotes,
				majority,
			};
		}

		return {
			canMerge: true,
			currentVotes: totalVotes,
			forVotes,
			againstVotes,
			majority,
		};
	}

	/**
	 * Compute state up to a specific point in time (for historical analysis)
	 */
	async computeStateAtTime(timestamp: string): Promise<ComputedGameState> {
		const allEvents = await this.eventLogService.readAllEvents();
		const eventsUpToTime = allEvents.filter(entry => entry.event.timestamp <= timestamp);
		
		const state: ComputedGameState = {
			players: {},
			proposals: {},
			rules: {},
			current_turn: 1,
			game_started_at: new Date().toISOString(),
			last_updated: timestamp,
			event_count: eventsUpToTime.length,
		};

		// Process events in chronological order
		for (const entry of eventsUpToTime) {
			this.processEvent(state, entry);
		}

		return state;
	}
} 