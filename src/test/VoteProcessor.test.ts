import {
	formatProposalStatus,
	formatVoteInstructions,
	formatVoteSummary,
	isValidVote,
	parseVoteFromComment,
} from "../services/VoteProcessor";
import type { GitHubComment, VoteType } from "../types";

describe("VoteProcessor", () => {
	const mockComment = (
		body: string,
		user: string = "testuser",
	): GitHubComment => ({
		id: 1,
		body,
		user: {
			login: user,
			id: 1,
			type: "User",
		},
		created_at: "2023-01-01T00:00:00Z",
		updated_at: "2023-01-01T00:00:00Z",
	});

	describe("parseVoteFromComment", () => {
		it("should parse VOTE: FOR format", () => {
			const comment = mockComment("VOTE: FOR");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "FOR",
			});
		});

		it("should parse VOTE: AGAINST format", () => {
			const comment = mockComment("VOTE: AGAINST");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "AGAINST",
			});
		});

		it('should parse "I vote FOR" format', () => {
			const comment = mockComment("I vote FOR");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "FOR",
			});
		});

		it('should parse "My vote is AGAINST" format', () => {
			const comment = mockComment("My vote is AGAINST");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "AGAINST",
			});
		});

		it('should parse "Voting FOR" format', () => {
			const comment = mockComment("Voting FOR");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "FOR",
			});
		});

		it("should parse emoji formats", () => {
			const forComment = mockComment("✅ FOR");
			const againstComment = mockComment("❌ AGAINST");

			expect(parseVoteFromComment(forComment)).toEqual({
				voter: "testuser",
				vote: "FOR",
			});

			expect(parseVoteFromComment(againstComment)).toEqual({
				voter: "testuser",
				vote: "AGAINST",
			});
		});

		it("should handle case insensitive votes", () => {
			const comment = mockComment("vote: for");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "FOR",
			});
		});

		it("should return null for invalid vote formats", () => {
			const invalidComments = [
				"Just a comment",
				"I agree",
				"VOTE: maybe",
				"I vote maybe",
				"This is not a vote",
			];

			invalidComments.forEach((body) => {
				const comment = mockComment(body);
				const result = parseVoteFromComment(comment);
				expect(result).toBeNull();
			});
		});

		it("should handle whitespace", () => {
			const comment = mockComment("  VOTE: FOR  ");
			const result = parseVoteFromComment(comment);

			expect(result).toEqual({
				voter: "testuser",
				vote: "FOR",
			});
		});
	});

	describe("isValidVote", () => {
		it("should return true for valid votes", () => {
			expect(isValidVote("FOR")).toBe(true);
			expect(isValidVote("AGAINST")).toBe(true);
		});

		it("should return false for invalid votes", () => {
			expect(isValidVote("maybe")).toBe(false);
			expect(isValidVote("abstain")).toBe(false);
			expect(isValidVote("")).toBe(false);
		});
	});

	describe("formatVoteSummary", () => {
		it("should format empty votes", () => {
			const result = formatVoteSummary({});
			expect(result).toBe("No votes cast yet.");
		});

		it("should format votes with only FOR votes", () => {
			const votes = {
				user1: "FOR" as VoteType,
				user2: "FOR" as VoteType,
			};

			const result = formatVoteSummary(votes);
			expect(result).toContain("**Vote Summary:** 2 FOR, 0 AGAINST");
			expect(result).toContain("**FOR:** @user1, @user2");
			expect(result).toContain("**Majority:** 100.0% FOR");
		});

		it("should format votes with only AGAINST votes", () => {
			const votes = {
				user1: "AGAINST" as VoteType,
				user2: "AGAINST" as VoteType,
			};

			const result = formatVoteSummary(votes);
			expect(result).toContain("**Vote Summary:** 0 FOR, 2 AGAINST");
			expect(result).toContain("**AGAINST:** @user1, @user2");
			expect(result).toContain("**Majority:** 0.0% FOR");
		});

		it("should format mixed votes", () => {
			const votes = {
				user1: "FOR" as VoteType,
				user2: "AGAINST" as VoteType,
				user3: "FOR" as VoteType,
			};

			const result = formatVoteSummary(votes);
			expect(result).toContain("**Vote Summary:** 2 FOR, 1 AGAINST");
			expect(result).toContain("**FOR:** @user1, @user3");
			expect(result).toContain("**AGAINST:** @user2");
			expect(result).toContain("**Majority:** 66.7% FOR");
		});
	});

	describe("formatVoteInstructions", () => {
		it("should return formatted instructions", () => {
			const result = formatVoteInstructions();

			expect(result).toContain("## How to Vote");
			expect(result).toContain("VOTE: FOR");
			expect(result).toContain("VOTE: AGAINST");
			expect(result).toContain("I vote FOR");
			expect(result).toContain("I vote AGAINST");
			expect(result).toContain("✅ FOR");
			expect(result).toContain("❌ AGAINST");
		});
	});

	describe("formatProposalStatus", () => {
		const mockProposal = {
			status: "open",
			requiredVotes: 3,
			requiredMajority: 0.5,
			votes: {} as Record<string, VoteType>,
		};

		it("should format open proposal with no votes", () => {
			const result = formatProposalStatus(mockProposal);

			expect(result).toContain("## Proposal Status: OPEN");
			expect(result).toContain("**Required Votes:** 3");
			expect(result).toContain("**Current Votes:** 0");
			expect(result).toContain("**Required Majority:** 50.0%");
			expect(result).toContain("⏳ **Waiting for 3 more vote(s)**");
		});

		it("should format open proposal with insufficient votes", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "FOR" as VoteType,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("**Current Votes:** 2");
			expect(result).toContain("⏳ **Waiting for 1 more vote(s)**");
		});

		it("should format open proposal with insufficient majority", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "AGAINST" as VoteType,
					user3: "AGAINST" as VoteType,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("**Current Votes:** 3");
			expect(result).toContain("**Current Majority:** 33.3% FOR");
			expect(result).toContain("❌ **Insufficient majority**");
		});

		it("should format ready to merge proposal", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "FOR" as VoteType,
					user3: "FOR" as VoteType,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("**Current Votes:** 3");
			expect(result).toContain("**Current Majority:** 100.0% FOR");
			expect(result).toContain("✅ **Ready to merge!**");
		});

		it("should format passed proposal", () => {
			const proposal = {
				...mockProposal,
				status: "passed",
				votes: {
					user1: "FOR" as VoteType,
					user2: "FOR" as VoteType,
					user3: "FOR" as VoteType,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("## Proposal Status: PASSED");
			expect(result).toContain("🎉 **Proposal PASSED!**");
		});

		it("should format failed proposal", () => {
			const proposal = {
				...mockProposal,
				status: "failed",
				votes: {
					user1: "AGAINST" as VoteType,
					user2: "AGAINST" as VoteType,
					user3: "AGAINST" as VoteType,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("## Proposal Status: FAILED");
			expect(result).toContain("❌ **Proposal FAILED**");
		});

		it("should include merge check information when provided", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "FOR" as VoteType,
				},
				mergeCheck: {
					canMerge: false,
					reason: "Insufficient votes or majority",
					requiredVotes: 3,
					currentVotes: 2,
					requiredMajority: 0.5,
					currentMajority: 1.0,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("## Merge Status");
			expect(result).toContain("❌ **Cannot merge**");
			expect(result).toContain("**Reason:** Insufficient votes or majority");
			expect(result).toContain("Need 1 more vote(s) (2/3)");
		});

		it("should show ready to merge when merge check passes", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "FOR" as VoteType,
					user3: "FOR" as VoteType,
				},
				mergeCheck: {
					canMerge: true,
					requiredVotes: 3,
					currentVotes: 3,
					requiredMajority: 0.5,
					currentMajority: 1.0,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("## Merge Status");
			expect(result).toContain("✅ **Ready to merge!**");
		});

		it("should show insufficient majority details", () => {
			const proposal = {
				...mockProposal,
				votes: {
					user1: "FOR" as VoteType,
					user2: "AGAINST" as VoteType,
					user3: "AGAINST" as VoteType,
				},
				mergeCheck: {
					canMerge: false,
					reason: "Insufficient votes or majority",
					requiredVotes: 3,
					currentVotes: 3,
					requiredMajority: 0.5,
					currentMajority: 0.33,
				},
			};

			const result = formatProposalStatus(proposal);

			expect(result).toContain("## Merge Status");
			expect(result).toContain("❌ **Cannot merge**");
			expect(result).toContain("Insufficient majority: 33.3% FOR (need 50.0%)");
		});
	});
});
