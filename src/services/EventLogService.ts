import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import {
	GameEvent,
	GameEventSchema,
	EventLogEntry,
} from "../types/events";
import type { GameConfig } from "../types";

export class EventLogService {
	private eventLogPath: string;
	private config: GameConfig;

	constructor(eventLogPath: string = "events/game-events.jsonl", config: GameConfig) {
		this.eventLogPath = eventLogPath;
		this.config = config;
		this.ensureEventLogExists();
	}

	/**
	 * Append a new event to the event log
	 */
	async appendEvent(
		eventData: Omit<GameEvent, "id" | "timestamp">,
		metadata?: EventLogEntry["metadata"]
	): Promise<GameEvent> {
		const event: GameEvent = {
			...eventData,
			id: randomUUID(),
			timestamp: new Date().toISOString(),
		} as GameEvent;

		// Validate the event
		const validatedEvent = GameEventSchema.parse(event);

		const logEntry: EventLogEntry = {
			event: validatedEvent,
			metadata,
		};

		// Append to JSONL file
		const jsonLine = JSON.stringify(logEntry) + "\n";
		await fs.promises.appendFile(this.eventLogPath, jsonLine, "utf-8");

		console.log(`Event appended: ${event.type} (${event.id})`);
		return validatedEvent;
	}

	/**
	 * Read all events from the event log
	 */
	async readAllEvents(): Promise<EventLogEntry[]> {
		try {
			const content = await fs.promises.readFile(this.eventLogPath, "utf-8");
			const lines = content.trim().split("\n").filter(line => line.trim());
			
			return lines.map(line => {
				try {
					return JSON.parse(line) as EventLogEntry;
				} catch (error) {
					console.error(`Failed to parse event log line: ${line}`, error);
					throw new Error(`Invalid event log format: ${error}`);
				}
			});
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	/**
	 * Read events from a specific point in time
	 */
	async readEventsSince(timestamp: string): Promise<EventLogEntry[]> {
		const allEvents = await this.readAllEvents();
		return allEvents.filter(entry => entry.event.timestamp > timestamp);
	}

	/**
	 * Read events of a specific type
	 */
	async readEventsByType<T extends GameEvent["type"]>(
		eventType: T
	): Promise<EventLogEntry[]> {
		const allEvents = await this.readAllEvents();
		return allEvents.filter(entry => entry.event.type === eventType);
	}

	/**
	 * Read events for a specific issue/proposal
	 */
	async readEventsForIssue(issueNumber: number): Promise<EventLogEntry[]> {
		const allEvents = await this.readAllEvents();
		return allEvents.filter(entry => {
			const event = entry.event;
			return (
				("issue_number" in event && event.issue_number === issueNumber) ||
				("proposal_issue" in event && event.proposal_issue === issueNumber) ||
				("related_issue" in event && event.related_issue === issueNumber) ||
				("triggered_by_issue" in event && event.triggered_by_issue === issueNumber) ||
				("first_action_issue" in event && event.first_action_issue === issueNumber)
			);
		});
	}

	/**
	 * Read events for a specific player
	 */
	async readEventsForPlayer(username: string): Promise<EventLogEntry[]> {
		const allEvents = await this.readAllEvents();
		return allEvents.filter(entry => {
			const event = entry.event;
			return (
				("proposer" in event && event.proposer === username) ||
				("voter" in event && event.voter === username) ||
				("player" in event && event.player === username) ||
				("username" in event && event.username === username) ||
				("author" in event && event.author === username) ||
				("repealed_by" in event && event.repealed_by === username) ||
				("amended_by" in event && event.amended_by === username) ||
				("transmuted_by" in event && event.transmuted_by === username)
			);
		});
	}

	/**
	 * Get the latest event
	 */
	async getLatestEvent(): Promise<EventLogEntry | null> {
		const events = await this.readAllEvents();
		return events.length > 0 ? events[events.length - 1] : null;
	}

	/**
	 * Get event count
	 */
	async getEventCount(): Promise<number> {
		const events = await this.readAllEvents();
		return events.length;
	}

	/**
	 * Validate the integrity of the event log
	 */
	async validateEventLog(): Promise<{
		isValid: boolean;
		errors: string[];
		eventCount: number;
	}> {
		const errors: string[] = [];
		let eventCount = 0;

		try {
			const content = await fs.promises.readFile(this.eventLogPath, "utf-8");
			const lines = content.trim().split("\n").filter(line => line.trim());
			
			for (let i = 0; i < lines.length; i++) {
				const lineNumber = i + 1;
				try {
					const entry = JSON.parse(lines[i]) as EventLogEntry;
					
					// Validate event structure
					GameEventSchema.parse(entry.event);
					
					// Check for duplicate IDs (this would be expensive for large logs)
					// In production, you might want to use a more efficient approach
					
					eventCount++;
				} catch (error) {
					errors.push(`Line ${lineNumber}: Invalid event format - ${error}`);
				}
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				// File doesn't exist, that's okay
				return { isValid: true, errors: [], eventCount: 0 };
			}
			errors.push(`Failed to read event log: ${error}`);
		}

		return {
			isValid: errors.length === 0,
			errors,
			eventCount,
		};
	}

	/**
	 * Create a backup of the event log
	 */
	async createBackup(): Promise<string> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const backupPath = `${this.eventLogPath}.backup-${timestamp}`;
		
		try {
			await fs.promises.copyFile(this.eventLogPath, backupPath);
			console.log(`Event log backup created: ${backupPath}`);
			return backupPath;
		} catch (error) {
			console.error(`Failed to create backup: ${error}`);
			throw error;
		}
	}

	/**
	 * Initialize the game with a game_started event
	 */
	async initializeGame(initialRules: string[]): Promise<GameEvent> {
		const eventData = {
			type: "game_started" as const,
			initial_rules: initialRules,
			config: {
				required_votes: this.config.requiredVotes,
				required_majority: this.config.requiredMajority,
				points_for_successful_proposal: this.config.pointsForSuccessfulProposal,
				points_for_voting_with_majority: this.config.pointsForVotingWithMajority,
				points_for_participation: this.config.pointsForParticipation,
			},
		};

		const gameStartedEvent = await this.appendEvent(eventData);
		return gameStartedEvent;
	}

	/**
	 * Ensure the event log directory and file exist
	 */
	private ensureEventLogExists(): void {
		const dir = path.dirname(this.eventLogPath);
		
		// Create directory if it doesn't exist
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		// Create file if it doesn't exist
		if (!fs.existsSync(this.eventLogPath)) {
			fs.writeFileSync(this.eventLogPath, "", "utf-8");
		}
	}

	/**
	 * Get statistics about the event log
	 */
	async getEventLogStats(): Promise<{
		totalEvents: number;
		eventsByType: Record<string, number>;
		firstEvent?: string;
		lastEvent?: string;
		uniquePlayers: number;
		uniqueProposals: number;
	}> {
		const events = await this.readAllEvents();
		const eventsByType: Record<string, number> = {};
		const players = new Set<string>();
		const proposals = new Set<number>();

		for (const entry of events) {
			const event = entry.event;
			
			// Count by type
			eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

			// Track unique players
			if ("proposer" in event) players.add(event.proposer);
			if ("voter" in event) players.add(event.voter);
			if ("player" in event) players.add(event.player);
			if ("username" in event) players.add(event.username);
			if ("author" in event) players.add(event.author);

			// Track unique proposals
			if ("issue_number" in event) proposals.add(event.issue_number);
			if ("proposal_issue" in event) proposals.add(event.proposal_issue);
		}

		return {
			totalEvents: events.length,
			eventsByType,
			firstEvent: events.length > 0 ? events[0].event.timestamp : undefined,
			lastEvent: events.length > 0 ? events[events.length - 1].event.timestamp : undefined,
			uniquePlayers: players.size,
			uniqueProposals: proposals.size,
		};
	}
} 