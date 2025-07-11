import { z } from "zod";

// Base event schema
export const BaseEventSchema = z.object({
	id: z.string(), // UUID for each event
	timestamp: z.string(), // ISO timestamp
	turn: z.number().optional(), // Game turn when event occurred
});

// Event type schemas
export const ProposalCreatedEventSchema = BaseEventSchema.extend({
	type: z.literal("proposal_created"),
	issue_number: z.number(),
	title: z.string(),
	proposer: z.string(),
	body: z.string().optional(),
});

export const VoteCastEventSchema = BaseEventSchema.extend({
	type: z.literal("vote_cast"),
	issue_number: z.number(),
	voter: z.string(),
	vote: z.enum(["FOR", "AGAINST"]),
	comment_id: z.number().optional(),
});

export const ProposalResolvedEventSchema = BaseEventSchema.extend({
	type: z.literal("proposal_resolved"),
	issue_number: z.number(),
	status: z.enum(["passed", "failed", "closed"]),
	final_votes: z.object({
		for: z.number(),
		against: z.number(),
		total: z.number(),
	}),
});

export const RuleEnactedEventSchema = BaseEventSchema.extend({
	type: z.literal("rule_enacted"),
	rule_id: z.string(),
	title: z.string(),
	content: z.string(),
	rule_type: z.enum(["mutable", "immutable"]),
	author: z.string(),
	proposal_issue: z.number(),
});

export const RuleRepealedEventSchema = BaseEventSchema.extend({
	type: z.literal("rule_repealed"),
	rule_id: z.string(),
	repealed_by: z.string(),
	proposal_issue: z.number(),
});

export const RuleAmendedEventSchema = BaseEventSchema.extend({
	type: z.literal("rule_amended"),
	rule_id: z.string(),
	new_content: z.string(),
	amended_by: z.string(),
	proposal_issue: z.number(),
});

export const RuleTransmutedEventSchema = BaseEventSchema.extend({
	type: z.literal("rule_transmuted"),
	rule_id: z.string(),
	old_type: z.enum(["mutable", "immutable"]),
	new_type: z.enum(["mutable", "immutable"]),
	transmuted_by: z.string(),
	proposal_issue: z.number(),
});

export const PlayerJoinedEventSchema = BaseEventSchema.extend({
	type: z.literal("player_joined"),
	username: z.string(),
	joined_via: z.enum(["proposal", "vote", "comment"]),
	first_action_issue: z.number().optional(),
});

export const PointsAwardedEventSchema = BaseEventSchema.extend({
	type: z.literal("points_awarded"),
	player: z.string(),
	points: z.number(),
	reason: z.string(),
	related_issue: z.number().optional(),
	related_event_id: z.string().optional(),
});

export const TurnAdvancedEventSchema = BaseEventSchema.extend({
	type: z.literal("turn_advanced"),
	new_turn: z.number(),
	triggered_by_issue: z.number(),
});

export const GameStartedEventSchema = BaseEventSchema.extend({
	type: z.literal("game_started"),
	initial_rules: z.array(z.string()),
	config: z.object({
		required_votes: z.number(),
		required_majority: z.number(),
		points_for_successful_proposal: z.number(),
		points_for_voting_with_majority: z.number(),
		points_for_participation: z.number(),
	}),
});

// Union of all event types
export const GameEventSchema = z.discriminatedUnion("type", [
	ProposalCreatedEventSchema,
	VoteCastEventSchema,
	ProposalResolvedEventSchema,
	RuleEnactedEventSchema,
	RuleRepealedEventSchema,
	RuleAmendedEventSchema,
	RuleTransmutedEventSchema,
	PlayerJoinedEventSchema,
	PointsAwardedEventSchema,
	TurnAdvancedEventSchema,
	GameStartedEventSchema,
]);

// Type exports
export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type ProposalCreatedEvent = z.infer<typeof ProposalCreatedEventSchema>;
export type VoteCastEvent = z.infer<typeof VoteCastEventSchema>;
export type ProposalResolvedEvent = z.infer<typeof ProposalResolvedEventSchema>;
export type RuleEnactedEvent = z.infer<typeof RuleEnactedEventSchema>;
export type RuleRepealedEvent = z.infer<typeof RuleRepealedEventSchema>;
export type RuleAmendedEvent = z.infer<typeof RuleAmendedEventSchema>;
export type RuleTransmutedEvent = z.infer<typeof RuleTransmutedEventSchema>;
export type PlayerJoinedEvent = z.infer<typeof PlayerJoinedEventSchema>;
export type PointsAwardedEvent = z.infer<typeof PointsAwardedEventSchema>;
export type TurnAdvancedEvent = z.infer<typeof TurnAdvancedEventSchema>;
export type GameStartedEvent = z.infer<typeof GameStartedEventSchema>;

export type GameEvent = z.infer<typeof GameEventSchema>;

// Event log entry (for JSONL format)
export interface EventLogEntry {
	event: GameEvent;
	metadata?: {
		github_event_id?: string;
		github_sha?: string;
		workflow_run_id?: string;
	};
}

// Computed state types (derived from events)
export interface ComputedGameState {
	players: Record<string, ComputedPlayerState>;
	proposals: Record<string, ComputedProposalState>;
	rules: Record<string, ComputedRuleState>;
	current_turn: number;
	game_started_at: string;
	last_updated: string;
	event_count: number;
}

export interface ComputedPlayerState {
	username: string;
	points: number;
	proposals_submitted: number;
	proposals_passed: number;
	votes_cast: number;
	first_seen: string;
	last_active: string;
	point_history: Array<{
		points: number;
		reason: string;
		timestamp: string;
		event_id: string;
	}>;
}

export interface ComputedProposalState {
	issue_number: number;
	title: string;
	proposer: string;
	status: "open" | "passed" | "failed" | "closed";
	votes: Record<string, "FOR" | "AGAINST">;
	created_at: string;
	resolved_at?: string;
	final_vote_count?: {
		for: number;
		against: number;
		total: number;
	};
}

export interface ComputedRuleState {
	rule_id: string;
	title: string;
	content: string;
	rule_type: "mutable" | "immutable";
	status: "active" | "repealed";
	author: string;
	enacted_at: string;
	repealed_at?: string;
	amendment_history: Array<{
		content: string;
		amended_by: string;
		amended_at: string;
		event_id: string;
	}>;
	transmutation_history: Array<{
		old_type: "mutable" | "immutable";
		new_type: "mutable" | "immutable";
		transmuted_by: string;
		transmuted_at: string;
		event_id: string;
	}>;
} 