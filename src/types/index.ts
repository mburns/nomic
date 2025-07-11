import { z } from "zod";

// GitHub API types
export const GitHubUserSchema = z.object({
	login: z.string(),
	id: z.number(),
	type: z.string(),
});

export const GitHubCommentSchema = z.object({
	id: z.number(),
	body: z.string(),
	user: GitHubUserSchema,
	created_at: z.string(),
	updated_at: z.string(),
});

export const GitHubIssueSchema = z.object({
	number: z.number(),
	title: z.string(),
	body: z.string(),
	state: z.enum(["open", "closed"]),
	user: GitHubUserSchema,
	created_at: z.string(),
	updated_at: z.string(),
	closed_at: z.string().nullable(),
	labels: z.array(z.object({ name: z.string() })),
});

export const GitHubEventSchema = z.object({
	action: z.string(),
	issue: GitHubIssueSchema,
	repository: z.object({
		owner: GitHubUserSchema,
		name: z.string(),
		full_name: z.string(),
	}),
});

// Game types
export const VoteType = z.enum(["FOR", "AGAINST"]);
export type VoteType = z.infer<typeof VoteType>;

export const VoteSchema = z.object({
	voter: z.string(),
	vote: VoteType,
	timestamp: z.string(),
});

export const ProposalVotesSchema = z.object({
	issueNumber: z.number(),
	title: z.string(),
	proposer: z.string(),
	votes: z.record(z.string(), VoteType),
	status: z.enum(["open", "passed", "failed", "closed"]),
	createdAt: z.string(),
	updatedAt: z.string(),
	closedAt: z.string().optional(),
	requiredVotes: z.number().default(3),
	requiredMajority: z.number().default(0.5),
});

export const PlayerScoreSchema = z.object({
	username: z.string(),
	points: z.number(),
	proposalsSubmitted: z.number(),
	proposalsPassed: z.number(),
	votesCast: z.number(),
	lastActive: z.string(),
});

export const GameStateSchema = z.object({
	players: z.record(z.string(), PlayerScoreSchema),
	proposals: z.record(z.string(), ProposalVotesSchema),
	gameRules: z.array(z.string()),
	currentTurn: z.number(),
	lastUpdated: z.string(),
});

// Rule types
export const RuleSchema = z.object({
	id: z.string(),
	title: z.string(),
	content: z.string(),
	author: z.string(),
	status: z.enum(["proposed", "active", "repealed"]),
	type: z.enum(["mutable", "immutable"]),
	tags: z.array(z.string()),
	createdAt: z.string(),
	updatedAt: z.string(),
	repealedAt: z.string().optional(),
});

export type GitHubUser = z.infer<typeof GitHubUserSchema>;
export type GitHubComment = z.infer<typeof GitHubCommentSchema>;
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>;
export type GitHubEvent = z.infer<typeof GitHubEventSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type ProposalVotes = z.infer<typeof ProposalVotesSchema>;
export type PlayerScore = z.infer<typeof PlayerScoreSchema>;
export type GameState = z.infer<typeof GameStateSchema>;
export type Rule = z.infer<typeof RuleSchema>;

// Configuration types
export interface GameConfig {
	requiredVotes: number;
	requiredMajority: number;
	pointsForSuccessfulProposal: number;
	pointsForVotingWithMajority: number;
	pointsForParticipation: number;
	autoMergeEnabled: boolean;
	branchProtectionEnabled: boolean;
}

export interface GitHubConfig {
	token: string;
	owner: string;
	repo: string;
	baseBranch: string;
}
